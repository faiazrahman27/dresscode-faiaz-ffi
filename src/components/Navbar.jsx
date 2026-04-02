import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/how-it-works', label: 'How it Works' },
  { to: '/use-cases', label: 'Use Cases' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/journal', label: 'Journal' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { user, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(94,207,207,0.08)] bg-[rgba(8,24,24,0.78)] backdrop-blur-xl">
      <div className="container flex min-h-[78px] items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(94,207,207,0.18)] bg-[rgba(255,255,255,0.03)]">
            <span className="display text-lg font-bold text-[#5ECFCF]">D</span>
          </div>
          <div>
            <div className="display text-lg font-bold tracking-tight">Dresscode</div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              wearable media
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive ? 'text-[#5ECFCF]' : 'text-white/72 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {!loading && !user ? (
            <>
              <Link to="/portal" className="btn btn-secondary">
                Sign In
              </Link>
              <Link to="/portal" className="btn btn-primary">
                Get Started
              </Link>
            </>
          ) : null}

          {!loading && user ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
              >
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn btn-ghost"
              >
                Home
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn-primary"
              >
                Sign Out
              </button>
            </>
          ) : null}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(94,207,207,0.18)] bg-[rgba(255,255,255,0.03)] lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-xl">{open ? '×' : '☰'}</span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-[rgba(94,207,207,0.08)] lg:hidden">
          <div className="container flex flex-col gap-4 py-5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-white/78"
              >
                {item.label}
              </NavLink>
            ))}

            <div className="mt-3 flex flex-col gap-3">
              {!loading && !user ? (
                <>
                  <Link to="/portal" onClick={() => setOpen(false)} className="btn btn-secondary">
                    Sign In
                  </Link>
                  <Link to="/portal" onClick={() => setOpen(false)} className="btn btn-primary">
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
                    className="btn btn-primary"
                  >
                    Sign Out
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
