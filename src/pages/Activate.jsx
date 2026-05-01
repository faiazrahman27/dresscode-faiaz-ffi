import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { activateQrCode, getQrCodeByCode } from '../lib/qr'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const heroStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

function GlitterField({ count = 16 }) {
  return (
    <div className="glitter-field" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="glitter-dot"
          style={{
            left: `${(i * 9 + 7) % 100}%`,
            top: `${(i * 11 + 13) % 100}%`,
            animationDelay: `${(i % 9) * 0.55}s`,
            animationDuration: `${4.2 + (i % 5)}s`,
          }}
        />
      ))}
    </div>
  )
}

function normalizeEmail(email) {
  return email?.trim().toLowerCase() || ''
}

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

    if (assignedToDifferentUser) {
      setError('This QR code is assigned to another account.')
      return
    }

    if (assignedToDifferentEmail) {
      setError('This QR code is assigned to another email. Please sign in with the email used for this assignment.')
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
      <div className="app-shell activate-page min-h-screen bg-[#0A1F1F] text-white flex items-center justify-center">
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="activate-bg-orb activate-bg-orb-1" />
        <div className="activate-bg-orb activate-bg-orb-2" />
        <div className="activate-bg-orb activate-bg-orb-3" />
        <GlitterField count={14} />

        <motion.div
          className="surface-card p-8"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.35 }}
        >
          <div className="eyebrow mb-4">Activation</div>
          <h1 className="section-title mb-2">Loading activation...</h1>
          <p className="muted">Checking code status and preparing your activation flow.</p>
        </motion.div>
      </div>
    )
  }

  if (error && !qrCode) {
    return (
      <div className="activate-page min-h-screen bg-[#0A1F1F] text-white flex items-center justify-center px-4">
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="ambient-line ambient-line-1" />
        <div className="ambient-line ambient-line-2" />
        <div className="activate-bg-orb activate-bg-orb-1" />
        <div className="activate-bg-orb activate-bg-orb-2" />
        <div className="activate-bg-orb activate-bg-orb-3" />
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />
        <GlitterField count={16} />

        <motion.div
          className="surface-card w-full max-w-xl p-8 text-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.35 }}
        >
          <div className="eyebrow mb-4">Activation</div>
          <h1 className="section-title mb-4">Could not load this code</h1>
          <p className="muted mb-6">{error}</p>
          <Link to="/" className="btn btn-primary glow-btn">
            Back to Home
          </Link>
        </motion.div>
      </div>
    )
  }

  const currentUserEmail = normalizeEmail(user?.email)
  const assignedEmail = normalizeEmail(qrCode?.assigned_email)
  const hasUserAssignment = Boolean(qrCode?.assigned_to)
  const hasEmailAssignment = Boolean(assignedEmail)

  const assignedToCurrentUser =
    Boolean(user) && hasUserAssignment && qrCode.assigned_to === user.id

  const assignedToDifferentUser =
    Boolean(user) && hasUserAssignment && qrCode.assigned_to !== user.id

  const assignedToCurrentEmail =
    Boolean(user) && hasEmailAssignment && assignedEmail === currentUserEmail

  const assignedToDifferentEmail =
    Boolean(user) && hasEmailAssignment && assignedEmail !== currentUserEmail

  const unassignedCode = !hasUserAssignment && !hasEmailAssignment
  const activationBlocked = assignedToDifferentUser || assignedToDifferentEmail
  const isOpenCode = qrCode?.code_type === 'open'
  const isLockedCode = qrCode?.code_type === 'locked'

  return (
    <div className="activate-page min-h-screen bg-[#0A1F1F] text-white px-4 py-10">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="activate-bg-orb activate-bg-orb-1" />
      <div className="activate-bg-orb activate-bg-orb-2" />
      <div className="activate-bg-orb activate-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <div className="container max-w-5xl">
        <motion.div
          className="mb-6 activate-hero-copy"
          variants={heroStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
            <div className="eyebrow mb-3">Dresscode activation</div>
          </motion.div>
          <motion.h1
            className="section-title mb-2"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            Claim and unlock this QR identity
          </motion.h1>
          <motion.p
            className="muted max-w-3xl"
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            Enter the scratch code from the garment tag to activate the code and connect it to your account.
          </motion.p>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr] items-stretch">
          <motion.div
            className="activate-main-left surface-card p-8 md:p-10"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.45 }}
          >
            <div className="activate-card-glow" />
            <div className="eyebrow mb-5">Activate your Dresscode</div>
            <h2 className="section-title mb-4">Code details and activation context</h2>
            <p className="lead mb-8">
              Review the item details below before claiming ownership and unlocking its digital layer.
            </p>

            <div className="grid gap-4">
              <div className="activate-info-card">
                <div className="text-sm font-semibold">Public Code</div>
                <div className="muted mt-1">{qrCode?.code}</div>
              </div>

              <div className="activate-info-card">
                <div className="text-sm font-semibold">Label</div>
                <div className="muted mt-1">{qrCode?.label || 'Untitled code'}</div>
              </div>

              <div className="activate-info-card">
                <div className="text-sm font-semibold">Code Type</div>
                <div className="muted mt-1">
                  {isOpenCode ? 'Open code' : isLockedCode ? 'Locked code' : qrCode?.code_type}
                </div>
              </div>

              {isOpenCode ? (
                <div className="activate-state-card activate-state-card-emerald">
                  This is an open code. After activation, it will appear in your dashboard,
                  where you can open Edit Profile and personalize the live page.
                </div>
              ) : null}

              {isLockedCode ? (
                <div className="activate-state-card activate-state-card-cyan">
                  This is a locked code. After activation, it will open an official
                  template-based experience instead of a fully editable personal page.
                </div>
              ) : null}

              {unassignedCode ? (
                <div className="activate-state-card">
                  This item is ready to be claimed by the first customer who signs in
                  and enters the correct scratch code.
                </div>
              ) : null}

              {hasUserAssignment && !user ? (
                <div className="activate-state-card activate-state-card-cyan">
                  This QR code is reserved for a specific account. Sign in with the assigned account to continue.
                </div>
              ) : null}

              {hasEmailAssignment && !user ? (
                <div className="activate-state-card activate-state-card-cyan">
                  This QR code is reserved for a specific email. Sign in or create an account with that email to activate it.
                </div>
              ) : null}

              {assignedToCurrentUser ? (
                <div className="activate-state-card activate-state-card-emerald">
                  This QR code is already assigned to your account. Enter the scratch code to activate it.
                </div>
              ) : null}

              {assignedToCurrentEmail ? (
                <div className="activate-state-card activate-state-card-emerald">
                  This QR code is reserved for your email. Enter the scratch code to activate it.
                </div>
              ) : null}

              {assignedToDifferentUser ? (
                <div className="activate-state-card activate-state-card-red">
                  This QR code is assigned to another user and cannot be activated from this account.
                </div>
              ) : null}

              {assignedToDifferentEmail ? (
                <div className="activate-state-card activate-state-card-red">
                  This QR code is assigned to another email. Please sign in with the email used for this assignment.
                </div>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            className="activate-main-right glass-card p-8 md:p-10"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            {!user ? (
              <>
                <div className="eyebrow mb-5">Create account or sign in</div>
                <h2 className="display mb-4 text-3xl font-bold">
                  Start your activation in two simple steps
                </h2>

                <div className="mb-8 grid gap-4 text-sm text-white/70">
                  <div className="activate-step-card">
                    1. Create an account or sign in
                  </div>
                  <div className="activate-step-card">
                    2. Return here automatically and enter the scratch code from the tag
                  </div>
                </div>

                <p className="muted mb-8">
                  {hasEmailAssignment
                    ? 'Once you sign in with the assigned email, you can activate this item and connect it to your account.'
                    : 'Once you sign in, you can activate this item and connect it to your account.'}
                </p>

                <Link
                  to={portalHref}
                  state={{ from: location }}
                  className="btn btn-primary glow-btn"
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
                  <div className="activate-feedback activate-feedback-success mb-4">
                    {message}
                  </div>
                ) : null}

                {error ? (
                  <div className="activate-feedback activate-feedback-error mb-4">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleActivate} className="space-y-5">
                  <div className="activate-input-shell">
                    <label className="mb-2 block text-sm font-medium">
                      Scratch Code
                    </label>
                    <input
                      type="text"
                      value={formScratchCode}
                      onChange={(e) => setFormScratchCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX"
                      className="field"
                      disabled={activationBlocked}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || activationBlocked}
                    className="btn btn-primary glow-btn w-full"
                  >
                    {submitting ? 'Activating...' : 'Activate Code'}
                  </button>
                </form>

                <div className="mt-6 text-sm text-white/45">
                  Signed in as {user.email}
                </div>
              </>
            )}
          </motion.div>
        </div>

        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45 }}
        >
          <div className="glass-card p-5">
            <div className="metric-value">Ownership</div>
            <div className="metric-label">Claim the physical item through scratch verification</div>
          </div>

          <div className="glass-card p-5">
            <div className="metric-value">Identity Layer</div>
            <div className="metric-label">Connect a real-world product to its live digital profile</div>
          </div>

          <div className="glass-card p-5">
            <div className="metric-value">Dashboard Ready</div>
            <div className="metric-label">Continue managing the activated code from your account</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
