import { useState } from 'react'

export default function AccountPanel({ profile, user, onSave, saving }) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [accentColor, setAccentColor] = useState(profile?.accent_color || '#5ECFCF')

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      full_name: fullName,
      bio,
      accent_color: accentColor,
    })
  }

  return (
    <div className="surface-card p-8">
      <div className="eyebrow mb-4">Account</div>
      <h2 className="display mb-6 text-3xl font-bold">Manage your profile</h2>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Display Name</label>
          <input
            type="text"
            className="field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your display name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <input
            type="email"
            className="field"
            value={user?.email || ''}
            readOnly
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Bio</label>
          <textarea
            className="field min-h-[120px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a short bio"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Accent Color</label>
          <input
            type="text"
            className="field"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            placeholder="#5ECFCF"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <div className="text-sm text-white/45 self-center">
            Password change is handled through the portal reset flow.
          </div>
        </div>
      </form>
    </div>
  )
}
