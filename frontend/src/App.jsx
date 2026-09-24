import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppLayout from './components/AppLayout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MenuManagement from './pages/MenuManagement.jsx'
import TableManagement from './pages/TableManagement.jsx'
import POS from './pages/POS.jsx'
import KitchenDisplay from './pages/KitchenDisplay.jsx'
import Billing from './pages/Billing.jsx'
import BillHistory from './pages/BillHistory.jsx'
import Analytics from './pages/Analytics.jsx'
import Inventory from './pages/Inventory.jsx'
import StaffManagement from './pages/StaffManagement.jsx'
import Suppliers from './pages/Suppliers.jsx'
import PurchaseOrders from './pages/PurchaseOrders.jsx'
import Insights from './pages/Insights.jsx'
import Customers from './pages/Customers.jsx'
import Coupons from './pages/Coupons.jsx'
import SalaryManagement from './pages/SalaryManagement.jsx'
import MySalary from './pages/MySalary.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        {/* Layout Route with persistent left sidebar + top navbar */}
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="tables" element={<TableManagement />} />
          <Route path="pos" element={<POS />} />
          <Route path="kitchen" element={<KitchenDisplay />} />
          <Route path="billing" element={<Billing />} />
          <Route path="bills" element={<BillHistory />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="insights" element={<Insights />} />
          <Route path="customers" element={<Customers />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="salary" element={<SalaryManagement />} />
          <Route path="my-salary" element={<MySalary />} />
        </Route>
        {/* Redirect root and legacy flat paths into /dashboard */}
        <Route path="/menu" element={<Navigate to="/dashboard/menu" replace />} />
        <Route path="/tables" element={<Navigate to="/dashboard/tables" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
