import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

import Home from './pages/Home'
import Portal from './pages/Portal'
import Dashboard from './pages/Dashboard'
import Activate from './pages/Activate'
import Profile from './pages/Profile'
import HtmlViewer from './pages/HtmlViewer'
import About from './pages/About'
import Contact from './pages/Contact'
import Journal from './pages/Journal'
import HowItWorks from './pages/HowItWorks'
import Solutions from './pages/Solutions'
import UseCases from './pages/UseCases'
import WhyItMatters from './pages/WhyItMatters'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import PageEditor from './pages/PageEditor'

const STANDALONE_PREFIXES = ['/portal', '/dashboard', '/activate/', '/p/', '/editor/']

const pageTransition = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
}

function ScrollToTopOnRouteChange() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return null
}

function RouteShell({ children, standalone = false }) {
  return (
    <motion.main
      className={standalone ? 'route-shell route-shell-standalone' : 'route-shell'}
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="route-shell-fx">{children}</div>
    </motion.main>
  )
}

export default function App() {
  const location = useLocation()

  const isStandalone = STANDALONE_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix)
  )

  return (
    <div className={isStandalone ? 'site-root standalone-root' : 'site-root'}>
      <ScrollToTopOnRouteChange />

      {!isStandalone && <Navbar />}

      <AnimatePresence initial={false} mode="sync">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <RouteShell>
                <Home />
              </RouteShell>
            }
          />
          <Route
            path="/how-it-works"
            element={
              <RouteShell>
                <HowItWorks />
              </RouteShell>
            }
          />
          <Route
            path="/use-cases"
            element={
              <RouteShell>
                <UseCases />
              </RouteShell>
            }
          />
          <Route
            path="/solutions"
            element={
              <RouteShell>
                <Solutions />
              </RouteShell>
            }
          />
          <Route
            path="/about"
            element={
              <RouteShell>
                <About />
              </RouteShell>
            }
          />
          <Route
            path="/why-it-matters"
            element={
              <RouteShell>
                <WhyItMatters />
              </RouteShell>
            }
          />
          <Route
            path="/journal"
            element={
              <RouteShell>
                <Journal />
              </RouteShell>
            }
          />
          <Route
            path="/contact"
            element={
              <RouteShell>
                <Contact />
              </RouteShell>
            }
          />
          <Route
            path="/portal"
            element={
              <RouteShell standalone>
                <Portal />
              </RouteShell>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RouteShell standalone>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </RouteShell>
            }
          />
          <Route
            path="/editor/:code"
            element={
              <RouteShell standalone>
                <ProtectedRoute>
                  <PageEditor />
                </ProtectedRoute>
              </RouteShell>
            }
          />
          <Route
            path="/activate/:code"
            element={
              <RouteShell standalone>
                <Activate />
              </RouteShell>
            }
          />
          <Route
            path="/p/:code"
            element={
              <RouteShell standalone>
                <Profile />
              </RouteShell>
            }
          />
          <Route
            path="/p/:code/html"
            element={
              <RouteShell standalone>
                <HtmlViewer />
              </RouteShell>
            }
          />
        </Routes>
      </AnimatePresence>

      {!isStandalone && <Footer />}
    </div>
  )
}