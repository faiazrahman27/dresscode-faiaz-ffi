import { Routes, Route, useLocation } from 'react-router-dom'
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

export default function App() {
  const location = useLocation()

  const isStandalone = STANDALONE_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix)
  )

  return (
    <>
      {!isStandalone && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/about" element={<About />} />
        <Route path="/why-it-matters" element={<WhyItMatters />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/portal" element={<Portal />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:code"
          element={
            <ProtectedRoute>
              <PageEditor />
            </ProtectedRoute>
          }
        />
        <Route path="/activate/:code" element={<Activate />} />
        <Route path="/p/:code" element={<Profile />} />
        <Route path="/p/:code/html" element={<HtmlViewer />} />
      </Routes>

      {!isStandalone && <Footer />}
    </>
  )
}
