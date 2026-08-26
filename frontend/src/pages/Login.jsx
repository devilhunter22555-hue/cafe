import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext.jsx'

function Login() {
  const { login, loading, error } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const onSubmit = async ({ email, password }) => { try { await login(email, password) } catch { /* Error is displayed from context. */ } }

  return <main className="flex min-h-screen items-center justify-center bg-orange-50 px-4 py-10">
    <section className="card w-full max-w-md border-t-4 border-primary">
      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Cafe operations</p>
      <h1 className="mb-2 text-3xl font-bold text-secondary">Staff sign in</h1>
      <p className="mb-8 text-slate-500">Access your restaurant workspace.</p>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm font-medium text-secondary">Email<input className="input-field mt-1" type="email" {...register('email', { required: 'Email is required' })} />{errors.email && <span className="mt-1 block text-sm text-danger">{errors.email.message}</span>}</label>
        <label className="block text-sm font-medium text-secondary">Password<input className="input-field mt-1" type="password" {...register('password', { required: 'Password is required' })} />{errors.password && <span className="mt-1 block text-sm text-danger">{errors.password.message}</span>}</label>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</p>}
        <button className="btn-primary w-full font-semibold" disabled={loading} type="submit">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </section>
  </main>
}

export default Login
