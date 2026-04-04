import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import { activateQrCode, getQrCodeByCode } from '../lib/qr'

gsap.registerPlugin(ScrollTrigger)

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

export default function Activate() {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useAuth()
  const rootRef = useRef(null)

  const [qrLoading, setQrLoading] = useState(true)
  const [qrCode, setQrCode] = useState(null)
  const [formScratchCode, setFormScratchCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const portalHref = useMemo(() => '/portal', [])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.activate-hero-copy > *',
        { opacity: 0, y: 34 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: 'power3.out',
        }
      )

      gsap.fromTo(
        '.activate-main-left',
        { opacity: 0, x: -22, scale: 0.985 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.88,
          ease: 'power3.out',
          delay: 0.08,
        }
      )

      gsap.fromTo(
        '.activate-main-right',
        { opacity: 0, x: 22, scale: 0.985 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.14,
        }
      )

      gsap.utils.toArray('.reveal-up').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 38 },
          {
            opacity: 1,
            y: 0,
            duration: 0.78,
            delay: i * 0.02,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 86%',
            },
          }
        )
      })

      gsap.utils.toArray('.reveal-scale').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
            },
          }
        )
      })

      gsap.to('.pulse-grid', {
        backgroundPosition: '220% 220%',
        duration: 22,
        repeat: -1,
        ease: 'none',
      })

      gsap.to('.activate-bg-orb-1', {
        y: 22,
        x: 12,
        duration: 6.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.activate-bg-orb-2', {
        y: -18,
        x: -12,
        duration: 7.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.activate-bg-orb-3', {
        y: 14,
        x: 10,
        duration: 8.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.utils.toArray('.float-card').forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 === 0 ? -8 : 8,
          duration: 3.6 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })

      gsap.utils.toArray('.tilt-card').forEach((card) => {
        const inner = card.querySelector('.tilt-inner')
        if (!inner) return

        const handleMove = (e) => {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const rotateY = ((x / rect.width) - 0.5) * 8
          const rotateX = -((y / rect.height) - 0.5) * 8

          gsap.to(inner, {
            rotateX,
            rotateY,
            transformPerspective: 900,
            transformOrigin: 'center',
            duration: 0.3,
            ease: 'power2.out',
          })

          gsap.to(card, {
            '--spotlight-x': `${x}px`,
            '--spotlight-y': `${y}px`,
            duration: 0.22,
            ease: 'power2.out',
          })
        }

        const handleLeave = () => {
          gsap.to(inner, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.45,
            ease: 'power3.out',
          })
        }

        card.addEventListener('mousemove', handleMove)
        card.addEventListener('mouseleave', handleLeave)

        cleanupFns.push(() => {
          card.removeEventListener('mousemove', handleMove)
          card.removeEventListener('mouseleave', handleLeave)
        })
      })

      gsap.utils.toArray('.magnetic-btn').forEach((btn) => {
        const handleMove = (e) => {
          const rect = btn.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2

          gsap.to(btn, {
            x: x * 0.11,
            y: y * 0.11,
            duration: 0.28,
            ease: 'power3.out',
          })
        }

        const handleLeave = () => {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.45,
            ease: 'elastic.out(1, 0.45)',
          })
        }

        btn.addEventListener('mousemove', handleMove)
        btn.addEventListener('mouseleave', handleLeave)

        cleanupFns.push(() => {
          btn.removeEventListener('mousemove', handleMove)
          btn.removeEventListener('mouseleave', handleLeave)
        })
      })
    }, rootRef)

    return () => {
      cleanupFns.forEach((fn) => fn())
      ctx.revert()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

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
      <div
        ref={rootRef}
        className="app-shell activate-page min-h-screen bg-[#0A1F1F] text-white flex items-center justify-center"
      >
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="activate-bg-orb activate-bg-orb-1" />
        <div className="activate-bg-orb activate-bg-orb-2" />
        <div className="activate-bg-orb activate-bg-orb-3" />
        <GlitterField count={14} />

        <div className="surface-card tilt-card p-8 reveal-scale">
          <div className="tilt-inner">
            <div className="eyebrow mb-4">Activation</div>
            <h1 className="section-title mb-2">Loading activation...</h1>
            <p className="muted">Checking code status and preparing your activation flow.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !qrCode) {
    return (
      <div
        ref={rootRef}
        className="activate-page min-h-screen bg-[#0A1F1F] text-white flex items-center justify-center px-4"
      >
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

        <div className="surface-card w-full max-w-xl p-8 text-center tilt-card reveal-scale">
          <div className="tilt-inner activate-hero-copy">
            <div className="eyebrow mb-4">Activation</div>
            <h1 className="section-title mb-4">Could not load this code</h1>
            <p className="muted mb-6">{error}</p>
            <Link to="/" className="btn btn-primary glow-btn magnetic-btn">
              Back to Home
            </Link>
          </div>
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
    <div ref={rootRef} className="activate-page min-h-screen bg-[#0A1F1F] text-white px-4 py-10">
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
        <div className="mb-6 activate-hero-copy">
          <div className="eyebrow mb-3">Dresscode activation</div>
          <h1 className="section-title mb-2">Claim and unlock this QR identity</h1>
          <p className="muted max-w-3xl">
            Enter the scratch code from the garment tag to activate the code and connect it to your account.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr] items-stretch">
          <div className="activate-main-left surface-card p-8 md:p-10 tilt-card">
            <div className="tilt-inner">
              <div className="activate-card-glow" />
              <div className="eyebrow mb-5">Activate your Dresscode</div>
              <h2 className="section-title mb-4">Code details and activation context</h2>
              <p className="lead mb-8">
                Review the item details below before claiming ownership and unlocking its digital layer.
              </p>

              <div className="grid gap-4">
                <div className="activate-info-card reveal-up float-card">
                  <div className="text-sm font-semibold">Public Code</div>
                  <div className="muted mt-1">{qrCode?.code}</div>
                </div>

                <div className="activate-info-card reveal-up float-card">
                  <div className="text-sm font-semibold">Label</div>
                  <div className="muted mt-1">{qrCode?.label || 'Untitled code'}</div>
                </div>

                <div className="activate-info-card reveal-up float-card">
                  <div className="text-sm font-semibold">Code Type</div>
                  <div className="muted mt-1">
                    {isOpenCode ? 'Open code' : isLockedCode ? 'Locked code' : qrCode?.code_type}
                  </div>
                </div>

                {isOpenCode ? (
                  <div className="activate-state-card activate-state-card-emerald reveal-up">
                    This is an open code. After activation, it will appear in your dashboard,
                    where you can open Edit Profile and personalize the live page.
                  </div>
                ) : null}

                {isLockedCode ? (
                  <div className="activate-state-card activate-state-card-cyan reveal-up">
                    This is a locked code. After activation, it will open an official
                    template-based experience instead of a fully editable personal page.
                  </div>
                ) : null}

                {unassignedCode ? (
                  <div className="activate-state-card reveal-up">
                    This item is ready to be claimed by the first customer who signs in
                    and enters the correct scratch code.
                  </div>
                ) : null}

                {assignedToCurrentUser ? (
                  <div className="activate-state-card activate-state-card-emerald reveal-up">
                    This QR code is already assigned to your account. Enter the scratch code to activate it.
                  </div>
                ) : null}

                {assignedToDifferentUser ? (
                  <div className="activate-state-card activate-state-card-red reveal-up">
                    This QR code is assigned to another user and cannot be activated from this account.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="activate-main-right glass-card p-8 md:p-10 tilt-card">
            <div className="tilt-inner">
              {!user ? (
                <>
                  <div className="eyebrow mb-5">Create account or sign in</div>
                  <h2 className="display mb-4 text-3xl font-bold">
                    Start your activation in two simple steps
                  </h2>

                  <div className="mb-8 grid gap-4 text-sm text-white/70">
                    <div className="activate-step-card float-card">
                      1. Create an account or sign in
                    </div>
                    <div className="activate-step-card float-card">
                      2. Return here automatically and enter the scratch code from the tag
                    </div>
                  </div>

                  <p className="muted mb-8">
                    Once you sign in, you can activate this item and connect it to your account.
                  </p>

                  <Link
                    to={portalHref}
                    state={{ from: location }}
                    className="btn btn-primary glow-btn magnetic-btn"
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
                        disabled={assignedToDifferentUser}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || assignedToDifferentUser}
                      className="btn btn-primary glow-btn magnetic-btn w-full"
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

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="glass-card p-5 tilt-card reveal-scale">
            <div className="tilt-inner">
              <div className="metric-value">Ownership</div>
              <div className="metric-label">Claim the physical item through scratch verification</div>
            </div>
          </div>

          <div className="glass-card p-5 tilt-card reveal-scale">
            <div className="tilt-inner">
              <div className="metric-value">Identity Layer</div>
              <div className="metric-label">Connect a real-world product to its live digital profile</div>
            </div>
          </div>

          <div className="glass-card p-5 tilt-card reveal-scale">
            <div className="tilt-inner">
              <div className="metric-value">Dashboard Ready</div>
              <div className="metric-label">Continue managing the activated code from your account</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
