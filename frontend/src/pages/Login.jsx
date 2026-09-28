import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Coffee,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const WHATSAPP_URL =
  'https://wa.me/918619851911?text=Hello%2C%20I%20want%20to%20register%20for%20the%20Caf%C3%A9%20Management%20System.%20Please%20help%20me%20create%20my%20account.'

function Login() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [inactiveNotice, setInactiveNotice] = useState('')

  useEffect(() => {
    try {
      const msg = sessionStorage.getItem('cafe_auth_notice')
      if (msg) {
        setInactiveNotice(msg)
        sessionStorage.removeItem('cafe_auth_notice')
      }
    } catch {
      // ignore
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async ({ email, password }) => {
    setInactiveNotice('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      /* Error is handled in AuthContext */
    }
  }

  const displayError = error || inactiveNotice

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#F7F5F2] via-[#EFECE6] to-[#E6DEC8]/45 px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#6F4E37]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#C89B6D]/15 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-3xl border border-[#EBE7DF] bg-white shadow-2xl lg:grid-cols-12">
        {/* Left Café Branding Column */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-[#2B2118] via-[#3A2B1F] to-[#6F4E37] p-10 text-white lg:col-span-5 lg:flex">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#E7C8A0] backdrop-blur-xs">
              <Sparkles size={13} />
              <span>Multi-Tenant Café POS</span>
            </div>
            <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-[#E7C8A0] shadow-inner">
              <Coffee size={30} />
            </div>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight">
              Crafted for Modern Cafés &amp; Bistros.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Fast table billing, live kitchen display, smart inventory, and isolated café workspaces in one unified portal.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-[#E7C8A0]">
              <ShieldCheck size={16} />
              <span>Verified Café Account Access</span>
            </div>
            <p className="text-xs leading-relaxed text-white/70">
              Sign in with your Café Admin or Staff credentials to access your café&apos;s workspace.
            </p>
          </div>
        </div>

        {/* Right Login Form Column */}
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:col-span-7">
          <div className="mb-7 text-center lg:text-left">
            <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-md lg:hidden">
              <Coffee size={26} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#6F4E37]">
              Welcome Back
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#2B2118] sm:text-3xl">
              Sign in to your Café
            </h1>
            <p className="mt-1 text-sm text-[#7A7068]">
              Enter your registered Café Admin or Staff email and password
            </p>
          </div>

          {displayError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-[#C75C5C]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A7068]">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7068]/70"
                  size={16}
                />
                <input
                  className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-3 pl-10 pr-3.5 text-sm text-[#2B2118] placeholder:text-[#7A7068]/50 transition-all focus:border-[#6F4E37] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                  type="email"
                  placeholder="admin@cafe.com"
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && (
                <span className="mt-1 block text-xs font-medium text-[#C75C5C]">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A7068]">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7068]/70"
                  size={16}
                />
                <input
                  className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-3 pl-10 pr-10 text-sm text-[#2B2118] placeholder:text-[#7A7068]/50 transition-all focus:border-[#6F4E37] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#7A7068] hover:bg-[#EBE7DF]/50 hover:text-[#2B2118]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className="mt-1 block text-xs font-medium text-[#C75C5C]">
                  {errors.password.message}
                </span>
              )}
            </div>

            <button
              className="mt-2 w-full rounded-xl bg-[#6F4E37] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#2B2118] active:scale-[0.99] disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-7 rounded-2xl border border-[#EBE7DF] bg-[#F7F5F2]/80 p-4 text-center">
            <p className="text-xs font-medium text-[#7A7068]">
              Don&apos;t have an account?
            </p>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[#6F4E37]/25 bg-white px-4 py-2 text-xs font-bold text-[#6F4E37] shadow-2xs transition-all hover:border-[#6F4E37] hover:bg-[#6F4E37] hover:text-white"
            >
              <MessageCircle size={14} />
              <span>Register / Contact Us</span>
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Registration / Contact Modal */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2118]/60 p-4 backdrop-blur-xs"
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-[#7A7068] transition-colors hover:bg-[#F7F5F2] hover:text-[#2B2118]"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#1DA851]">
              <MessageCircle size={28} />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-xl font-extrabold text-[#2B2118]">
                Want to create an account?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#7A7068]">
                Please contact our café team on WhatsApp to register your account.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-[#EBE7DF] bg-[#F7F5F2] p-4 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7068]">
                Official Registration Support
              </span>
              <p className="mt-1 flex items-center justify-center gap-2 text-base font-extrabold text-[#2B2118]">
                <Phone size={15} className="text-[#6F4E37]" />
                <span>+91 8619851911</span>
              </p>
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#25D366]/25 transition-all hover:bg-[#1EBE5D] active:scale-[0.99]"
            >
              <MessageCircle size={18} />
              <span>Contact us on WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </main>
  )
}

export default Login
