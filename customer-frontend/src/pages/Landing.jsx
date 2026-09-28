import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  Coffee,
  ExternalLink,
  MessageCircle,
  Phone,
  Sparkles,
  X
} from 'lucide-react'
import axiosInstance from '../api/axiosInstance.js'

const WHATSAPP_NUMBER_DISPLAY = '+91 8619851911'
const WHATSAPP_MESSAGE =
  'Hello, I want to register for the Café Management System. Please help me create my account.'
const WHATSAPP_URL = `https://wa.me/918619851911?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

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
  const [showRegisterModal, setShowRegisterModal] = useState(false)

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

        <div className="mt-6 border-t border-[#EBE7DF] pt-5 text-center space-y-2.5">
          <p className="text-xs font-medium text-[#7A7068]">
            Don&apos;t have an account?
          </p>
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#6F4E37]/25 bg-[#F7F5F2] px-4 py-2.5 text-xs font-bold text-[#6F4E37] transition-all hover:bg-[#6F4E37] hover:text-white"
          >
            <MessageCircle size={14} />
            <span>Register / Contact Us</span>
          </button>
        </div>
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2118]/55 p-4 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setShowRegisterModal(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#1DA851]">
                <MessageCircle size={24} />
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="rounded-xl p-2 text-[#7A7068] transition-colors hover:bg-[#F7F5F2] hover:text-[#2B2118]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4">
              <h2 className="text-xl font-black tracking-tight text-[#2B2118]">
                Want to create an account?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#7A7068]">
                Please contact our café team on WhatsApp to register your account.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-[#EBE7DF] bg-[#F7F5F2] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#6F4E37] shadow-2xs">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7A7068]">
                    Official WhatsApp Support
                  </span>
                  <span className="text-sm font-extrabold text-[#2B2118]">
                    {WHATSAPP_NUMBER_DISPLAY}
                  </span>
                </div>
              </div>
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[#1DA851] active:scale-[0.98]"
            >
              <MessageCircle size={18} />
              <span>Contact us on WhatsApp</span>
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      )}
    </main>
  )
}

export default Landing
