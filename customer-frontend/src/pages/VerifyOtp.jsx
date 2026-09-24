import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'
import axiosInstance from '../api/axiosInstance.js'
import { useCustomer } from '../context/CustomerContext.jsx'

function VerifyOtp() {
  const { qrToken } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { setSession } = useCustomer()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const phone = state?.phone

  const verifyOtp = async ({ otp }) => {
    if (!phone) {
      setError('Session timed out. Please scan the table QR code again.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await axiosInstance.post('/customer/verify-otp', { qrToken, phone, otp })
      const { token, customer, table } = response.data.data
      setSession(token, customer, table)
      navigate(`/t/${qrToken}/menu`)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Incorrect verification code. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    if (!phone) {
      setError('Phone number is missing. Please start again.')
      return
    }
    setLoading(true)
    setError('')
    setNotice('')
    try {
      await axiosInstance.post('/customer/request-otp', { qrToken, phone })
      setNotice('A new verification code has been dispatched to your mobile.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to resend OTP at this moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F2] px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-[#EBE7DF] bg-white p-7 shadow-xl">
        <button
          type="button"
          onClick={() => navigate(`/t/${qrToken}`)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A7068] hover:text-[#2B2118]"
        >
          <ArrowLeft size={14} />
          <span>Change Number</span>
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6F4E37]/10 text-[#6F4E37]">
            <KeyRound size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#2B2118]">
            Verify Your Passcode
          </h1>
          <p className="mt-1 text-xs text-[#7A7068]">
            Enter the 4-digit code sent to{' '}
            <strong className="text-[#2B2118]">+91 {phone || 'your phone'}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-[#C75C5C]">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit(verifyOtp)} className="space-y-4">
          <div>
            <input
              className="w-full rounded-2xl border border-[#EBE7DF] bg-[#F7F5F2] py-3 text-center font-mono text-2xl font-black tracking-[0.5em] text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              {...register('otp', {
                required: 'Please enter the 4-digit code',
                pattern: { value: /^\d{4}$/, message: 'Must be exactly 4 digits' }
              })}
            />
            {errors.otp && (
              <p className="mt-1 text-center text-xs text-[#C75C5C]">{errors.otp.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#6F4E37] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#2B2118] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Confirm & Open Menu'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={resendOtp}
            className="text-xs font-semibold text-[#6F4E37] hover:underline disabled:opacity-50"
          >
            Didn't receive code? Resend OTP
          </button>
        </div>
      </div>
    </main>
  )
}

export default VerifyOtp
