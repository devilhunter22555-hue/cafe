import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Coffee, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

function Login() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async ({ email, password }) => {
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      /* Error is handled in AuthContext */
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5F2] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-white p-8 shadow-xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-md">
            <Coffee size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#2B2118]">
            Café POS &amp; Bistro
          </h1>
          <p className="mt-1 text-sm text-[#7A7068]">
            Sign in to access your staff &amp; management workspace
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-[#C75C5C]">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-2.5 pl-10 pr-3.5 text-sm text-[#2B2118] placeholder:text-[#7A7068]/50 focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                type="email"
                placeholder="staff@cafe.com"
                {...register('email', { required: 'Email is required' })}
              />
            </div>
            {errors.email && (
              <span className="mt-1 block text-xs text-[#C75C5C]">{errors.email.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-2.5 pl-10 pr-3.5 text-sm text-[#2B2118] placeholder:text-[#7A7068]/50 focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
            </div>
            {errors.password && (
              <span className="mt-1 block text-xs text-[#C75C5C]">{errors.password.message}</span>
            )}
          </div>

          <button
            className="mt-6 w-full rounded-xl bg-[#6F4E37] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#2B2118] transition-all active:scale-[0.98] disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Authenticating...' : 'Sign In to POS'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[#7A7068]">
          Need to register a new café?{' '}
          <Link className="font-bold text-[#6F4E37] hover:underline" to="/register">
            Register Restaurant
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Login
