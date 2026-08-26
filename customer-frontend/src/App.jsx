import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import VerifyOtp from './pages/VerifyOtp.jsx'

function MenuPlaceholder() {
  return <main className="flex min-h-screen items-center justify-center"><p className="text-xl font-semibold text-secondary">Menu coming soon</p></main>
}

function App() {
  return <Routes>
    <Route path="/t/:qrToken" element={<Landing />} />
    <Route path="/t/:qrToken/verify" element={<VerifyOtp />} />
    <Route path="/t/:qrToken/menu" element={<MenuPlaceholder />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

export default App
