import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Coffee, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

function Login() {
  const navigate = useNavigate()
  const { login } = useAdminAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    setSubmitError('')

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          'Unable to sign in. Please verify your credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5F2] px-4 py-12 text-[#241B15]">
      <div className="w-full max-w-md rounded-2xl border border-[#E8E1DA] bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-sm">
            <Coffee size={26} />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#6F4E37]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#6F4E37]">
            <ShieldCheck size={12} />
            <span>Admin Console</span>
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#241B15]">
            Café Management
          </h1>
          <p className="mt-1 text-xs text-[#81766D]">
            Sign in to manage café tenants, licenses, and subscription tiers
          </p>
        </div>

        {submitError && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#C75C5C]/30 bg-[#C75C5C]/10 p-3.5 text-xs font-medium text-[#C75C5C]">
            <AlertCircle size={16} className="shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider text-[#81766D]"
              htmlFor="email"
            >
              Admin Email
            </label>
            <div className="relative mt-1.5">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                size={16}
              />
              <input
                id="email"
                className="input-field pl-10"
                type="email"
                placeholder="admin@platform.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
            </div>
            {errors.email && (
              <span className="mt-1 block text-xs font-medium text-[#C75C5C]">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider text-[#81766D]"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                size={16}
              />
              <input
                id="password"
                className="input-field pl-10"
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
            </div>
            {errors.password && (
              <span className="mt-1 block text-xs font-medium text-[#C75C5C]">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary mt-6 w-full py-3"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Admin Console'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default Login
