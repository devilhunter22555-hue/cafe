import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CafeManagement from './pages/CafeManagement.jsx'
import AdminsManagement from './pages/AdminsManagement.jsx'
import Reports from './pages/Reports.jsx'
import RestaurantDetails from './pages/RestaurantDetails.jsx'
import SubscriptionPlans from './pages/SubscriptionPlans.jsx'
import Settings from './pages/Settings.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/cafes" element={<CafeManagement />} />
          <Route path="/dashboard/cafes/:id" element={<RestaurantDetails />} />
          <Route path="/dashboard/restaurants/:id" element={<RestaurantDetails />} />
          <Route path="/dashboard/admins" element={<AdminsManagement />} />
          <Route path="/dashboard/reports" element={<Reports />} />
          <Route path="/dashboard/plans" element={<SubscriptionPlans />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
