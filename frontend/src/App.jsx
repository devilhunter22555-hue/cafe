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
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/menu" element={<MenuManagement />} />
          <Route path="/dashboard/tables" element={<TableManagement />} />
          <Route path="/dashboard/pos" element={<POS />} />
          <Route path="/dashboard/kitchen" element={<KitchenDisplay />} />
          <Route path="/dashboard/billing" element={<Billing />} />
          <Route path="/dashboard/bills" element={<BillHistory />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/inventory" element={<Inventory />} />
          <Route path="/dashboard/staff" element={<StaffManagement />} />
          <Route path="/dashboard/suppliers" element={<Suppliers />} />
          <Route path="/dashboard/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/dashboard/insights" element={<Insights />} />
          <Route path="/dashboard/customers" element={<Customers />} />
          <Route path="/dashboard/coupons" element={<Coupons />} />
          <Route path="/dashboard/salary" element={<SalaryManagement />} />
          <Route path="/dashboard/my-salary" element={<MySalary />} />
          <Route path="/menu" element={<Navigate to="/dashboard/menu" replace />} />
          <Route path="/tables" element={<Navigate to="/dashboard/tables" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
