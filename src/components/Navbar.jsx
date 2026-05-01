import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/how-it-works', label: 'How it Works' },
  { to: '/use-cases', label: 'Use Cases' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/shop', label: 'Shop' },
  { to: '/journal', label: 'Journal' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const mobileMenuVariants = {
  hidden: {
    opacity: 0,
    y: -8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, signOut } = useAuth()

  const [open, setOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [navHidden, setNavHidden] = useState(false)

  const headerRef = useRef(null)
  const mobilePanelRef = useRef(null)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const updateNavbar = () => {
      const currentY = window.scrollY

      setIsScrolled(currentY > 14)

      if (!open) {
        if (currentY > lastScrollY.current && currentY > 120) {
          setNavHidden(true)
        } else {
          setNavHidden(false)
        }
      }

      lastScrollY.current = currentY
      ticking.current = false
    }

    const handleScroll = () => {
      if (ticking.current) return

      ticking.current = true
      window.requestAnimationFrame(updateNavbar)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateNavbar()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [open])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!open) return
      if (!mobilePanelRef.current) return
      if (!headerRef.current) return

      const clickedInsideHeader = headerRef.current.contains(event.target)
      if (!clickedInsideHeader) setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <header
      ref={headerRef}
      className={[
        'site-navbar',
        isScrolled ? 'site-navbar-scrolled' : '',
        navHidden ? 'site-navbar-hidden' : '',
        open ? 'site-navbar-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="navbar-top-glow" />
      <div className="container">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand shrink-0">
            <div className="navbar-brand-mark">
              <span className="display navbar-brand-letter">D</span>
              <span className="navbar-brand-pulse" />
            </div>

            <div className="min-w-0">
              <div className="display navbar-brand-title truncate">Dresscode</div>
              <div className="navbar-brand-subtitle truncate">wearable media</div>
            </div>
          </Link>

          <nav className="navbar-links hidden min-w-0 flex-1 items-center justify-center lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `navbar-link whitespace-nowrap ${isActive ? 'navbar-link-active' : ''}`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="navbar-actions hidden shrink-0 items-center lg:flex">
            {!loading && !user ? (
              <>
                <Link to="/portal" className="btn btn-secondary navbar-btn whitespace-nowrap">
                  Sign In
                </Link>
                <Link
                  to="/portal"
                  className="btn btn-primary glow-btn navbar-btn whitespace-nowrap"
                >
                  Get Started
                </Link>
              </>
            ) : null}

            {!loading && user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary navbar-btn whitespace-nowrap"
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn btn-ghost navbar-btn whitespace-nowrap"
                >
                  Home
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn-primary glow-btn navbar-btn whitespace-nowrap"
                >
                  Sign Out
                </button>
              </>
            ) : null}
          </div>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className={`navbar-toggle shrink-0 lg:hidden ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="navbar-toggle-line" />
            <span className="navbar-toggle-line" />
            <span className="navbar-toggle-line" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            ref={mobilePanelRef}
            className="navbar-mobile lg:hidden"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="container">
              <div className="navbar-mobile-panel">
                <div className="navbar-mobile-grid">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `navbar-mobile-link ${isActive ? 'navbar-mobile-link-active' : ''}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>

                <div className="navbar-mobile-actions">
                  {!loading && !user ? (
                    <>
                      <Link
                        to="/portal"
                        onClick={() => setOpen(false)}
                        className="btn btn-secondary"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/portal"
                        onClick={() => setOpen(false)}
                        className="btn btn-primary glow-btn"
                      >
                        Get Started
                      </Link>
                    </>
                  ) : null}

                  {!loading && user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false)
                          navigate('/dashboard')
                        }}
                        className="btn btn-secondary"
                      >
                        Dashboard
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false)
                          navigate('/')
                        }}
                        className="btn btn-ghost"
                      >
                        Home
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setOpen(false)
                          await handleSignOut()
                        }}
                        className="btn btn-primary glow-btn"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
