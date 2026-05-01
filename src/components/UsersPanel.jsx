import { useMemo, useState } from 'react'
import {
  createPendingAssignment,
  deletePendingAssignment,
  normalizeAssignedEmail,
  updateQrCode,
  updateUserRole,
} from '../lib/dashboard'

const ROLE_OPTIONS = new Set(['user', 'journalist', 'admin'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const LIMITS = {
  email: 254,
  search: 160,
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

function sanitizeEmailInput(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .slice(0, LIMITS.email)
}

function sanitizeRole(value) {
  return ROLE_OPTIONS.has(value) ? value : 'user'
}

function isValidEmail(email) {
  return Boolean(email) && email.length <= LIMITS.email && EMAIL_PATTERN.test(email)
}

function isValidUuid(value) {
  return Boolean(value) && UUID_PATTERN.test(value)
}

function getQrLabel(qrCode) {
  if (!qrCode) return 'Unknown QR'
  return qrCode.label || qrCode.code || qrCode.id
}

function validateRoleUpdate({ userId, role }) {
  const safeRole = sanitizeRole(role)

  if (!isValidUuid(userId)) {
    return {
      payload: null,
      error: 'Invalid user ID.',
    }
  }

  if (!ROLE_OPTIONS.has(safeRole)) {
    return {
      payload: null,
      error: 'Invalid user role.',
    }
  }

  return {
    payload: {
      userId,
      role: safeRole,
    },
    error: '',
  }
}

function validatePendingAssignment({ assignForm, qrCodes, currentUserId }) {
  const email = normalizeAssignedEmail(sanitizeEmailInput(assignForm.email))
  const role = sanitizeRole(assignForm.role)
  const selectedQrCodeId = assignForm.qr_code_id || null

  if (!isValidUuid(currentUserId)) {
    return {
      payload: null,
      error: 'Admin user context is missing.',
    }
  }

  if (!isValidEmail(email)) {
    return {
      payload: null,
      error: 'Enter a valid email address.',
    }
  }

  if (!ROLE_OPTIONS.has(role)) {
    return {
      payload: null,
      error: 'Select a valid role.',
    }
  }

  if (selectedQrCodeId) {
    if (!isValidUuid(selectedQrCodeId)) {
      return {
        payload: null,
        error: 'Selected QR code is invalid.',
      }
    }

    const qrExists = qrCodes.some((code) => code.id === selectedQrCodeId)

    if (!qrExists) {
      return {
        payload: null,
        error: 'Selected QR code was not found.',
      }
    }
  }

  return {
    payload: {
      email,
      role,
      qr_code_id: selectedQrCodeId,
      created_by: currentUserId,
    },
    error: '',
  }
}

export default function UsersPanel({
  users,
  qrCodes,
  pendingAssignments,
  currentUserId,
  saving,
  setSaving,
  setFeedback,
  setError,
  onUserUpdated,
  onPendingCreated,
  onPendingDeleted,
  onQrUpdated,
}) {
  const [search, setSearch] = useState('')
  const [assignForm, setAssignForm] = useState({
    email: '',
    role: 'user',
    qr_code_id: '',
  })

  const filteredUsers = useMemo(() => {
    const q = sanitizeSingleLineText(search, LIMITS.search).toLowerCase()
    if (!q) return users

    return users.filter((user) => {
      const haystack = [user.full_name, user.email, user.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [users, search])

  async function handleRoleChange(userId, role) {
    setError('')
    setFeedback('')

    const { payload, error: validationError } = validateRoleUpdate({
      userId,
      role,
    })

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    const { data, error } = await updateUserRole(payload.userId, payload.role)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onUserUpdated(data)
    setFeedback('User role updated successfully.')
  }

  async function handlePendingCreate(e) {
    e.preventDefault()
    setError('')
    setFeedback('')

    const { payload, error: validationError } = validatePendingAssignment({
      assignForm,
      qrCodes,
      currentUserId,
    })

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    const { data, error } = await createPendingAssignment(payload)

    let reservedQr = null
    let reservationError = null

    if (!error && payload.qr_code_id) {
      const { data: updatedQr, error: updateError } = await updateQrCode(
        payload.qr_code_id,
        { assigned_email: payload.email },
      )

      reservedQr = updatedQr
      reservationError = updateError
    }

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onPendingCreated(data)

    if (reservedQr && onQrUpdated) {
      onQrUpdated(reservedQr)
    }

    if (reservationError) {
      setError('Pending assignment was created, but the QR code could not be reserved for this email.')
    } else if (payload.qr_code_id) {
      setFeedback('Pending assignment created and QR code reserved for this email.')
    } else {
      setFeedback('Pending assignment created successfully.')
    }

    setAssignForm({
      email: '',
      role: 'user',
      qr_code_id: '',
    })
  }

  async function handlePendingDelete(id) {
    setError('')
    setFeedback('')

    if (!isValidUuid(id)) {
      setError('Invalid pending assignment ID.')
      return
    }

    setSaving(true)

    const { error } = await deletePendingAssignment(id)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onPendingDeleted(id)
    setFeedback('Pending assignment removed.')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="surface-card p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="eyebrow mb-3">Admin users</div>
            <h2 className="display text-3xl font-bold">Registered Users</h2>
          </div>

          <input
            type="text"
            className="field max-w-sm"
            value={search}
            maxLength={LIMITS.search}
            onChange={(e) => setSearch(sanitizeLiveText(e.target.value, LIMITS.search))}
            placeholder="Search users..."
          />
        </div>

        <div className="grid gap-4">
          {filteredUsers.length ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="font-semibold">{user.full_name || 'Unnamed user'}</div>
                    <div className="mt-1 break-all text-sm text-white/55">{user.email}</div>
                    <div className="mt-2 text-sm text-white/55 capitalize">
                      Current role: {user.role}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <select
                      className="field min-w-[180px]"
                      value={ROLE_OPTIONS.has(user.role) ? user.role : 'user'}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={saving}
                    >
                      <option value="user">user</option>
                      <option value="journalist">journalist</option>
                      <option value="admin">admin</option>
                    </select>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => window.alert('User code/profile detail panel comes next.')}
                    >
                      Profile
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/55">
              No matching users found.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="surface-card p-6">
          <div className="eyebrow mb-4">Pending assignment</div>
          <h2 className="display mb-6 text-3xl font-bold">Assign role by email</h2>

          <form onSubmit={handlePendingCreate} className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                className="field"
                value={assignForm.email}
                maxLength={LIMITS.email}
                onChange={(e) =>
                  setAssignForm((prev) => ({
                    ...prev,
                    email: sanitizeEmailInput(e.target.value),
                  }))
                }
                placeholder="futureuser@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Role</label>
              <select
                className="field"
                value={assignForm.role}
                onChange={(e) =>
                  setAssignForm((prev) => ({
                    ...prev,
                    role: sanitizeRole(e.target.value),
                  }))
                }
              >
                <option value="user">user</option>
                <option value="journalist">journalist</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Assign QR Code (optional)</label>
              <select
                className="field"
                value={assignForm.qr_code_id}
                onChange={(e) =>
                  setAssignForm((prev) => ({
                    ...prev,
                    qr_code_id: e.target.value,
                  }))
                }
              >
                <option value="">None</option>
                {qrCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {getQrLabel(code)}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Create Pending Assignment'}
            </button>
          </form>
        </div>

        <div className="surface-card p-6">
          <div className="eyebrow mb-4">Pending list</div>
          <h2 className="display mb-6 text-3xl font-bold">Pending Assignments</h2>

          <div className="grid gap-4">
            {pendingAssignments.length ? (
              pendingAssignments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4"
                >
                  <div className="break-all font-semibold">{item.email}</div>
                  <div className="mt-1 text-sm text-white/55 capitalize">
                    Role: {ROLE_OPTIONS.has(item.role) ? item.role : 'user'}
                  </div>
                  <div className="mt-1 break-all text-sm text-white/55">
                    QR: {item.qr_code_id || 'None'}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handlePendingDelete(item.id)}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/55">
                No pending assignments yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
