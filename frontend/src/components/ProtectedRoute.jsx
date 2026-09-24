import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute() {
  const { initializing, isAuthenticated } = useAuth()
  if (initializing) return <div className="flex min-h-screen items-center justify-center bg-[#F7F5F2] text-[#2B2118] font-medium text-sm">Loading your café workspace...</div>
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
