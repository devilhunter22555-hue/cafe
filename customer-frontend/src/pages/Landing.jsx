import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'

function Landing() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const requestOtp = async ({ phone }) => {
    setLoading(true)
    setError('')
    try {
      await axiosInstance.post('/customer/request-otp', { qrToken, phone })
      navigate(`/t/${qrToken}/verify`, { state: { phone } })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send OTP. Please check the QR code and try again.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="mx-auto mt-20 max-w-sm rounded-2xl bg-white p-6 shadow-lg">
    <h1 className="text-2xl font-bold text-secondary">Welcome!</h1>
    <p className="mb-6 mt-2 text-sm text-gray-500">Enter your phone number to start ordering</p>
    <form onSubmit={handleSubmit(requestOtp)}>
      <input className="w-full rounded-lg border px-4 py-3" inputMode="numeric" placeholder="10-digit phone number" {...register('phone', { required: 'Phone number is required', pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit phone number' } })} />
      {errors.phone && <p className="mt-2 text-sm text-danger">{errors.phone.message}</p>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <button className="mt-4 w-full rounded-lg bg-primary py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Sending OTP...' : 'Send OTP'}</button>
    </form>
  </main>
}

export default Landing
