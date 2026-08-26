import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import VerifyOtp from './pages/VerifyOtp.jsx'
import Menu from './pages/Menu.jsx'
import OrderStatus from './pages/OrderStatus.jsx'

function App() {
  return <Routes>
    <Route path="/t/:qrToken" element={<Landing />} />
    <Route path="/t/:qrToken/verify" element={<VerifyOtp />} />
    <Route path="/t/:qrToken/menu" element={<Menu />} />
    <Route path="/t/:qrToken/order-status" element={<OrderStatus />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

export default App
