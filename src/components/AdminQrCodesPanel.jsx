import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import {
  createBulkQrCodes,
  createQrCode,
  deleteQrCode,
  generatePublicCode,
  generateScratchCode,
  updateQrCode,
} from '../lib/dashboard'

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
  ])

  const csv = [headers, ...body]
    .map((line) =>
      line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
    )
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
    prefix: 'DC',
  })
  const [bulkForm, setBulkForm] = useState({
    count: 10,
    prefix: 'DC',
    labelPrefix: '',
    code_type: 'open',
    template_id: '',
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
    [qrCodes, selectedQrId]
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
    const query = search.trim().toLowerCase()

    let rows = [...qrCodes]

    if (query) {
      rows = rows.filter((row) => {
        const haystack = [
          row.code,
          row.scratch_code,
          row.label,
          row.code_type,
          row.template_id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(query)
      })
    }

    if (filter === 'pending') {
      rows = rows.filter((row) => row.activated === false)
    }

    if (filter === 'redeemed') {
      rows = rows.filter((row) => row.activated === true)
    }

    if (filter === 'open') {
      rows = rows.filter((row) => row.code_type === 'open')
    }

    if (filter === 'locked') {
      rows = rows.filter((row) => row.code_type === 'locked')
    }

    if (filter === 'templated') {
      rows = rows.filter((row) => Boolean(row.template_id))
    }

    rows.sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      }
      if (sortBy === 'created_asc') {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      }
      if (sortBy === 'label_asc') {
        return (a.label || a.code || '').localeCompare(b.label || b.code || '')
      }
      if (sortBy === 'label_desc') {
        return (b.label || b.code || '').localeCompare(a.label || a.code || '')
      }
      if (sortBy === 'code_asc') {
        return (a.code || '').localeCompare(b.code || '')
      }
      if (sortBy === 'code_desc') {
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
      code: generatePublicCode(prev.prefix || 'DC'),
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

    if (!form.code.trim()) {
      setError('Public code is required.')
      return
    }

    if (!form.scratch_code.trim()) {
      setError('Scratch code is required.')
      return
    }

    if (form.code_type === 'locked' && !form.template_id) {
      setError('Locked QR codes must have a template assigned.')
      return
    }

    setSaving(true)

    const { data, error } = await createQrCode({
      code: form.code.trim().toUpperCase(),
      scratch_code: form.scratch_code.trim().toUpperCase(),
      label: form.label.trim(),
      code_type: form.code_type,
      template_id: form.template_id || null,
      created_by: currentUserId,
    })

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
    }

    setFeedback('QR code created successfully.')

    setForm((prev) => ({
      ...prev,
      code: generatePublicCode(prev.prefix || 'DC'),
      scratch_code: generateScratchCode(),
      label: '',
      code_type: 'open',
      template_id: '',
    }))
  }

  async function handleBulkCreate(e) {
    e.preventDefault()
    setError('')
    setFeedback('')

    const safeCount = Number(bulkForm.count)

    if (!Number.isInteger(safeCount) || safeCount < 1 || safeCount > 500) {
      setError('Bulk count must be between 1 and 500.')
      return
    }

    if (bulkForm.code_type === 'locked' && !bulkForm.template_id) {
      setError('Locked bulk QR codes must have a template assigned.')
      return
    }

    setSaving(true)

    const { data, error } = await createBulkQrCodes({
      count: safeCount,
      prefix: bulkForm.prefix,
      labelPrefix: bulkForm.labelPrefix.trim(),
      code_type: bulkForm.code_type,
      template_id: bulkForm.template_id || null,
      created_by: currentUserId,
    })

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
    }

    setFeedback(`${data?.length || 0} QR codes created successfully.`)
  }

  async function handleTemplateAssign(qrCodeId, templateId) {
    setError('')
    setFeedback('')
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
    const confirmed = window.confirm(`Delete QR code ${code}? This cannot be undone.`)
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
    const url = `${window.location.origin}/p/${code}`
    const dataUrl = await QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
    })
    downloadDataUrl(dataUrl, `${code}.png`)
  }

  async function drawPreview(code) {
    if (!canvasRef.current) return

    const url = `${window.location.origin}/p/${code}`
    await QRCode.toCanvas(canvasRef.current, url, {
      width: 240,
      margin: 2,
    })
  }

  function toggleExpanded(id) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="surface-card p-6">
        <div className="eyebrow mb-4">Admin</div>
        <h2 className="display mb-6 text-3xl font-bold">Create QR Codes</h2>

        <div className="mb-5 flex gap-2">
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, prefix: e.target.value.toUpperCase() }))
                }
                placeholder="DC"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Public Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="field"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="DC-XXXXXX-XXXX"
                />
                <button type="button" className="btn btn-ghost" onClick={regenerateCode}>
                  Regenerate
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Scratch Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="field"
                  value={form.scratch_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      scratch_code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="XXXX-XXXX-XXXX"
                />
                <button type="button" className="btn btn-ghost" onClick={regenerateScratch}>
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
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Campaign / player / item label"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Code Type</label>
              <select
                className="field"
                value={form.code_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    code_type: e.target.value,
                    template_id: e.target.value === 'locked' ? prev.template_id : '',
                  }))
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
                    setForm((prev) => ({ ...prev, template_id: e.target.value }))
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
                min="1"
                max="500"
                className="field"
                value={bulkForm.count}
                onChange={(e) =>
                  setBulkForm((prev) => ({ ...prev, count: e.target.value }))
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
                onChange={(e) =>
                  setBulkForm((prev) => ({ ...prev, prefix: e.target.value.toUpperCase() }))
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
                onChange={(e) =>
                  setBulkForm((prev) => ({ ...prev, labelPrefix: e.target.value }))
                }
                placeholder="Team Drop / Player / Batch"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Code Type</label>
              <select
                className="field"
                value={bulkForm.code_type}
                onChange={(e) =>
                  setBulkForm((prev) => ({
                    ...prev,
                    code_type: e.target.value,
                    template_id: e.target.value === 'locked' ? prev.template_id : '',
                  }))
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
                    setBulkForm((prev) => ({ ...prev, template_id: e.target.value }))
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

            <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/62">
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
                  className="rounded-[14px] border border-[rgba(94,207,207,0.08)] bg-[rgba(255,255,255,0.02)] p-3 text-sm"
                >
                  <div className="font-semibold">{item.label || item.code}</div>
                  <div className="text-white/55">{item.code}</div>
                  <div className="text-white/55">Scratch: {item.scratch_code}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6">
        <div className="surface-card p-6">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="eyebrow mb-3">Admin list</div>
                <h2 className="display text-3xl font-bold">QR Codes</h2>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, scratch, label, type, template..."
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
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
                  onClick={() => setFilter('pending')}
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
                  onClick={() => setFilter('redeemed')}
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
                  onClick={() => setFilter('open')}
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
                  onClick={() => setFilter('locked')}
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
                  onClick={() => setFilter('templated')}
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
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="created_desc">Newest First</option>
                  <option value="created_asc">Oldest First</option>
                  <option value="label_asc">Label A-Z</option>
                  <option value="label_desc">Label Z-A</option>
                  <option value="code_asc">Code A-Z</option>
                  <option value="code_desc">Code Z-A</option>
                </select>

                <div className="text-sm text-white/52 flex items-center">
                  Showing {pagedQrCodes.length} of {filteredQrCodes.length} matching codes
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {pagedQrCodes.length ? (
              pagedQrCodes.map((item) => {
                const expanded = expandedIds.includes(item.id)

                return (
                  <div
                    key={item.id}
                    className={`rounded-[18px] border p-4 ${
                      selectedQrId === item.id
                        ? 'border-[rgba(94,207,207,0.3)] bg-[rgba(94,207,207,0.06)]'
                        : 'border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)]'
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="font-semibold">{item.label || item.code}</div>
                        <div className="mt-1 text-sm text-white/55">{item.code}</div>
                        <div className="mt-2 text-sm text-white/55">
                          Type: {item.code_type} · Status: {item.activated ? 'Redeemed' : 'Pending'}
                        </div>
                        <div className="mt-1 text-sm text-white/55">
                          Scratch: {item.scratch_code}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
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
                      <div className="mt-4 grid gap-4 border-t border-[rgba(94,207,207,0.08)] pt-4 lg:grid-cols-2">
                        <div className="grid gap-2 text-sm text-white/62">
                          <div><strong>ID:</strong> {item.id}</div>
                          <div><strong>Created:</strong> {formatDate(item.created_at)}</div>
                          <div><strong>Activated At:</strong> {formatDate(item.activated_at)}</div>
                          <div><strong>Is Active:</strong> {String(item.is_active)}</div>
                          <div><strong>Public URL:</strong> {window.location.origin}/p/{item.code}</div>
                        </div>

                        <div className="grid gap-3">
                          <div>
                            <label className="mb-2 block text-sm font-medium">Assigned Template</label>
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

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>

            <div className="text-sm text-white/58">
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

        <div className="surface-card p-6">
          <div className="eyebrow mb-4">QR preview</div>
          <h2 className="display mb-4 text-2xl font-bold">
            {selectedQr ? selectedQr.code : 'Select a QR code'}
          </h2>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="rounded-[20px] border border-[rgba(94,207,207,0.12)] bg-white p-4">
              <canvas ref={canvasRef} width={240} height={240} />
            </div>

            <div className="text-sm text-white/62 leading-7">
              {selectedQr ? (
                <>
                  <div><strong>Public URL:</strong> {window.location.origin}/p/{selectedQr.code}</div>
                  <div><strong>Scratch Code:</strong> {selectedQr.scratch_code}</div>
                  <div><strong>Type:</strong> {selectedQr.code_type}</div>
                  <div><strong>Status:</strong> {selectedQr.activated ? 'Redeemed' : 'Pending'}</div>
                  <div><strong>Created:</strong> {formatDate(selectedQr.created_at)}</div>
                </>
              ) : (
                'Click Preview on any QR code to render it here.'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
