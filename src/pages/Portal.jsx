import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

gsap.registerPlugin(ScrollTrigger)

const initialRegister = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
}

const initialLogin = {
  email: '',
  password: '',
}

function getPasswordChecks(password) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
  }
}

function getPasswordStrength(password) {
  if (!password) {
    return { label: '', value: 0, tone: 'none' }
  }

  const checks = getPasswordChecks(password)
  const passed = Object.values(checks).filter(Boolean).length

  if (passed === 0) {
    return { label: 'Weak', value: 15, tone: 'weak' }
  }

  if (passed === 1) {
    return { label: 'Weak', value: 33, tone: 'weak' }
  }

  if (passed === 2) {
    return { label: 'Medium', value: 66, tone: 'medium' }
  }

  return { label: 'Strong', value: 100, tone: 'strong' }
}

function PasswordChecklist({ password }) {
  const checks = getPasswordChecks(password)

  function row(ok, text) {
    return (
      <div
        className={`text-sm transition ${
          ok ? 'text-emerald-300' : 'text-white/45'
        }`}
      >
        {ok ? '✓' : '•'} {text}
      </div>
    )
  }

  return (
    <div className="mt-3 grid gap-1">
      {row(checks.minLength, 'At least 8 characters')}
      {row(checks.hasUppercase, 'At least 1 uppercase letter')}
      {row(checks.hasNumber, 'At least 1 number')}
    </div>
  )
}

function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password)

  if (!password) return null

  const labelClass =
    strength.tone === 'strong'
      ? 'text-emerald-300'
      : strength.tone === 'medium'
        ? 'text-amber-300'
        : 'text-red-300'

  const barClass =
    strength.tone === 'strong'
      ? 'bg-emerald-400'
      : strength.tone === 'medium'
        ? 'bg-amber-400'
        : 'bg-red-400'

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/60">Password strength</span>
        <span className={labelClass}>{strength.label}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClass}`}
          style={{ width: `${strength.value}%` }}
        />
      </div>
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="field pr-14"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggle}
          className="portal-toggle-password absolute right-4 top-1/2 -translate-y-1/2 text-sm"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
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

const panelMotion = {
  initial: { opacity: 0, y: 22 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: 0.2 },
  },
}

export default function Portal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshProfile } = useAuth()
  const rootRef = useRef(null)

  const [mode, setMode] = useState('signin')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [registerForm, setRegisterForm] = useState(initialRegister)
  const [forgotEmail, setForgotEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  const from = useMemo(() => location.state?.from?.pathname || '/dashboard', [location.state])
  const isActivationReturn = useMemo(() => from.startsWith('/activate/'), [from])

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setMode('reset-password')
    }
  }, [])

  useEffect(() => {
    if (user && mode !== 'reset-password') {
      navigate(from, { replace: true })
    }
  }, [user, mode, navigate, from])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.portal-hero-copy > *',
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.09,
          ease: 'power3.out',
        }
      )

      gsap.fromTo(
        '.portal-auth-main',
        { opacity: 0, y: 38, scale: 0.975, rotateX: 5 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          duration: 0.95,
          ease: 'power3.out',
          delay: 0.12,
        }
      )

      gsap.utils.toArray('.reveal-up').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
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
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
            },
          }
        )
      })

      gsap.to('.portal-bg-grid', {
        backgroundPosition: '220% 220%',
        duration: 22,
        repeat: -1,
        ease: 'none',
      })

      gsap.to('.portal-bg-orb-1', {
        y: 24,
        x: 12,
        duration: 6.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.portal-bg-orb-2', {
        y: -18,
        x: -14,
        duration: 7.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.portal-bg-orb-3', {
        y: 16,
        x: 10,
        duration: 8.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.utils.toArray('.float-card').forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 === 0 ? -8 : 8,
          duration: 3.5 + i * 0.3,
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

  function clearFeedback() {
    setMessage('')
    setError('')
  }

  function validatePassword(password) {
    const checks = getPasswordChecks(password)

    if (!checks.minLength) {
      return 'Password must be at least 8 characters.'
    }

    if (!checks.hasUppercase) {
      return 'Password must include at least one uppercase letter.'
    }

    if (!checks.hasNumber) {
      return 'Password must include at least one number.'
    }

    return ''
  }

  async function handleRegister(e) {
    e.preventDefault()
    clearFeedback()

    if (!registerForm.fullName.trim()) {
      setError('Full name is required.')
      return
    }

    if (!registerForm.email.trim()) {
      setError('Email is required.')
      return
    }

    const passwordError = validatePassword(registerForm.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!registerForm.acceptTerms) {
      setError('You must accept the Terms of Service.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        data: {
          full_name: registerForm.fullName.trim(),
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage(
      isActivationReturn
        ? 'Account created. Check your email to verify your account, then sign in to continue activating your item.'
        : 'Account created. Check your email to verify your account, then sign in.'
    )
    setRegisterForm(initialRegister)
    setMode('signin')
  }

  async function handleLogin(e) {
    e.preventDefault()
    clearFeedback()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    await refreshProfile()
    navigate(from, { replace: true })
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    clearFeedback()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/portal`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Password reset email sent. Check your inbox.')
    setForgotEmail('')
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    clearFeedback()

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Password updated successfully. Please sign in.')
    setMode('signin')
    setNewPassword('')
    setConfirmNewPassword('')
    window.history.replaceState({}, document.title, '/portal')
  }

  return (
    <div ref={rootRef} className="app-shell portal-page min-h-screen bg-[#0A1F1F] text-white">
      <Navbar />

      <div className="page-noise" />
      <div className="portal-bg-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="portal-bg-orb portal-bg-orb-1" />
      <div className="portal-bg-orb portal-bg-orb-2" />
      <div className="portal-bg-orb portal-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <div className="px-4 py-8 md:py-10">
        <div className="container max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between portal-hero-copy">
            <div>
              <div className="eyebrow mb-3">Dresscode Portal</div>
              <h1 className="section-title">Access your account</h1>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/" className="btn btn-secondary magnetic-btn">
                Back to Home
              </Link>
            </div>
          </div>

          {isActivationReturn ? (
            <div className="portal-activation-banner mb-6 reveal-up">
              <div className="eyebrow mb-2">Activation in progress</div>
              <h2 className="mb-2 text-2xl font-bold">You’re signing in to claim a QR item</h2>
              <p className="text-sm leading-7 text-white/70">
                After sign in, you will return automatically to the activation page and
                enter the scratch code from the garment or product tag.
              </p>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="surface-card portal-info-card p-8 md:p-10 tilt-card reveal-up">
              <div className="tilt-inner">
                <div className="portal-card-glow" />
                <div className="eyebrow mb-5">Access the platform</div>

                <h1 className="section-title mb-4">
                  Sign in, activate QR identities, and manage live profile experiences
                </h1>

                <p className="lead mb-8">
                  This portal is the entry point for authentication, ownership activation,
                  dashboard access, and account recovery.
                </p>

                {isActivationReturn ? (
                  <div className="grid gap-4">
                    <div className="portal-feature-card portal-feature-card-emerald float-card">
                      <div className="portal-feature-index">01</div>
                      <div>
                        <div className="mb-2 text-lg font-semibold">Sign in or create your account</div>
                        <div className="text-sm leading-7 text-white/62">
                          Your account is required before the QR item can be connected to you.
                        </div>
                      </div>
                    </div>

                    <div className="portal-feature-card portal-feature-card-emerald float-card">
                      <div className="portal-feature-index">02</div>
                      <div>
                        <div className="mb-2 text-lg font-semibold">Return to activation automatically</div>
                        <div className="text-sm leading-7 text-white/62">
                          After login, you will be sent back to the same item automatically.
                        </div>
                      </div>
                    </div>

                    <div className="portal-feature-card portal-feature-card-emerald float-card">
                      <div className="portal-feature-index">03</div>
                      <div>
                        <div className="mb-2 text-lg font-semibold">Enter the scratch code</div>
                        <div className="text-sm leading-7 text-white/62">
                          The scratch code printed on the tag is what confirms ownership of the item.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="portal-feature-card float-card">
                      <div className="portal-feature-index">01</div>
                      <div>
                        <div className="mb-2 text-lg font-semibold">Activation-ready login</div>
                        <div className="text-sm leading-7 text-white/62">
                          If you came from a QR code, signing in here will take you back into the
                          activation flow automatically.
                        </div>
                      </div>
                    </div>

                    <div className="portal-feature-card float-card">
                      <div className="portal-feature-index">02</div>
                      <div>
                        <div className="mb-2 text-lg font-semibold">Secure password recovery</div>
                        <div className="text-sm leading-7 text-white/62">
                          Reset links return here so users can safely update credentials and continue.
                        </div>
                      </div>
                    </div>

                    <div className="portal-feature-card float-card">
                      <div className="portal-feature-index">03</div>
                      <div>
                        <div className="mb-2 text-lg font-semibold">Role-based dashboard access</div>
                        <div className="text-sm leading-7 text-white/62">
                          Users, journalists, and admins all enter through this same portal.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card portal-auth-card portal-auth-main p-6 md:p-8 tilt-card reveal-scale">
              <div className="tilt-inner">
                <div className="portal-auth-head mb-6">
                  <div className="portal-auth-chip">Secure Access</div>
                  <div className="portal-auth-title">
                    {mode === 'signin' && 'Welcome back'}
                    {mode === 'register' && 'Create your account'}
                    {mode === 'forgot' && 'Reset access'}
                    {mode === 'reset-password' && 'Choose a new password'}
                  </div>
                  <div className="portal-auth-subtitle">
                    Continue to your dashboard, activation flow, or account recovery.
                  </div>
                </div>

                <div className="portal-mode-tabs mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      clearFeedback()
                      setMode('signin')
                    }}
                    className={`portal-mode-tab magnetic-btn ${mode === 'signin' ? 'portal-mode-tab-active' : ''}`}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearFeedback()
                      setMode('register')
                    }}
                    className={`portal-mode-tab magnetic-btn ${mode === 'register' ? 'portal-mode-tab-active' : ''}`}
                  >
                    Register
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearFeedback()
                      setMode('forgot')
                    }}
                    className={`portal-mode-tab magnetic-btn ${mode === 'forgot' ? 'portal-mode-tab-active' : ''}`}
                  >
                    Reset
                  </button>
                </div>

                {message ? (
                  <div className="portal-message portal-message-success mb-4">
                    {message}
                  </div>
                ) : null}

                {error ? (
                  <div className="portal-message portal-message-error mb-4">
                    {error}
                  </div>
                ) : null}

                <AnimatePresence mode="wait">
                  {mode === 'signin' && (
                    <motion.form
                      key="signin"
                      className="space-y-4"
                      onSubmit={handleLogin}
                      variants={panelMotion}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <div>
                        <label className="mb-2 block text-sm font-medium">Email</label>
                        <input
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                          className="field"
                          placeholder="you@example.com"
                        />
                      </div>

                      <PasswordField
                        label="Password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Enter your password"
                        visible={showLoginPassword}
                        onToggle={() => setShowLoginPassword((prev) => !prev)}
                      />

                      <button type="submit" disabled={loading} className="btn btn-primary glow-btn magnetic-btn w-full">
                        {loading ? 'Signing in...' : isActivationReturn ? 'Sign In and Continue' : 'Sign In'}
                      </button>

                      <div className="flex justify-between text-sm text-white/60">
                        <button
                          type="button"
                          className="portal-inline-action"
                          onClick={() => {
                            clearFeedback()
                            setMode('forgot')
                          }}
                        >
                          Forgot password?
                        </button>

                        <button
                          type="button"
                          className="portal-inline-action"
                          onClick={() => {
                            clearFeedback()
                            setMode('register')
                          }}
                        >
                          Create account
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {mode === 'register' && (
                    <motion.form
                      key="register"
                      className="space-y-4"
                      onSubmit={handleRegister}
                      variants={panelMotion}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <div>
                        <label className="mb-2 block text-sm font-medium">Full Name</label>
                        <input
                          type="text"
                          value={registerForm.fullName}
                          onChange={(e) =>
                            setRegisterForm((prev) => ({ ...prev, fullName: e.target.value }))
                          }
                          className="field"
                          placeholder="Your full name"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Email</label>
                        <input
                          type="email"
                          value={registerForm.email}
                          onChange={(e) =>
                            setRegisterForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                          className="field"
                          placeholder="you@example.com"
                        />
                      </div>

                      <div className="portal-password-panel">
                        <PasswordField
                          label="Password"
                          value={registerForm.password}
                          onChange={(e) =>
                            setRegisterForm((prev) => ({ ...prev, password: e.target.value }))
                          }
                          placeholder="At least 8 characters, 1 uppercase, 1 number"
                          visible={showRegisterPassword}
                          onToggle={() => setShowRegisterPassword((prev) => !prev)}
                        />
                        <PasswordStrengthBar password={registerForm.password} />
                        <PasswordChecklist password={registerForm.password} />
                      </div>

                      <PasswordField
                        label="Confirm Password"
                        value={registerForm.confirmPassword}
                        onChange={(e) =>
                          setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        placeholder="Repeat your password"
                        visible={showRegisterConfirmPassword}
                        onToggle={() => setShowRegisterConfirmPassword((prev) => !prev)}
                      />

                      <label className="portal-checkbox-row">
                        <input
                          type="checkbox"
                          checked={registerForm.acceptTerms}
                          onChange={(e) =>
                            setRegisterForm((prev) => ({ ...prev, acceptTerms: e.target.checked }))
                          }
                          className="mt-1"
                        />
                        <span>I agree to the Terms of Service.</span>
                      </label>

                      <button type="submit" disabled={loading} className="btn btn-primary glow-btn magnetic-btn w-full">
                        {loading
                          ? 'Creating account...'
                          : isActivationReturn
                            ? 'Create Account and Continue'
                            : 'Create Account'}
                      </button>
                    </motion.form>
                  )}

                  {mode === 'forgot' && (
                    <motion.form
                      key="forgot"
                      className="space-y-4"
                      onSubmit={handleForgotPassword}
                      variants={panelMotion}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <div>
                        <label className="mb-2 block text-sm font-medium">Email</label>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="field"
                          placeholder="you@example.com"
                        />
                      </div>

                      <button type="submit" disabled={loading} className="btn btn-primary glow-btn magnetic-btn w-full">
                        {loading ? 'Sending...' : 'Send Reset Email'}
                      </button>
                    </motion.form>
                  )}

                  {mode === 'reset-password' && (
                    <motion.form
                      key="reset-password"
                      className="space-y-4"
                      onSubmit={handleUpdatePassword}
                      variants={panelMotion}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <div className="portal-password-panel">
                        <PasswordField
                          label="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters, 1 uppercase, 1 number"
                          visible={showNewPassword}
                          onToggle={() => setShowNewPassword((prev) => !prev)}
                        />
                        <PasswordStrengthBar password={newPassword} />
                        <PasswordChecklist password={newPassword} />
                      </div>

                      <PasswordField
                        label="Confirm New Password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repeat your new password"
                        visible={showConfirmNewPassword}
                        onToggle={() => setShowConfirmNewPassword((prev) => !prev)}
                      />

                      <button type="submit" disabled={loading} className="btn btn-primary glow-btn magnetic-btn w-full">
                        {loading ? 'Updating password...' : 'Update Password'}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="mt-6 border-t border-[rgba(94,207,207,0.08)] pt-5 text-sm text-white/45">
                  <div className="flex flex-wrap gap-3">
                    <Link to="/" className="text-white/65 transition hover:text-[#5ECFCF]">
                      Home
                    </Link>
                    <Link to="/how-it-works" className="text-white/65 transition hover:text-[#5ECFCF]">
                      How it Works
                    </Link>
                    <Link to="/contact" className="text-white/65 transition hover:text-[#5ECFCF]">
                      Contact
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isActivationReturn ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="glass-card p-5 tilt-card reveal-scale">
                <div className="tilt-inner">
                  <div className="metric-value">Secure Auth</div>
                  <div className="metric-label">Email login, recovery, and password reset</div>
                </div>
              </div>

              <div className="glass-card p-5 tilt-card reveal-scale">
                <div className="tilt-inner">
                  <div className="metric-value">Activation Flow</div>
                  <div className="metric-label">Return users directly to QR ownership claiming</div>
                </div>
              </div>

              <div className="glass-card p-5 tilt-card reveal-scale">
                <div className="tilt-inner">
                  <div className="metric-value">Dashboard Access</div>
                  <div className="metric-label">Role-based entry for profiles and admin tools</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
