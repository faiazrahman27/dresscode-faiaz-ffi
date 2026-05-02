import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import {
  createBulkQrCodes,
  createQrCode,
  deleteQrCode,
  generatePublicCode,
  generateScratchCode,
  normalizeAssignedEmail,
  updateQrCode,
} from '../lib/dashboard'

const QR_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,79}$/
const SCRATCH_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const CODE_TYPES = new Set(['open', 'locked'])
const FILTER_OPTIONS = new Set(['all', 'pending', 'redeemed', 'open', 'locked', 'templated'])
const SORT_OPTIONS = new Set([
  'created_desc',
  'created_asc',
  'label_asc',
  'label_desc',
  'code_asc',
  'code_desc',
])

const LIMITS = {
  code: 80,
  scratch: 14,
  prefix: 12,
  label: 120,
  labelPrefix: 120,
  email: 254,
  search: 180,
  bulkMin: 1,
  bulkMax: 500,
}

function sanitizeLiveText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .slice(0, maxLength)
}

function sanitizeSingleLineText(value, maxLength) {
  return sanitizeLiveText(value, maxLength).replace(/\s+/g, ' ').trim()
}

function sanitizeCodeValue(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .slice(0, LIMITS.code)
}

function sanitizeScratchValue(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .slice(0, LIMITS.scratch)
}

function sanitizePrefixValue(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, LIMITS.prefix)
}

function sanitizeEmailValue(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .slice(0, LIMITS.email)
}

function sanitizeCodeType(value) {
  return CODE_TYPES.has(value) ? value : 'open'
}

function sanitizeSearchValue(value) {
  return sanitizeLiveText(value, LIMITS.search)
}

function isValidAssignedEmail(email) {
  if (!email) return true
  return email.length <= LIMITS.email && EMAIL_PATTERN.test(email)
}

function isValidTemplateId(templateId, templates) {
  if (!templateId) return false
  return templates.some((template) => template.id === templateId)
}

function safeCsvValue(value) {
  let normalized = String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ')

  // Prevent CSV formula injection when admin-exported CSV is opened in spreadsheet software.
  if (/^[=+\-@]/.test(normalized.trim())) {
    normalized = `'${normalized}`
  }

  return `"${normalized.replace(/"/g, '""')}"`
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function exportCsv(rows) {
  const headers = [
    'Code',
    'Scratch Code',
    'Label',
    'Type',
    'Status',
    'Created At',
    'URL',
    'Template ID',
    'Assigned Email',
  ]

  const body = rows.map((row) => [
    row.code || '',
    row.scratch_code || '',
    row.label || '',
    row.code_type || '',
    row.activated ? 'Redeemed' : 'Pending',
    row.created_at || '',
    `${window.location.origin}/p/${row.code}`,
    row.template_id || '',
    row.assigned_email || '',
  ])

  const csv = [headers, ...body]
    .map((line) => line.map((value) => safeCsvValue(value)).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, 'dresscode-qr-codes.csv')
  URL.revokeObjectURL(url)
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function validateSingleQrForm(form, templates, currentUserId) {
  const code = sanitizeCodeValue(form.code)
  const scratchCode = sanitizeScratchValue(form.scratch_code)
  const label = sanitizeSingleLineText(form.label, LIMITS.label)
  const codeType = sanitizeCodeType(form.code_type)
  const templateId = form.template_id || ''
  const assignedEmail = normalizeAssignedEmail(sanitizeEmailValue(form.assigned_email))

  if (!currentUserId) {
    return { payload: null, error: 'Admin user context is missing.' }
  }

  if (!QR_CODE_PATTERN.test(code)) {
    return {
      payload: null,
      error: 'Public code must be 3–80 characters and may only contain letters, numbers, hyphens, or underscores.',
    }
  }

  if (!SCRATCH_CODE_PATTERN.test(scratchCode)) {
    return {
      payload: null,
      error: 'Scratch code must use the format XXXX-XXXX-XXXX.',
    }
  }

  if (assignedEmail && !isValidAssignedEmail(assignedEmail)) {
    return {
      payload: null,
      error: 'Assigned email is not valid.',
    }
  }

  if (codeType === 'locked' && !isValidTemplateId(templateId, templates)) {
    return {
      payload: null,
      error: 'Locked QR codes must have a valid template assigned.',
    }
  }

  return {
    payload: {
      code,
      scratch_code: scratchCode,
      label,
      code_type: codeType,
      template_id: codeType === 'locked' ? templateId : null,
      assigned_email: assignedEmail,
      created_by: currentUserId,
    },
    error: '',
  }
}

function validateBulkQrForm(bulkForm, templates, currentUserId) {
  const count = Number(bulkForm.count)
  const prefix = sanitizePrefixValue(bulkForm.prefix) || 'DC'
  const labelPrefix = sanitizeSingleLineText(bulkForm.labelPrefix, LIMITS.labelPrefix)
  const codeType = sanitizeCodeType(bulkForm.code_type)
  const templateId = bulkForm.template_id || ''
  const assignedEmail = normalizeAssignedEmail(sanitizeEmailValue(bulkForm.assigned_email))

  if (!currentUserId) {
    return { payload: null, error: 'Admin user context is missing.' }
  }

  if (!Number.isInteger(count) || count < LIMITS.bulkMin || count > LIMITS.bulkMax) {
    return {
      payload: null,
      error: `Bulk count must be between ${LIMITS.bulkMin} and ${LIMITS.bulkMax}.`,
    }
  }

  if (!/^[A-Z0-9]{1,12}$/.test(prefix)) {
    return {
      payload: null,
      error: 'Code prefix must contain only letters and numbers.',
    }
  }

  if (assignedEmail && !isValidAssignedEmail(assignedEmail)) {
    return {
      payload: null,
      error: 'Assigned email is not valid.',
    }
  }

  if (codeType === 'locked' && !isValidTemplateId(templateId, templates)) {
    return {
      payload: null,
      error: 'Locked bulk QR codes must have a valid template assigned.',
    }
  }

  return {
    payload: {
      count,
      prefix,
      labelPrefix,
      code_type: codeType,
      template_id: codeType === 'locked' ? templateId : null,
      assigned_email: assignedEmail,
      created_by: currentUserId,
    },
    error: '',
  }
}

export default function AdminQrCodesPanel({
  qrCodes,
  templates,
  currentUserId,
  onCreated,
  onUpdated,
  onDeleted,
  saving,
  setSaving,
  setFeedback,
  setError,
}) {
  const [mode, setMode] = useState('single')
  const [form, setForm] = useState({
    code: generatePublicCode(),
    scratch_code: generateScratchCode(),
    label: '',
    code_type: 'open',
    template_id: '',
    assigned_email: '',
    prefix: 'DC',
  })
  const [bulkForm, setBulkForm] = useState({
    count: 10,
    prefix: 'DC',
    labelPrefix: '',
    code_type: 'open',
    template_id: '',
    assigned_email: '',
  })
  const [selectedQrId, setSelectedQrId] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [expandedIds, setExpandedIds] = useState([])
  const [lastBulkCreated, setLastBulkCreated] = useState([])
  const canvasRef = useRef(null)

  const pageSize = 20

  const selectedQr = useMemo(
    () => qrCodes.find((item) => item.id === selectedQrId) || null,
    [qrCodes, selectedQrId],
  )

  useEffect(() => {
    setPage(1)
  }, [search, filter, sortBy])

  const counts = useMemo(() => {
    const all = qrCodes.length
    const pending = qrCodes.filter((row) => !row.activated).length
    const redeemed = qrCodes.filter((row) => row.activated).length

    return { all, pending, redeemed }
  }, [qrCodes])

  const filteredQrCodes = useMemo(() => {
    const query = sanitizeSearchValue(search).trim().toLowerCase()
    const safeFilter = FILTER_OPTIONS.has(filter) ? filter : 'all'
    const safeSortBy = SORT_OPTIONS.has(sortBy) ? sortBy : 'created_desc'

    let rows = [...qrCodes]

    if (query) {
      rows = rows.filter((row) => {
        const haystack = [
          row.code,
          row.scratch_code,
          row.label,
          row.code_type,
          row.template_id,
          row.assigned_email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(query)
      })
    }

    if (safeFilter === 'pending') rows = rows.filter((row) => row.activated === false)
    if (safeFilter === 'redeemed') rows = rows.filter((row) => row.activated === true)
    if (safeFilter === 'open') rows = rows.filter((row) => row.code_type === 'open')
    if (safeFilter === 'locked') rows = rows.filter((row) => row.code_type === 'locked')
    if (safeFilter === 'templated') rows = rows.filter((row) => Boolean(row.template_id))

    rows.sort((a, b) => {
      if (safeSortBy === 'created_desc') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      }
      if (safeSortBy === 'created_asc') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      }
      if (safeSortBy === 'label_asc') {
        return (a.label || a.code || '').localeCompare(b.label || b.code || '')
      }
      if (safeSortBy === 'label_desc') {
        return (b.label || b.code || '').localeCompare(a.label || a.code || '')
      }
      if (safeSortBy === 'code_asc') {
        return (a.code || '').localeCompare(b.code || '')
      }
      if (safeSortBy === 'code_desc') {
        return (b.code || '').localeCompare(a.code || '')
      }
      return 0
    })

    return rows
  }, [qrCodes, search, filter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredQrCodes.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pagedQrCodes = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredQrCodes.slice(start, start + pageSize)
  }, [filteredQrCodes, safePage])

  async function regenerateCode() {
    setForm((prev) => ({
      ...prev,
      prefix: sanitizePrefixValue(prev.prefix) || 'DC',
      code: generatePublicCode(sanitizePrefixValue(prev.prefix) || 'DC'),
    }))
  }

  async function regenerateScratch() {
    setForm((prev) => ({
      ...prev,
      scratch_code: generateScratchCode(),
    }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setFeedback('')

    const { payload, error: validationError } = validateSingleQrForm(
      form,
      templates,
      currentUserId,
    )

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    const { data, error } = await createQrCode(payload)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onCreated(Array.isArray(data) ? data : [data])
    const createdRow = Array.isArray(data) ? data[0] : data

    if (createdRow?.id) {
      setSelectedQrId(createdRow.id)
      setExpandedIds((prev) => [...new Set([...prev, createdRow.id])])
      await drawPreview(createdRow.code)
    }

    setFeedback('QR code created successfully.')

    setForm((prev) => ({
      ...prev,
      code: generatePublicCode(prev.prefix || 'DC'),
      scratch_code: generateScratchCode(),
      label: '',
      code_type: 'open',
      template_id: '',
      assigned_email: '',
    }))
  }

  async function handleBulkCreate(e) {
    e.preventDefault()
    setError('')
    setFeedback('')

    const { payload, error: validationError } = validateBulkQrForm(
      bulkForm,
      templates,
      currentUserId,
    )

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    const { data, error } = await createBulkQrCodes(payload)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onCreated(data || [])
    setLastBulkCreated((data || []).slice(0, 3))

    if (data?.length) {
      setSelectedQrId(data[0].id)
      setExpandedIds((prev) => [...new Set([...prev, data[0].id])])
      await drawPreview(data[0].code)
    }

    setFeedback(`${data?.length || 0} QR codes created successfully.`)
    setBulkForm((prev) => ({
      ...prev,
      prefix: payload.prefix,
      labelPrefix: '',
      assigned_email: '',
    }))
  }

  async function handleTemplateAssign(qrCodeId, templateId) {
    setError('')
    setFeedback('')

    if (!qrCodeId) {
      setError('QR code ID is missing.')
      return
    }

    if (templateId !== '__none__' && !isValidTemplateId(templateId, templates)) {
      setError('Selected template is not valid.')
      return
    }

    setSaving(true)

    const payload =
      templateId === '__none__'
        ? { template_id: null }
        : { template_id: templateId, code_type: 'locked' }

    const { data, error } = await updateQrCode(qrCodeId, payload)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onUpdated(data)
    setFeedback('QR code updated successfully.')
  }

  async function handleDelete(qrCodeId, code) {
    const safeCode = sanitizeCodeValue(code)
    const confirmed = window.confirm(`Delete QR code ${safeCode || code}? This cannot be undone.`)
    if (!confirmed) return

    setError('')
    setFeedback('')
    setSaving(true)

    const { error } = await deleteQrCode(qrCodeId)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onDeleted(qrCodeId)

    if (selectedQrId === qrCodeId) {
      setSelectedQrId('')
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }

    setExpandedIds((prev) => prev.filter((id) => id !== qrCodeId))
    setFeedback('QR code deleted successfully.')
  }

  async function handleDownloadPng(code) {
    const safeCode = sanitizeCodeValue(code)

    if (!QR_CODE_PATTERN.test(safeCode)) {
      setError('Cannot export PNG because this QR code value is invalid.')
      return
    }

    const url = `${window.location.origin}/p/${safeCode}`
    const dataUrl = await QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
    })
    downloadDataUrl(dataUrl, `${safeCode}.png`)
  }

  async function drawPreview(code) {
    if (!canvasRef.current) return

    const safeCode = sanitizeCodeValue(code)

    if (!QR_CODE_PATTERN.test(safeCode)) {
      setError('Cannot preview because this QR code value is invalid.')
      return
    }

    const url = `${window.location.origin}/p/${safeCode}`
    await QRCode.toCanvas(canvasRef.current, url, {
      width: 240,
      margin: 2,
    })
  }

  function toggleExpanded(id) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  function handleSafeFilterChange(value) {
    if (FILTER_OPTIONS.has(value)) {
      setFilter(value)
    }
  }

  function handleSafeSortChange(value) {
    if (SORT_OPTIONS.has(value)) {
      setSortBy(value)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)] 2xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="grid gap-6">
        <div className="surface-card h-fit p-6">
          <div className="eyebrow mb-4">Admin</div>
          <h2 className="display mb-6 text-3xl font-bold leading-tight">Create QR Codes</h2>

          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === 'single'
                  ? 'bg-[#5ECFCF] text-[#071515]'
                  : 'border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.03)] text-white/75'
              }`}
              onClick={() => setMode('single')}
            >
              Single
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === 'bulk'
                  ? 'bg-[#5ECFCF] text-[#071515]'
                  : 'border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.03)] text-white/75'
              }`}
              onClick={() => setMode('bulk')}
            >
              Bulk
            </button>
          </div>

          {mode === 'single' ? (
            <form onSubmit={handleCreate} className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Code Prefix</label>
                <input
                  type="text"
                  className="field"
                  value={form.prefix}
                  maxLength={LIMITS.prefix}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      prefix: sanitizePrefixValue(e.target.value),
                    }))
                  }
                  placeholder="DC"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Public Code</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    className="field min-w-0"
                    value={form.code}
                    maxLength={LIMITS.code}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        code: sanitizeCodeValue(e.target.value),
                      }))
                    }
                    placeholder="DC-XXXXXX-XXXX"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost shrink-0"
                    onClick={regenerateCode}
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Scratch Code</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    className="field min-w-0"
                    value={form.scratch_code}
                    maxLength={LIMITS.scratch}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        scratch_code: sanitizeScratchValue(e.target.value),
                      }))
                    }
                    placeholder="XXXX-XXXX-XXXX"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost shrink-0"
                    onClick={regenerateScratch}
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Label</label>
                <input
                  type="text"
                  className="field"
                  value={form.label}
                  maxLength={LIMITS.label}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      label: sanitizeLiveText(e.target.value, LIMITS.label),
                    }))
                  }
                  placeholder="Campaign / player / item label"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Assigned email</label>
                <input
                  type="email"
                  className="field"
                  value={form.assigned_email}
                  maxLength={LIMITS.email}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      assigned_email: sanitizeEmailValue(e.target.value),
                    }))
                  }
                  placeholder="futurecustomer@example.com"
                />
                <div className="mt-2 text-sm leading-6 text-white/50">
                  Only this email can activate this QR code. Leave empty for an unassigned code.
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Code Type</label>
                <select
                  className="field"
                  value={form.code_type}
                  onChange={(e) =>
                    setForm((prev) => {
                      const nextCodeType = sanitizeCodeType(e.target.value)

                      return {
                        ...prev,
                        code_type: nextCodeType,
                        template_id: nextCodeType === 'locked' ? prev.template_id : '',
                      }
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="locked">Locked</option>
                </select>
              </div>

              {form.code_type === 'locked' ? (
                <div>
                  <label className="mb-2 block text-sm font-medium">Template</label>
                  <select
                    className="field"
                    value={form.template_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        template_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create QR Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBulkCreate} className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min={LIMITS.bulkMin}
                  max={LIMITS.bulkMax}
                  className="field"
                  value={bulkForm.count}
                  onChange={(e) =>
                    setBulkForm((prev) => ({
                      ...prev,
                      count: e.target.value,
                    }))
                  }
                  placeholder="10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Code Prefix</label>
                <input
                  type="text"
                  className="field"
                  value={bulkForm.prefix}
                  maxLength={LIMITS.prefix}
                  onChange={(e) =>
                    setBulkForm((prev) => ({
                      ...prev,
                      prefix: sanitizePrefixValue(e.target.value),
                    }))
                  }
                  placeholder="DC"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Label Prefix</label>
                <input
                  type="text"
                  className="field"
                  value={bulkForm.labelPrefix}
                  maxLength={LIMITS.labelPrefix}
                  onChange={(e) =>
                    setBulkForm((prev) => ({
                      ...prev,
                      labelPrefix: sanitizeLiveText(e.target.value, LIMITS.labelPrefix),
                    }))
                  }
                  placeholder="Team Drop / Player / Batch"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Assigned email</label>
                <input
                  type="email"
                  className="field"
                  value={bulkForm.assigned_email}
                  maxLength={LIMITS.email}
                  onChange={(e) =>
                    setBulkForm((prev) => ({
                      ...prev,
                      assigned_email: sanitizeEmailValue(e.target.value),
                    }))
                  }
                  placeholder="futurecustomer@example.com"
                />
                <div className="mt-2 text-sm leading-6 text-white/50">
                  All generated QR codes in this batch will be reserved for this email. Leave empty
                  for unassigned codes.
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Code Type</label>
                <select
                  className="field"
                  value={bulkForm.code_type}
                  onChange={(e) =>
                    setBulkForm((prev) => {
                      const nextCodeType = sanitizeCodeType(e.target.value)

                      return {
                        ...prev,
                        code_type: nextCodeType,
                        template_id: nextCodeType === 'locked' ? prev.template_id : '',
                      }
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="locked">Locked</option>
                </select>
              </div>

              {bulkForm.code_type === 'locked' ? (
                <div>
                  <label className="mb-2 block text-sm font-medium">Template</label>
                  <select
                    className="field"
                    value={bulkForm.template_id}
                    onChange={(e) =>
                      setBulkForm((prev) => ({
                        ...prev,
                        template_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Bulk QR Codes'}
              </button>

              <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm leading-7 text-white/62">
                Bulk generation creates unique public codes and scratch codes automatically.
                Maximum: 500 at a time.
              </div>
            </form>
          )}

          {lastBulkCreated.length ? (
            <div className="mt-6 rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
              <div className="mb-3 text-sm font-semibold text-[#5ECFCF]">
                Last bulk result (first 3)
              </div>
              <div className="grid gap-3">
                {lastBulkCreated.map((item) => (
                  <div
                    key={item.id}
                    className="min-w-0 rounded-[14px] border border-[rgba(94,207,207,0.08)] bg-[rgba(255,255,255,0.02)] p-3 text-sm"
                  >
                    <div className="break-words font-semibold leading-snug">
                      {item.label || item.code}
                    </div>
                    <div className="break-all text-white/55">{item.code}</div>
                    <div className="break-all text-white/55">Scratch: {item.scratch_code}</div>
                    {item.assigned_email ? (
                      <div className="break-all text-white/55">
                        Reserved: {item.assigned_email}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="surface-card min-w-0 p-6">
          <div className="eyebrow mb-4">QR preview</div>
          <h2 className="display mb-4 break-all text-2xl font-bold leading-tight">
            {selectedQr ? selectedQr.code : 'Select a QR code'}
          </h2>

          <div className="flex min-w-0 flex-col gap-5">
            <div className="self-start rounded-[20px] border border-[rgba(94,207,207,0.12)] bg-white p-4">
              <canvas ref={canvasRef} width={240} height={240} />
            </div>

            <div className="min-w-0 text-sm leading-7 text-white/62">
              {selectedQr ? (
                <div className="grid min-w-0 gap-2">
                  <div className="break-all">
                    <strong>Public URL:</strong> {window.location.origin}/p/{selectedQr.code}
                  </div>
                  <div className="break-all">
                    <strong>Scratch Code:</strong> {selectedQr.scratch_code}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedQr.code_type}
                  </div>
                  <div>
                    <strong>Status:</strong> {selectedQr.activated ? 'Redeemed' : 'Pending'}
                  </div>
                  <div className="break-all">
                    <strong>Assigned Email:</strong> {selectedQr.assigned_email || 'None'}
                  </div>
                  <div>
                    <strong>Created:</strong> {formatDate(selectedQr.created_at)}
                  </div>
                </div>
              ) : (
                'Click Preview on any QR code to render it here.'
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card min-w-0 p-6">
        <div className="mb-5 flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="eyebrow mb-3">Admin list</div>
              <h2 className="display text-3xl font-bold leading-tight">QR Codes</h2>
            </div>

            <button
              type="button"
              className="btn btn-secondary shrink-0"
              onClick={() => exportCsv(filteredQrCodes)}
            >
              Export Filtered CSV
            </button>
          </div>

          <div className="grid gap-3">
            <input
              type="text"
              className="field"
              value={search}
              maxLength={LIMITS.search}
              onChange={(e) => setSearch(sanitizeSearchValue(e.target.value))}
              placeholder="Search by code, scratch, label, type, template, email..."
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSafeFilterChange('all')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === 'all'
                    ? 'bg-[#5ECFCF] text-[#071515]'
                    : 'border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.03)] text-white/75'
                }`}
              >
                All ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => handleSafeFilterChange('pending')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === 'pending'
                    ? 'bg-[#5ECFCF] text-[#071515]'
                    : 'border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.03)] text-white/75'
                }`}
              >
                Pending ({counts.pending})
              </button>

              <button
                type="button"
                onClick={() => handleSafeFilterChange('redeemed')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === 'redeemed'
                    ? 'bg-[#5ECFCF] text-[#071515]'
                    : 'border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.03)] text-white/75'
                }`}
              >
                Redeemed ({counts.redeemed})
              </button>

              <button
                type="button"
                onClick={() => handleSafeFilterChange('open')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === 'open'
                    ? 'bg-[#5ECFCF] text-[#071515]'
                    : 'border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.03)] text-white/75'
                }`}
              >
                Open
              </button>

              <button
                type="button"
                onClick={() => handleSafeFilterChange('locked')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === 'locked'
                    ? 'bg-[#5ECFCF] text-[#071515]'
                    : 'border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.03)] text-white/75'
                }`}
              >
                Locked
              </button>

              <button
                type="button"
                onClick={() => handleSafeFilterChange('templated')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === 'templated'
                    ? 'bg-[#5ECFCF] text-[#071515]'
                    : 'border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.03)] text-white/75'
                }`}
              >
                Templated
              </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
              <select
                className="field"
                value={sortBy}
                onChange={(e) => handleSafeSortChange(e.target.value)}
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="label_asc">Label A-Z</option>
                <option value="label_desc">Label Z-A</option>
                <option value="code_asc">Code A-Z</option>
                <option value="code_desc">Code Z-A</option>
              </select>

              <div className="flex items-center text-sm leading-6 text-white/52">
                Showing {pagedQrCodes.length} of {filteredQrCodes.length} matching codes
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[900px] overflow-y-auto pr-2">
          <div className="grid min-w-0 gap-4">
            {pagedQrCodes.length ? (
              pagedQrCodes.map((item) => {
                const expanded = expandedIds.includes(item.id)

                return (
                  <div
                    key={item.id}
                    className={`min-w-0 rounded-[18px] border p-4 ${
                      selectedQrId === item.id
                        ? 'border-[rgba(94,207,207,0.3)] bg-[rgba(94,207,207,0.06)]'
                        : 'border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)]'
                    }`}
                  >
                    <div className="grid min-w-0 gap-4">
                      <div className="min-w-0">
                        <div className="max-w-full whitespace-normal break-words text-xl font-bold leading-snug text-white">
                          {item.label || item.code}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="badge">{item.code_type}</span>
                          <span className="badge">
                            {item.activated ? 'Redeemed' : 'Pending'}
                          </span>
                          {item.assigned_email ? (
                            <span className="badge">Email reserved</span>
                          ) : null}
                        </div>

                        <div className="mt-4 grid min-w-0 gap-1 text-sm leading-7 text-white/60">
                          <div className="break-all">
                            <strong>Code:</strong> {item.code}
                          </div>
                          <div className="break-all">
                            <strong>Scratch:</strong> {item.scratch_code}
                          </div>
                          <div>
                            <strong>Created:</strong> {formatDate(item.created_at)}
                          </div>
                          {item.assigned_email ? (
                            <div className="break-all">
                              <strong>Reserved:</strong> {item.assigned_email}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={async () => {
                            setSelectedQrId(item.id)
                            await drawPreview(item.code)
                          }}
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            navigator.clipboard.writeText(`${window.location.origin}/p/${item.code}`)
                          }
                        >
                          Copy URL
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleDownloadPng(item.code)}
                        >
                          PNG
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => toggleExpanded(item.id)}
                        >
                          {expanded ? 'Hide' : 'Details'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleDelete(item.id, item.code)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {expanded ? (
                      <div className="mt-4 grid min-w-0 gap-4 border-t border-[rgba(94,207,207,0.08)] pt-4 lg:grid-cols-2">
                        <div className="grid min-w-0 gap-2 text-sm leading-7 text-white/62">
                          <div className="break-all">
                            <strong>ID:</strong> {item.id}
                          </div>
                          <div>
                            <strong>Created:</strong> {formatDate(item.created_at)}
                          </div>
                          <div>
                            <strong>Activated At:</strong> {formatDate(item.activated_at)}
                          </div>
                          <div>
                            <strong>Is Active:</strong> {String(item.is_active)}
                          </div>
                          <div className="break-all">
                            <strong>Assigned Email:</strong> {item.assigned_email || 'None'}
                          </div>
                          <div className="break-all">
                            <strong>Public URL:</strong> {window.location.origin}/p/{item.code}
                          </div>
                        </div>

                        <div className="grid min-w-0 gap-3">
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Assigned Template
                            </label>
                            <select
                              className="field"
                              value={item.template_id || '__none__'}
                              onChange={(e) => handleTemplateAssign(item.id, e.target.value)}
                            >
                              <option value="__none__">None</option>
                              {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                  {template.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })
            ) : (
              <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/55">
                No QR codes match the current search/filter.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={safePage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>

          <div className="text-center text-sm text-white/58">
            Page {safePage} of {totalPages}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={safePage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
