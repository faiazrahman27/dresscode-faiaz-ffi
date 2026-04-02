import { useMemo, useState } from 'react'
import {
  createPendingAssignment,
  deletePendingAssignment,
  updateUserRole,
} from '../lib/dashboard'

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
}) {
  const [search, setSearch] = useState('')
  const [assignForm, setAssignForm] = useState({
    email: '',
    role: 'user',
    qr_code_id: '',
  })

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
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
    setSaving(true)

    const { data, error } = await updateUserRole(userId, role)

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

    const email = assignForm.email.trim().toLowerCase()

    if (!email) {
      setError('Email is required.')
      return
    }

    setSaving(true)

    const { data, error } = await createPendingAssignment({
      email,
      role: assignForm.role,
      qr_code_id: assignForm.qr_code_id || null,
      created_by: currentUserId,
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    onPendingCreated(data)
    setFeedback('Pending assignment created successfully.')

    setAssignForm({
      email: '',
      role: 'user',
      qr_code_id: '',
    })
  }

  async function handlePendingDelete(id) {
    setError('')
    setFeedback('')
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
            onChange={(e) => setSearch(e.target.value)}
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
                    <div className="mt-1 text-sm text-white/55">{user.email}</div>
                    <div className="mt-2 text-sm text-white/55 capitalize">
                      Current role: {user.role}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <select
                      className="field min-w-[180px]"
                      value={user.role}
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
                onChange={(e) =>
                  setAssignForm((prev) => ({ ...prev, email: e.target.value }))
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
                  setAssignForm((prev) => ({ ...prev, role: e.target.value }))
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
                  setAssignForm((prev) => ({ ...prev, qr_code_id: e.target.value }))
                }
              >
                <option value="">None</option>
                {qrCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.label || code.code}
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
                  <div className="font-semibold">{item.email}</div>
                  <div className="mt-1 text-sm text-white/55 capitalize">
                    Role: {item.role}
                  </div>
                  <div className="mt-1 text-sm text-white/55">
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
