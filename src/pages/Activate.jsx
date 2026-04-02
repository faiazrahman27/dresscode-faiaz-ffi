import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { activateQrCode, getQrCodeByCode } from '../lib/qr'

export default function Activate() {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()

  const [qrLoading, setQrLoading] = useState(true)
  const [qrCode, setQrCode] = useState(null)
  const [formScratchCode, setFormScratchCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const portalHref = useMemo(() => '/portal', [])

  useEffect(() => {
    let active = true

    async function loadQr() {
      setQrLoading(true)
      setError('')
      setMessage('')

      const { data, error } = await getQrCodeByCode(code)

      if (!active) return

      if (error) {
        setError(error.message)
        setQrLoading(false)
        return
      }

      if (!data) {
        setError('QR code not found.')
        setQrLoading(false)
        return
      }

      if (!data.is_active) {
        setError('This QR code is inactive.')
        setQrLoading(false)
        return
      }

      if (data.activated) {
        navigate('/dashboard', { replace: true })
        return
      }

      setQrCode(data)
      setQrLoading(false)
    }

    loadQr()

    return () => {
      active = false
    }
  }, [code, navigate])

  async function handleActivate(e) {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!user) {
      navigate('/portal', {
        replace: true,
        state: { from: location },
      })
      return
    }

    if (!formScratchCode.trim()) {
      setError('Please enter the scratch code.')
      return
    }

    setSubmitting(true)

    const { data, error } = await activateQrCode(code, formScratchCode)

    setSubmitting(false)

    if (error) {
      setError(error.message || 'Activation failed.')
      return
    }

    if (!data?.success) {
      setError(data?.message || 'Activation failed.')
      return
    }

    setMessage(data.message || 'Activated successfully.')

    setTimeout(() => {
      navigate('/dashboard', { replace: true })
    }, 800)
  }

  if (loading || qrLoading) {
    return (
      <div className="min-h-screen bg-[#0A1F1F] text-white flex items-center justify-center">
        Loading activation...
      </div>
    )
  }

  if (error && !qrCode) {
    return (
      <div className="min-h-screen bg-[#0A1F1F] text-white flex items-center justify-center px-4">
        <div className="surface-card w-full max-w-xl p-8 text-center">
          <div className="eyebrow mb-4">Activation</div>
          <h1 className="section-title mb-4">Could not load this code</h1>
          <p className="muted mb-6">{error}</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const assignedToCurrentUser =
    user && qrCode?.assigned_to && qrCode.assigned_to === user.id

  const assignedToDifferentUser =
    user && qrCode?.assigned_to && qrCode.assigned_to !== user.id

  const unassignedCode = !qrCode?.assigned_to
  const isOpenCode = qrCode?.code_type === 'open'
  const isLockedCode = qrCode?.code_type === 'locked'

  return (
    <div className="min-h-screen bg-[#0A1F1F] text-white px-4 py-10">
      <div className="container max-w-5xl">
        <div className="grid-2 items-stretch">
          <div className="surface-card p-8 md:p-10">
            <div className="eyebrow mb-5">Activate your Dresscode</div>
            <h1 className="section-title mb-4">Claim and unlock this QR identity</h1>
            <p className="lead mb-8">
              Enter the scratch code from the garment tag to activate the code and
              connect it to your account.
            </p>

            <div className="grid gap-4">
              <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="text-sm font-semibold">Public Code</div>
                <div className="muted mt-1">{qrCode?.code}</div>
              </div>

              <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="text-sm font-semibold">Label</div>
                <div className="muted mt-1">{qrCode?.label || 'Untitled code'}</div>
              </div>

              <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="text-sm font-semibold">Code Type</div>
                <div className="muted mt-1">
                  {isOpenCode ? 'Open code' : isLockedCode ? 'Locked code' : qrCode?.code_type}
                </div>
              </div>

              {isOpenCode ? (
                <div className="rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm">
                  This is an open code. After activation, it will appear in your dashboard,
                  where you can open Edit Profile and personalize the live page.
                </div>
              ) : null}

              {isLockedCode ? (
                <div className="rounded-[18px] border border-[rgba(94,207,207,0.18)] bg-[rgba(94,207,207,0.08)] p-4 text-sm">
                  This is a locked code. After activation, it will open an official
                  template-based experience instead of a fully editable personal page.
                </div>
              ) : null}

              {unassignedCode ? (
                <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm">
                  This item is ready to be claimed by the first customer who signs in
                  and enters the correct scratch code.
                </div>
              ) : null}

              {assignedToCurrentUser ? (
                <div className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                  This QR code is already assigned to your account. Enter the scratch code to activate it.
                </div>
              ) : null}

              {assignedToDifferentUser ? (
                <div className="rounded-[18px] border border-red-500/30 bg-red-500/10 p-4 text-sm">
                  This QR code is assigned to another user and cannot be activated from this account.
                </div>
              ) : null}
            </div>
          </div>

          <div className="glass-card p-8 md:p-10">
            {!user ? (
              <>
                <div className="eyebrow mb-5">Create account or sign in</div>
                <h2 className="display mb-4 text-3xl font-bold">
                  Start your activation in two simple steps
                </h2>

                <div className="mb-8 grid gap-4 text-sm text-white/70">
                  <div>1. Create an account or sign in</div>
                  <div>2. Return here automatically and enter the scratch code from the tag</div>
                </div>

                <p className="muted mb-8">
                  Once you sign in, you can activate this item and connect it to your account.
                </p>

                <Link
                  to={portalHref}
                  state={{ from: location }}
                  className="btn btn-primary"
                >
                  Go to Portal
                </Link>
              </>
            ) : (
              <>
                <div className="eyebrow mb-5">Scratch code verification</div>
                <h2 className="display mb-4 text-3xl font-bold">
                  Activate this item
                </h2>

                <p className="muted mb-6">
                  The scratch code is printed on the tag in the format XXXX-XXXX-XXXX.
                </p>

                {message ? (
                  <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                    {message}
                  </div>
                ) : null}

                {error ? (
                  <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleActivate} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Scratch Code
                    </label>
                    <input
                      type="text"
                      value={formScratchCode}
                      onChange={(e) => setFormScratchCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX"
                      className="field"
                      disabled={assignedToDifferentUser}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || assignedToDifferentUser}
                    className="btn btn-primary w-full"
                  >
                    {submitting ? 'Activating...' : 'Activate Code'}
                  </button>
                </form>

                <div className="mt-6 text-sm text-white/45">
                  Signed in as {user.email}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
