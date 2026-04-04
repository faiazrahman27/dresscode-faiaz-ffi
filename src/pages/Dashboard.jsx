import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../context/AuthContext'
import DashboardSidebar from '../components/DashboardSidebar'
import DashboardStats from '../components/DashboardStats'
import MyCodesPanel from '../components/MyCodesPanel'
import AccountPanel from '../components/AccountPanel'
import TemplatesPanel from '../components/TemplatesPanel'
import AdminQrCodesPanel from '../components/AdminQrCodesPanel'
import UsersPanel from '../components/UsersPanel'
import JournalPanel from '../components/JournalPanel'
import ScanAnalyticsPanel from '../components/ScanAnalyticsPanel'
import Navbar from '../components/Navbar'

import {
  createTemplate,
  getAllQrCodes,
  getAllTemplates,
  getAllUsers,
  getMyArticles,
  getMyQrCodes,
  getPendingAssignments,
  getScanCountForUserCodes,
  updateMyProfile,
  updateTemplate,
} from '../lib/dashboard'

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

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile, signOut, refreshProfile } = useAuth()
  const rootRef = useRef(null)

  const [activeTab, setActiveTab] = useState('my-codes')
  const [codes, setCodes] = useState([])
  const [scanCount, setScanCount] = useState(0)
  const [users, setUsers] = useState([])
  const [pendingAssignments, setPendingAssignments] = useState([])
  const [allQrCodes, setAllQrCodes] = useState([])
  const [templates, setTemplates] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [savingQr, setSavingQr] = useState(false)
  const [savingUsers, setSavingUsers] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const role = profile?.role || 'user'

  const defaultTab = useMemo(() => {
    if (role === 'admin') return 'qr-codes'
    return 'my-codes'
  }, [role])

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.dashboard-hero-copy > *',
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
        '.dashboard-sidebar-wrap',
        { opacity: 0, x: -24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.08,
        }
      )

      gsap.fromTo(
        '.dashboard-main-wrap',
        { opacity: 0, y: 26, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.12,
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

      gsap.to('.dashboard-bg-grid', {
        backgroundPosition: '220% 220%',
        duration: 22,
        repeat: -1,
        ease: 'none',
      })

      gsap.to('.dashboard-bg-orb-1', {
        y: 22,
        x: 12,
        duration: 6.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.dashboard-bg-orb-2', {
        y: -18,
        x: -12,
        duration: 7.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.dashboard-bg-orb-3', {
        y: 15,
        x: 9,
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

  const loadDashboard = useCallback(async () => {
    if (!user || !profile) return

    setLoading(true)
    setError('')

    const [{ data: myCodes, error: codesError }, { count, error: scansError }] =
      await Promise.all([
        getMyQrCodes(user.id),
        getScanCountForUserCodes(user.id),
      ])

    if (codesError) {
      setError(codesError.message)
    } else {
      setCodes(myCodes || [])
    }

    if (scansError) {
      setError(scansError.message)
    } else {
      setScanCount(count || 0)
    }

    if (role === 'admin') {
      const [
        { data: loadedUsers, error: usersError },
        { data: loadedPending, error: pendingError },
        { data: qrCodes, error: allCodesError },
        { data: loadedTemplates, error: templatesError },
      ] = await Promise.all([
        getAllUsers(),
        getPendingAssignments(),
        getAllQrCodes(),
        getAllTemplates(),
      ])

      if (usersError) {
        setError(usersError.message)
      } else {
        setUsers(loadedUsers || [])
      }

      if (pendingError) {
        setError(pendingError.message)
      } else {
        setPendingAssignments(loadedPending || [])
      }

      if (allCodesError) {
        setError(allCodesError.message)
      } else {
        setAllQrCodes(qrCodes || [])
      }

      if (templatesError) {
        setError(templatesError.message)
      } else {
        setTemplates(loadedTemplates || [])
      }
    }

    if (role === 'admin' || role === 'journalist') {
      const { data: loadedArticles, error: articlesError } = await getMyArticles(
        user.id,
        role === 'admin'
      )

      if (articlesError) {
        setError(articlesError.message)
      } else {
        setArticles(loadedArticles || [])
      }
    }

    setLoading(false)
  }, [user, profile, role])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  async function handleSaveProfile(updates) {
    if (!user) return

    setSavingProfile(true)
    setError('')
    setFeedback('')

    const { error } = await updateMyProfile(user.id, updates)

    setSavingProfile(false)

    if (error) {
      setError(error.message)
      return
    }

    await refreshProfile()
    setFeedback('Profile updated successfully.')
    await loadDashboard()
  }

  async function handleCreateTemplate(name) {
    if (!user) return

    setSavingTemplate(true)
    setError('')
    setFeedback('')

    const { data, error } = await createTemplate(name, user.id)

    setSavingTemplate(false)

    if (error) {
      setError(error.message)
      return
    }

    setTemplates((prev) => [data, ...prev])
    setFeedback('Template created successfully.')
  }

  async function handleSaveTemplate(templateId, updates) {
    setSavingTemplate(true)
    setError('')
    setFeedback('')

    const { data, error } = await updateTemplate(templateId, updates)

    setSavingTemplate(false)

    if (error) {
      setError(error.message)
      return
    }

    setTemplates((prev) => prev.map((item) => (item.id === templateId ? data : item)))
    setFeedback('Template updated successfully.')
  }

  async function handleSignOut() {
    try {
      setError('')
      setFeedback('')

      await signOut()
      window.location.href = '/'
    } catch (err) {
      setError(err.message)
    }
  }

  const assignedOnlyCodes = codes.filter(
    (code) => code.assigned_to === user?.id && !code.activated
  )

  const activatedOpenCodes = codes.filter(
    (code) =>
      code.activated === true &&
      code.activated_by === user?.id &&
      code.code_type === 'open'
  )

  const activatedLockedCodes = codes.filter(
    (code) =>
      code.activated === true &&
      code.activated_by === user?.id &&
      code.code_type === 'locked'
  )

  function renderWelcomeGuide() {
    if (loading || role === 'admin') return null

    const hasCodes = codes.length > 0
    const showNewUserGuide = !hasCodes

    if (showNewUserGuide) {
      return (
        <div className="dashboard-guide-shell reveal-up">
          <div className="dashboard-guide-card tilt-card surface-card p-6">
            <div className="tilt-inner">
              <div className="eyebrow mb-3">Getting started</div>
              <h2 className="mb-4 text-2xl font-bold">Your first QR journey starts here</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="dashboard-mini-card float-card">
                  <div className="mb-2 text-lg font-semibold">1. Scan a QR</div>
                  <div className="text-sm leading-7 text-white/65">
                    Scan the QR code attached to the product, garment, or item.
                  </div>
                </div>

                <div className="dashboard-mini-card float-card">
                  <div className="mb-2 text-lg font-semibold">2. Activate with scratch code</div>
                  <div className="text-sm leading-7 text-white/65">
                    Use the scratch code from the tag to connect that item to your account.
                  </div>
                </div>

                <div className="dashboard-mini-card float-card">
                  <div className="mb-2 text-lg font-semibold">3. Open or locked</div>
                  <div className="text-sm leading-7 text-white/65">
                    Open codes can be edited by you. Locked codes open official template-based pages.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="mb-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr] reveal-up">
        <div className="dashboard-guide-card dashboard-guide-card-emerald tilt-card surface-card p-6">
          <div className="tilt-inner">
            <div className="eyebrow mb-3">Your code summary</div>
            <h2 className="mb-4 text-2xl font-bold">Understand what you can do next</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="dashboard-stat-chip float-card">
                <div className="mb-1 text-lg font-semibold">Pending activation</div>
                <div className="text-3xl font-bold text-[#5ECFCF]">{assignedOnlyCodes.length}</div>
                <div className="mt-2 text-sm leading-7 text-white/65">
                  These are assigned to you but still need the scratch code.
                </div>
              </div>

              <div className="dashboard-stat-chip float-card">
                <div className="mb-1 text-lg font-semibold">Open codes</div>
                <div className="text-3xl font-bold text-[#5ECFCF]">{activatedOpenCodes.length}</div>
                <div className="mt-2 text-sm leading-7 text-white/65">
                  These can be edited and personalized by you.
                </div>
              </div>

              <div className="dashboard-stat-chip float-card">
                <div className="mb-1 text-lg font-semibold">Locked codes</div>
                <div className="text-3xl font-bold text-[#5ECFCF]">{activatedLockedCodes.length}</div>
                <div className="mt-2 text-sm leading-7 text-white/65">
                  These open official content and are not editable here.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-guide-card tilt-card glass-card p-6">
          <div className="tilt-inner">
            <div className="eyebrow mb-3">Quick help</div>
            <h2 className="mb-4 text-2xl font-bold">What each code type means</h2>

            <div className="grid gap-4">
              <div className="dashboard-mini-card dashboard-mini-card-emerald float-card">
                <div className="mb-1 text-lg font-semibold">Open code</div>
                <div className="text-sm leading-7 text-white/65">
                  After activation, you can edit the public page, add blocks, links, images, and profile content.
                </div>
              </div>

              <div className="dashboard-mini-card dashboard-mini-card-cyan float-card">
                <div className="mb-1 text-lg font-semibold">Locked code</div>
                <div className="text-sm leading-7 text-white/65">
                  After activation, you can access the live official page, but its content stays controlled by admin templates.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderMainPanel() {
    if (loading) {
      return (
        <div className="surface-card p-8 tilt-card reveal-scale">
          <div className="tilt-inner">
            <h2 className="display text-3xl font-bold">Loading dashboard...</h2>
          </div>
        </div>
      )
    }

    if (activeTab === 'my-codes') {
      return (
        <div className="grid gap-6">
          {renderWelcomeGuide()}
          <div className="reveal-up">
            <DashboardStats codesCount={codes.length} scansCount={scanCount} />
          </div>
          <div className="reveal-up">
            <MyCodesPanel codes={codes} user={user} />
          </div>
        </div>
      )
    }

    if (activeTab === 'analytics') {
      return (
        <div className="reveal-up">
          <ScanAnalyticsPanel />
        </div>
      )
    }

    if (activeTab === 'account') {
      return (
        <div className="reveal-up">
          <AccountPanel
            profile={profile}
            user={user}
            onSave={handleSaveProfile}
            saving={savingProfile}
          />
        </div>
      )
    }

    if (activeTab === 'templates') {
      return (
        <div className="reveal-up">
          <TemplatesPanel
            templates={templates}
            onCreateTemplate={handleCreateTemplate}
            onSaveTemplate={handleSaveTemplate}
            saving={savingTemplate}
          />
        </div>
      )
    }

    if (activeTab === 'qr-codes') {
      return (
        <div className="reveal-up">
          <AdminQrCodesPanel
            qrCodes={allQrCodes}
            templates={templates}
            currentUserId={user.id}
            onCreated={(newQrs) => setAllQrCodes((prev) => [...newQrs, ...prev])}
            onUpdated={(updatedQr) =>
              setAllQrCodes((prev) =>
                prev.map((item) => (item.id === updatedQr.id ? updatedQr : item))
              )
            }
            onDeleted={(deletedId) =>
              setAllQrCodes((prev) => prev.filter((item) => item.id !== deletedId))
            }
            saving={savingQr}
            setSaving={setSavingQr}
            setFeedback={setFeedback}
            setError={setError}
          />
        </div>
      )
    }

    if (activeTab === 'users') {
      return (
        <div className="reveal-up">
          <UsersPanel
            users={users}
            qrCodes={allQrCodes}
            pendingAssignments={pendingAssignments}
            currentUserId={user.id}
            saving={savingUsers}
            setSaving={setSavingUsers}
            setFeedback={setFeedback}
            setError={setError}
            onUserUpdated={(updatedUser) =>
              setUsers((prev) =>
                prev.map((item) => (item.id === updatedUser.id ? updatedUser : item))
              )
            }
            onPendingCreated={(newPending) =>
              setPendingAssignments((prev) => [newPending, ...prev])
            }
            onPendingDeleted={(deletedId) =>
              setPendingAssignments((prev) => prev.filter((item) => item.id !== deletedId))
            }
          />
        </div>
      )
    }

    if (activeTab === 'journal') {
      return (
        <div className="reveal-up">
          <JournalPanel
            articles={articles}
            user={user}
            setArticles={setArticles}
            setError={setError}
            setFeedback={setFeedback}
          />
        </div>
      )
    }

    return (
      <div className="surface-card p-8 tilt-card reveal-scale">
        <div className="tilt-inner">
          <h2 className="display text-3xl font-bold">Panel not available</h2>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="app-shell dashboard-page min-h-screen bg-[#0A1F1F] text-white">
      <Navbar />

      <div className="page-noise" />
      <div className="dashboard-bg-grid" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="dashboard-bg-orb dashboard-bg-orb-1" />
      <div className="dashboard-bg-orb dashboard-bg-orb-2" />
      <div className="dashboard-bg-orb dashboard-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <div className="px-4 py-8">
        <div className="container">
          <div className="dashboard-shell">
            <div className="dashboard-hero-card surface-card tilt-card p-6 md:p-8 mb-6">
              <div className="tilt-inner dashboard-hero-copy">
                <div className="dashboard-card-glow" />
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="eyebrow mb-3">Dresscode dashboard</div>
                    <h1 className="section-title mb-2">
                      Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
                    </h1>
                    <p className="muted">
                      Manage your codes, profile, articles, templates, users, platform access, and scan analytics.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary magnetic-btn"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {feedback ? (
              <div className="dashboard-feedback dashboard-feedback-success mb-5 reveal-up">
                {feedback}
              </div>
            ) : null}

            {error ? (
              <div className="dashboard-feedback dashboard-feedback-error mb-5 reveal-up">
                {error}
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
              <div className="dashboard-sidebar-wrap reveal-scale">
                <div className="dashboard-sidebar-shell">
                  <DashboardSidebar
                    profile={profile}
                    activeTab={activeTab}
                    onChangeTab={setActiveTab}
                />
              </div>
            </div>


              <div className="dashboard-main-wrap">
                {renderMainPanel()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
