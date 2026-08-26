import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'
import { useCustomer } from '../context/CustomerContext.jsx'

function VerifyOtp() {
  const { qrToken } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { setSession } = useCustomer()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const phone = state?.phone

  const verifyOtp = async ({ otp }) => {
    if (!phone) { setError('Your phone number is missing. Please start again.'); return }
    setLoading(true)
    setError('')
    try {
      const response = await axiosInstance.post('/customer/verify-otp', { qrToken, phone, otp })
      const { token, customer, table } = response.data.data
      setSession(token, customer, table)
      navigate(`/t/${qrToken}/menu`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The OTP is incorrect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    if (!phone) { setError('Your phone number is missing. Please start again.'); return }
    setLoading(true)
    setError('')
    try {
      await axiosInstance.post('/customer/request-otp', { qrToken, phone })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="mx-auto mt-20 max-w-sm rounded-2xl bg-white p-6 shadow-lg">
    <h1 className="text-2xl font-bold text-secondary">Verify OTP</h1>
    <p className="mb-6 mt-2 text-sm text-gray-500">Enter the 4-digit code sent to {phone || 'your phone'}.</p>
    <form onSubmit={handleSubmit(verifyOtp)}>
      <input className="w-full rounded-lg border px-4 py-3 text-center text-2xl tracking-widest" inputMode="numeric" maxLength="4" placeholder="0000" {...register('otp', { required: 'OTP is required', pattern: { value: /^\d{4}$/, message: 'Enter the 4-digit OTP' } })} />
      {errors.otp && <p className="mt-2 text-sm text-danger">{errors.otp.message}</p>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <button className="mt-4 w-full rounded-lg bg-primary py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Verifying...' : 'Verify'}</button>
    </form>
    <button className="mt-4 text-sm font-medium text-primary underline disabled:opacity-60" disabled={loading} onClick={resendOtp} type="button">Resend OTP</button>
  </main>
}

export default VerifyOtp
