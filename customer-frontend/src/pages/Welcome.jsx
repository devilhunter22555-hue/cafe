import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Coffee,
  ExternalLink,
  MessageCircle,
  Phone,
  QrCode,
  Sparkles,
  X
} from 'lucide-react'
import { useCustomer } from '../context/CustomerContext.jsx'

const WHATSAPP_NUMBER_DISPLAY = '+91 8619851911'
const WHATSAPP_MESSAGE =
  'Hello, I want to register for the Café Management System. Please help me create my account.'
const WHATSAPP_URL = `https://wa.me/918619851911?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

function Welcome() {
  const navigate = useNavigate()
  const { isVerified, table } = useCustomer()
  const [tokenInput, setTokenInput] = useState('')
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  const handleManualEnter = (e) => {
    e.preventDefault()
    if (tokenInput.trim()) {
      navigate(`/t/${tokenInput.trim()}`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F2] px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-[#EBE7DF] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-md">
          <Coffee size={32} />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6F4E37]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6F4E37] mb-2">
          <Sparkles size={12} />
          Digital Dining Portal
        </span>

        <h1 className="text-2xl font-black tracking-tight text-[#2B2118]">
          Café Table Self-Ordering
        </h1>

        <p className="mt-2 text-xs text-[#7A7068]">
          Scan the QR code on your dining table to explore our menu, customize your order, and send items straight to the kitchen.
        </p>

        {isVerified && table && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Active Dining Session
            </span>
            <p className="font-bold text-sm text-[#2B2118] mt-0.5">
              Table {table.tableNumber}
            </p>
            <button
              type="button"
              onClick={() => navigate('/t/current/menu')}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6F4E37] py-2 text-xs font-bold text-white shadow-xs"
            >
              <span>Return to Table Menu</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-[#F7F5F2] pt-5">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#7A7068] mb-3">
            <QrCode size={16} className="text-[#6F4E37]" />
            <span>Have a table QR token?</span>
          </div>

          <form onSubmit={handleManualEnter} className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. table-1 token"
              className="flex-1 rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2 text-xs text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#6F4E37] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#2B2118]"
            >
              Open
            </button>
          </form>
        </div>

        <div className="mt-6 border-t border-[#EBE7DF] pt-5 space-y-2.5">
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

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-white p-7 shadow-2xl text-left">
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

export default Welcome
