import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MenuManagement from './pages/MenuManagement.jsx'
import TableManagement from './pages/TableManagement.jsx'
import POS from './pages/POS.jsx'
import KitchenDisplay from './pages/KitchenDisplay.jsx'
import Billing from './pages/Billing.jsx'

function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/menu" element={<MenuManagement />} />
      <Route path="/dashboard/tables" element={<TableManagement />} />
      <Route path="/dashboard/pos" element={<POS />} />
      <Route path="/dashboard/kitchen" element={<KitchenDisplay />} />
      <Route path="/dashboard/billing" element={<Billing />} />
      <Route path="/menu" element={<MenuManagement />} />
      <Route path="/tables" element={<TableManagement />} />
      <Route path="/" element={<Dashboard />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

export default App
