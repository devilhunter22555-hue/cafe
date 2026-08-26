import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Register() {
  const { register: registerAccount, loading, error } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (formData) => {
    try {
      await registerAccount(formData)
      navigate('/dashboard')
    } catch { /* Error is displayed from context. */ }
  }

  return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
    <section className="card w-full max-w-md p-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-secondary">Create Restaurant Account</h1>
      {error && <p className="mb-4 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm font-medium text-secondary">Restaurant name
          <input className="input-field mt-1" {...register('restaurantName', { required: 'Restaurant name is required' })} />
          {errors.restaurantName && <span className="text-sm text-danger">{errors.restaurantName.message}</span>}
        </label>
        <label className="block text-sm font-medium text-secondary">Owner name
          <input className="input-field mt-1" {...register('ownerName', { required: 'Owner name is required' })} />
          {errors.ownerName && <span className="text-sm text-danger">{errors.ownerName.message}</span>}
        </label>
        <label className="block text-sm font-medium text-secondary">Email
          <input className="input-field mt-1" type="email" {...register('email', { required: 'Email is required' })} />
          {errors.email && <span className="text-sm text-danger">{errors.email.message}</span>}
        </label>
        <label className="block text-sm font-medium text-secondary">Password
          <input className="input-field mt-1" type="password" {...register('password', { required: 'Password is required' })} />
          {errors.password && <span className="text-sm text-danger">{errors.password.message}</span>}
        </label>
        <button className="btn-primary mt-4 w-full" disabled={loading} type="submit">{loading ? 'Creating account...' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link className="font-medium text-primary hover:underline" to="/login">Login</Link></p>
    </section>
  </main>
}

export default Register