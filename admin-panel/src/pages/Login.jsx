import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

function Login() {
  const navigate = useNavigate()
  const { login } = useAdminAuth()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    setSubmitError('')

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Platform</p>
            <h1 className="text-2xl font-bold text-secondary">Admin Console</h1>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary" htmlFor="email">Email</label>
            <input
              id="email"
              className="input-field"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address'
                }
              })}
            />
            {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-secondary" htmlFor="password">Password</label>
            <input
              id="password"
              className="input-field"
              type="password"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
          </div>

          {submitError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{submitError}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default Login
