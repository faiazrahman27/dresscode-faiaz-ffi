import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/how-it-works', label: 'How it Works' },
  { to: '/use-cases', label: 'Use Cases' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/journal', label: 'Journal' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const mobileMenuVariants = {
  hidden: {
    opacity: 0,
    y: -14,
    height: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1],
      when: 'afterChildren',
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

const mobileItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
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

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      setIsScrolled(currentY > 14)

      if (open) {
        lastScrollY.current = currentY
        return
      }

      if (currentY > lastScrollY.current && currentY > 120) {
        setNavHidden(true)
      } else {
        setNavHidden(false)
      }

      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.navbar-entrance',
        { opacity: 0, y: -18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power3.out',
          clearProps: 'all',
        }
      )
    }, headerRef)

    return () => ctx.revert()
  }, [])

  return (
    <header
      ref={headerRef}
      className={[
        'site-navbar',
        'navbar-entrance',
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
          <Link to="/" className="navbar-brand">
            <div className="navbar-brand-mark">
              <span className="display navbar-brand-letter">D</span>
              <span className="navbar-brand-pulse" />
            </div>

            <div>
              <div className="display navbar-brand-title">Dresscode</div>
              <div className="navbar-brand-subtitle">wearable media</div>
            </div>
          </Link>

          <nav className="navbar-links hidden lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'navbar-link-active' : ''}`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="navbar-actions hidden lg:flex">
            {!loading && !user ? (
              <>
                <Link to="/portal" className="btn btn-secondary navbar-btn">
                  Sign In
                </Link>
                <Link to="/portal" className="btn btn-primary glow-btn navbar-btn">
                  Get Started
                </Link>
              </>
            ) : null}

            {!loading && user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary navbar-btn"
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn btn-ghost navbar-btn"
                >
                  Home
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn-primary glow-btn navbar-btn"
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
            className={`navbar-toggle lg:hidden ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="navbar-toggle-line" />
            <span className="navbar-toggle-line" />
            <span className="navbar-toggle-line" />
          </button>
        </div>
      </div>

      <AnimatePresence>
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
                    <motion.div
                      key={item.to}
                      variants={mobileItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <NavLink
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `navbar-mobile-link ${isActive ? 'navbar-mobile-link-active' : ''}`
                        }
                      >
                        {item.label}
                      </NavLink>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="navbar-mobile-actions"
                  variants={mobileItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
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
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
