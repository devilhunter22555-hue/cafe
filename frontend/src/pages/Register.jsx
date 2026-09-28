import { Link } from 'react-router-dom'
import { ArrowLeft, Coffee, ExternalLink, MessageCircle, Phone } from 'lucide-react'

const WHATSAPP_NUMBER_DISPLAY = '+91 8619851911'
const WHATSAPP_MESSAGE =
  'Hello, I want to register for the Café Management System. Please help me create my account.'
const WHATSAPP_URL = `https://wa.me/918619851911?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

function Register() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5F2] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-white p-8 shadow-xl text-center">
        {/* Brand Header */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-md">
          <Coffee size={28} />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-[#2B2118]">
          Want to create an account?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#7A7068]">
          Please contact our café team on WhatsApp to register your account.
        </p>

        <div className="mt-6 rounded-2xl border border-[#EBE7DF] bg-[#F7F5F2] p-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#6F4E37] shadow-2xs">
              <Phone size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7A7068]">
                WhatsApp Onboarding Desk
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

        <div className="mt-6 border-t border-[#EBE7DF] pt-5">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6F4E37] hover:underline"
          >
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </main>
  )
}

export default Register
