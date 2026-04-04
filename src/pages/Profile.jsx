import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'

import {
  getCodeProfileByQrId,
  getQrCodeByCode,
  getTemplateById,
  insertScan,
} from '../lib/qr'

gsap.registerPlugin(ScrollTrigger)

function normalizeUrl(url, platform = '') {
  if (!url) return '#'

  const trimmed = url.trim()

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed
  }

  if (platform === 'email') {
    return `mailto:${trimmed.replace(/^mailto:/, '')}`
  }

  if (platform === 'phone') {
    return `tel:${trimmed.replace(/^tel:/, '')}`
  }

  return `https://${trimmed}`
}

function platformLabel(platform, fallback) {
  const map = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    twitter: 'X / Twitter',
    github: 'GitHub',
    spotify: 'Spotify',
    facebook: 'Facebook',
    discord: 'Discord',
    website: 'Website',
    email: 'Email',
    phone: 'Phone',
  }

  return fallback || map[platform] || 'Social'
}

function renderBlock(block, accentColor) {
  if (block.type === 'avatar') {
    const alignClass =
      block.align === 'center'
        ? 'items-center text-center'
        : 'items-start text-left'

    const rowClass =
      block.align === 'center'
        ? 'flex flex-col items-center gap-4'
        : 'flex flex-col gap-4 sm:flex-row sm:items-center'

    return (
      <div className={`${rowClass} ${alignClass}`}>
        <div className="profile-avatar-shell h-24 w-24 overflow-hidden rounded-full border border-[rgba(94,207,207,0.18)] bg-[rgba(255,255,255,0.03)]">
          {block.imageUrl ? (
            <img
              src={block.imageUrl}
              alt={block.name || 'Avatar'}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div>
          {block.showName !== false && block.name ? (
            <div className="display text-3xl font-bold">{block.name}</div>
          ) : null}
          {block.showBio !== false && block.bio ? (
            <div className="mt-2 text-white/65 leading-7 whitespace-pre-wrap">
              {block.bio}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  if (block.type === 'text') {
    const alignClass =
      block.align === 'center'
        ? 'text-center'
        : block.align === 'right'
          ? 'text-right'
          : 'text-left'

    const sizeClass =
      block.size === 'lg'
        ? 'text-xl'
        : block.size === 'sm'
          ? 'text-sm'
          : 'text-base'

    return (
      <div className={`${alignClass} ${sizeClass} whitespace-pre-wrap leading-7 text-white/88`}>
        {block.content}
      </div>
    )
  }

  if (block.type === 'link') {
    return (
      <a
        href={normalizeUrl(block.url)}
        target="_blank"
        rel="noreferrer"
        className="profile-link-block block rounded-[18px] border p-4 transition hover:translate-y-[-1px]"
        style={{
          borderColor: 'rgba(94,207,207,0.16)',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <div className="font-semibold" style={{ color: accentColor || '#5ECFCF' }}>
          {block.label || 'Untitled link'}
        </div>
        {block.sublabel ? (
          <div className="mt-1 text-sm text-white/55">{block.sublabel}</div>
        ) : null}
      </a>
    )
  }

  if (block.type === 'socials') {
    const items = block.items || []
    const isGrid = block.layout === 'grid'

    return (
      <div className="grid gap-4">
        {block.title ? (
          <h3 className="text-xl font-semibold" style={{ color: accentColor || '#5ECFCF' }}>
            {block.title}
          </h3>
        ) : null}

        <div className={`grid gap-3 ${isGrid ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {items.map((item) => (
            <a
              key={item.id}
              href={normalizeUrl(item.url, item.platform)}
              target={item.platform === 'email' || item.platform === 'phone' ? undefined : '_blank'}
              rel={item.platform === 'email' || item.platform === 'phone' ? undefined : 'noreferrer'}
              className="profile-social-block block rounded-[18px] border p-4 transition hover:translate-y-[-1px]"
              style={{
                borderColor: 'rgba(94,207,207,0.16)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="font-semibold" style={{ color: accentColor || '#5ECFCF' }}>
                {platformLabel(item.platform, item.label)}
              </div>
              {item.url ? (
                <div className="mt-1 break-all text-sm text-white/55">{item.url}</div>
              ) : null}
            </a>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'image') {
    return (
      <div>
        {block.imageUrl ? (
          <img
            src={block.imageUrl}
            alt={block.alt || 'Image block'}
            className="w-full object-cover"
            style={{ borderRadius: `${block.borderRadius || 20}px` }}
          />
        ) : null}
        {block.caption ? (
          <div className="mt-3 text-sm text-white/55">{block.caption}</div>
        ) : null}
      </div>
    )
  }

  if (block.type === 'badge') {
    return <span className="badge">{block.text || 'Badge'}</span>
  }

  if (block.type === 'divider') {
    return <div className="divider" />
  }

  if (block.type === 'spacer') {
    return <div style={{ height: `${block.height || 24}px` }} />
  }

  return null
}

function getColumnGridClass(count) {
  if (count === 2) return 'md:grid-cols-2'
  if (count === 3) return 'md:grid-cols-2 xl:grid-cols-3'
  if (count === 4) return 'md:grid-cols-2 xl:grid-cols-4'
  return 'grid-cols-1'
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

export default function Profile() {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const rootRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [state, setState] = useState('loading')
  const [qrCode, setQrCode] = useState(null)
  const [profile, setProfile] = useState(null)
  const [template, setTemplate] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.profile-hero-copy > *',
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
        '.profile-owner-controls',
        { opacity: 0, y: -18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power3.out',
          delay: 0.05,
        }
      )

      gsap.fromTo(
        '.profile-navbar-shell',
        { opacity: 0, y: -16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.78,
          ease: 'power3.out',
          delay: 0.08,
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

      gsap.to('.profile-bg-orb-1', {
        y: 22,
        x: 12,
        duration: 6.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.profile-bg-orb-2', {
        y: -18,
        x: -12,
        duration: 7.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.profile-bg-orb-3', {
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

    async function resolveProfile() {
      setLoading(true)
      setErrorMessage('')

      const { data: qr, error: qrError } = await getQrCodeByCode(code)

      if (!active) return

      if (qrError) {
        setState('error')
        setErrorMessage(qrError.message)
        setLoading(false)
        return
      }

      if (!qr) {
        setState('not-found')
        setLoading(false)
        return
      }

      setQrCode(qr)

      if (!qr.is_active) {
        setState('inactive')
        setLoading(false)
        return
      }

      const isLockedTemplateCode =
        qr.code_type === 'locked' && Boolean(qr.template_id)

      if (isLockedTemplateCode) {
        const { data: lockedTemplate, error: templateError } = await getTemplateById(qr.template_id)

        if (!active) return

        if (templateError) {
          setState('error')
          setErrorMessage(templateError.message)
          setLoading(false)
          return
        }

        if (!lockedTemplate) {
          setState('error')
          setErrorMessage('Locked template not found.')
          setLoading(false)
          return
        }

        setTemplate(lockedTemplate)

        if (lockedTemplate?.page_data?.settings?.redirectUrl) {
          window.location.href = normalizeUrl(lockedTemplate.page_data.settings.redirectUrl)
          return
        }

        await insertScan(qr.id)
        setState('active')
        setLoading(false)
        return
      }

      if (!qr.activated) {
        navigate(`/activate/${code}`, {
          replace: true,
          state: { from: location },
        })
        return
      }

      const { data: codeProfile, error: profileError } = await getCodeProfileByQrId(qr.id)

      if (!active) return

      if (profileError) {
        setState('error')
        setErrorMessage(profileError.message)
        setLoading(false)
        return
      }

      if (!codeProfile && qr.code_type === 'open') {
        setState('no-profile')
        setLoading(false)
        return
      }

      setProfile(codeProfile || null)

      if (codeProfile?.page_data?.settings?.redirectUrl) {
        window.location.href = normalizeUrl(codeProfile.page_data.settings.redirectUrl)
        return
      }

      await insertScan(qr.id)
      setState('active')
      setLoading(false)
    }

    resolveProfile()

    return () => {
      active = false
    }
  }, [code, navigate, location])

  if (loading) {
    return (
      <div
        ref={rootRef}
        className="profile-page flex min-h-screen items-center justify-center bg-[#0A1F1F] text-white"
      >
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="profile-bg-orb profile-bg-orb-1" />
        <div className="profile-bg-orb profile-bg-orb-2" />
        <div className="profile-bg-orb profile-bg-orb-3" />
        <GlitterField count={14} />

        <div className="surface-card p-8 tilt-card reveal-scale">
          <div className="tilt-inner">
            <div className="eyebrow mb-4">Profile</div>
            <h1 className="section-title mb-2">Loading profile...</h1>
            <p className="muted">Preparing this live public experience.</p>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'not-found') {
    return (
      <div
        ref={rootRef}
        className="profile-page flex min-h-screen items-center justify-center bg-[#0A1F1F] px-4 text-white"
      >
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="ambient-line ambient-line-1" />
        <div className="ambient-line ambient-line-2" />
        <div className="profile-bg-orb profile-bg-orb-1" />
        <div className="profile-bg-orb profile-bg-orb-2" />
        <div className="profile-bg-orb profile-bg-orb-3" />
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />
        <GlitterField count={16} />

        <div className="surface-card w-full max-w-xl p-8 text-center tilt-card reveal-scale">
          <div className="tilt-inner">
            <div className="eyebrow mb-4">Profile error</div>
            <h1 className="section-title mb-4">Code not found</h1>
            <p className="muted mb-6">
              This QR code does not exist or is not available.
            </p>
            <Link to="/" className="btn btn-primary glow-btn magnetic-btn">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'inactive') {
    return (
      <div
        ref={rootRef}
        className="profile-page flex min-h-screen items-center justify-center bg-[#0A1F1F] px-4 text-white"
      >
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="ambient-line ambient-line-1" />
        <div className="ambient-line ambient-line-2" />
        <div className="profile-bg-orb profile-bg-orb-1" />
        <div className="profile-bg-orb profile-bg-orb-2" />
        <div className="profile-bg-orb profile-bg-orb-3" />
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />
        <GlitterField count={16} />

        <div className="surface-card w-full max-w-xl p-8 text-center tilt-card reveal-scale">
          <div className="tilt-inner">
            <div className="eyebrow mb-4">Unavailable</div>
            <h1 className="section-title mb-4">This code is inactive</h1>
            <p className="muted mb-6">
              The code exists, but it is currently disabled.
            </p>
            <Link to="/" className="btn btn-primary glow-btn magnetic-btn">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'no-profile') {
    return (
      <div
        ref={rootRef}
        className="profile-page flex min-h-screen items-center justify-center bg-[#0A1F1F] px-4 text-white"
      >
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="ambient-line ambient-line-1" />
        <div className="ambient-line ambient-line-2" />
        <div className="profile-bg-orb profile-bg-orb-1" />
        <div className="profile-bg-orb profile-bg-orb-2" />
        <div className="profile-bg-orb profile-bg-orb-3" />
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />
        <GlitterField count={16} />

        <div className="surface-card w-full max-w-xl p-8 text-center tilt-card reveal-scale">
          <div className="tilt-inner">
            <div className="eyebrow mb-4">Profile pending</div>
            <h1 className="section-title mb-4">This code has no live page yet</h1>
            <p className="muted mb-6">
              The code is activated, but its public profile has not been set up yet.
            </p>
            <Link to="/" className="btn btn-primary glow-btn magnetic-btn">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div
        ref={rootRef}
        className="profile-page flex min-h-screen items-center justify-center bg-[#0A1F1F] px-4 text-white"
      >
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="ambient-line ambient-line-1" />
        <div className="ambient-line ambient-line-2" />
        <div className="profile-bg-orb profile-bg-orb-1" />
        <div className="profile-bg-orb profile-bg-orb-2" />
        <div className="profile-bg-orb profile-bg-orb-3" />
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />
        <GlitterField count={16} />

        <div className="surface-card w-full max-w-xl p-8 text-center tilt-card reveal-scale">
          <div className="tilt-inner">
            <div className="eyebrow mb-4">System error</div>
            <h1 className="section-title mb-4">Could not load profile</h1>
            <p className="muted mb-6">{errorMessage || 'Unknown error.'}</p>
            <Link to="/" className="btn btn-primary glow-btn magnetic-btn">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const sourcePageData = template?.page_data || profile?.page_data || {}
  const sections = sourcePageData.sections || []
  const accentColor = sourcePageData.settings?.accentColor || '#5ECFCF'
  const navbar = sourcePageData.navbar || {}
  const navbarLinks = navbar.links || []

  const bg = sourcePageData.settings?.background || {}
  const backgroundStyle =
    bg.type === 'gradient'
      ? {
          background: `linear-gradient(${bg.gradientDirection || '135deg'}, ${bg.gradientFrom || '#0A1F1F'}, ${bg.gradientTo || '#123B3B'})`,
        }
      : {
          background: bg.value || '#0A1F1F',
        }

  const isLocked = qrCode?.code_type === 'locked'
  const isOpen = qrCode?.code_type === 'open'

  const pageTitle =
    profile?.full_name ||
    template?.name ||
    'Dresscode Profile'

  const pageBio =
    profile?.bio ||
    (isLocked
      ? 'Official branded content.'
      : 'This code is active and live.')

  const isOwnerViewing =
    user &&
    qrCode &&
    (qrCode.activated_by === user.id || qrCode.assigned_to === user.id)

  const canEditThisPage = isOwnerViewing && isOpen

  return (
    <div
      ref={rootRef}
      className="profile-page min-h-screen px-4 py-8 text-white"
      style={backgroundStyle}
    >
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="profile-bg-orb profile-bg-orb-1" />
      <div className="profile-bg-orb profile-bg-orb-2" />
      <div className="profile-bg-orb profile-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <div className="container max-w-6xl">
        {isOwnerViewing ? (
          <div className="profile-owner-controls mb-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary magnetic-btn"
            >
              Back
            </button>

            {canEditThisPage ? (
              <button
                type="button"
                onClick={() => navigate(`/editor/${code}`)}
                className="btn btn-secondary magnetic-btn"
              >
                Edit Page
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary glow-btn magnetic-btn"
            >
              Dashboard
            </button>
          </div>
        ) : null}

        {navbar.enabled ? (
          <div className="profile-navbar-shell sticky top-4 z-40 mb-6 rounded-[20px] border border-[rgba(94,207,207,0.14)] bg-[rgba(8,24,24,0.78)] px-4 py-4 backdrop-blur-xl tilt-card">
            <div className="tilt-inner">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="display text-xl font-bold">
                  {navbar.brandText || 'Dresscode'}
                </div>

                <div className="flex flex-wrap gap-3">
                  {navbarLinks.map((link) => {
                    const isExternal = link.type === 'external' || Boolean(link.url)

                    if (isExternal) {
                      return (
                        <a
                          key={link.id}
                          href={normalizeUrl(link.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary magnetic-btn"
                        >
                          {link.label || 'Link'}
                        </a>
                      )
                    }

                    return (
                      <a
                        key={link.id}
                        href={`#${link.anchorId || ''}`}
                        className="btn btn-secondary magnetic-btn"
                      >
                        {link.label || 'Link'}
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="profile-hero-shell mb-8 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start surface-card tilt-card p-6 md:p-8">
          <div className="tilt-inner profile-hero-copy">
            <div className="profile-card-glow" />
            <div>
              <div className="eyebrow mb-3">
                {isLocked ? 'Official profile' : 'Public profile'}
              </div>
              <h1 className="section-title mb-2">{pageTitle}</h1>
              <p className="muted mb-4">{pageBio}</p>

              {isOpen ? (
                <div className="profile-state-banner profile-state-banner-emerald max-w-2xl rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-white/80">
                  This is an open code. Its owner can personalize the live page after activation.
                </div>
              ) : null}

              {isLocked ? (
                <div className="profile-state-banner profile-state-banner-cyan max-w-2xl rounded-[18px] border border-[rgba(94,207,207,0.16)] bg-[rgba(94,207,207,0.08)] p-4 text-sm text-white/80">
                  This is a locked code. The visible content is controlled by official templates.
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 xl:justify-end">
            {isLocked ? (
              <span className="badge">Official content</span>
            ) : (
              <span className="badge">Open code</span>
            )}
          </div>
        </div>

        <div className="grid gap-5">
          {sections.length === 0 ? (
            <div className="surface-card p-8 tilt-card reveal-scale">
              <div className="tilt-inner">
                <div className="text-white/65">
                  {isLocked
                    ? 'This official page is active, but no content sections have been added yet.'
                    : 'This page is active, but no content sections have been added yet.'}
                </div>
              </div>
            </div>
          ) : null}

          {sections.map((section, sectionIndex) => (
            <section
              key={section.id}
              id={section.anchorId || undefined}
              className="profile-section-shell surface-card scroll-mt-28 tilt-card reveal-up"
              style={{
                paddingTop: `${section.paddingTop || 48}px`,
                paddingBottom: `${section.paddingBottom || 48}px`,
                paddingLeft: `${section.paddingSides || 24}px`,
                paddingRight: `${section.paddingSides || 24}px`,
                background:
                  section.background?.type === 'color' && section.background?.value
                    ? section.background.value
                    : undefined,
              }}
            >
              <div className="tilt-inner">
                <div className="mb-5">
                  <h2 className="display text-2xl font-bold">{section.name}</h2>
                </div>

                <div
                  className={`grid gap-4 ${getColumnGridClass(section.columns?.length || 1)}`}
                >
                  {(section.columns || []).map((column) => (
                    <div key={column.id} className="grid gap-4">
                      {(column.blocks || []).map((block) => (
                        <div key={block.id} className="profile-block-shell">
                          {renderBlock(block, accentColor)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 text-sm text-white/45">Powered by Dresscode</div>
      </div>
    </div>
  )
}
