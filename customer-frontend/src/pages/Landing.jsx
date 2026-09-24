import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Coffee, Phone, Sparkles, UtensilsCrossed } from 'lucide-react'
import axiosInstance from '../api/axiosInstance.js'

function Landing() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const requestOtp = async ({ phone }) => {
    setLoading(true)
    setError('')
    try {
      await axiosInstance.post('/customer/request-otp', { qrToken, phone })
      navigate(`/t/${qrToken}/verify`, { state: { phone } })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to verify table session. Please scan your table QR code again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F2] px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-[#EBE7DF] bg-white p-7 shadow-xl">
        {/* Brand Header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-md">
            <Coffee size={28} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6F4E37]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6F4E37] mb-2">
            <Sparkles size={12} />
            Digital Table Ordering
          </span>
          <h1 className="text-2xl font-black tracking-tight text-[#2B2118]">
            Welcome to Our Café
          </h1>
          <p className="mt-1 text-xs text-[#7A7068]">
            Browse our artisan menu, customize your order, and send straight to our kitchen
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-[#C75C5C]">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(requestOtp)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
              Your Mobile Number
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A7068]">
                +91
              </span>
              <input
                className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-3 pl-12 pr-4 text-base font-medium tracking-wide text-[#2B2118] placeholder:text-[#7A7068]/50 focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                {...register('phone', {
                  required: 'Mobile number is required to receive order updates',
                  pattern: {
                    value: /^\d{10}$/,
                    message: 'Please enter a valid 10-digit mobile number'
                  }
                })}
              />
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-xs text-[#C75C5C]">{errors.phone.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#6F4E37] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#2B2118] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'Sending One-Time Passcode...' : 'Start Dining Order'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          Fast self-ordering directly from your table • No app install required
        </p>
      </div>
    </main>
  )
}

export default Landing
