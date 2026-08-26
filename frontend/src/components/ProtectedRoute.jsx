import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute() {
  const { initializing, isAuthenticated } = useAuth()
  if (initializing) return <div className="flex min-h-screen items-center justify-center bg-orange-50 text-secondary">Loading your workspace...</div>
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
