import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1F1F] text-white">
        Loading auth session...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/portal" replace state={{ from: location }} />
  }

  return children
}