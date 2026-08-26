import { LogOut, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

function Dashboard() {
  const { user, role, logout } = useAuth()
  return <main className="min-h-screen bg-slate-100">
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"><div className="flex items-center gap-3"><Store className="text-primary" /><span className="font-bold text-secondary">Cafe workspace</span></div><button className="btn-secondary flex items-center gap-2" onClick={logout} type="button"><LogOut size={16} /> Sign out</button></header>
    <section className="mx-auto max-w-6xl px-6 py-12"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Overview</p><h1 className="mt-2 text-4xl font-bold text-secondary">Good to see you, {user?.name || 'there'}.</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="card"><p className="text-sm text-slate-500">Your role</p><p className="mt-2 text-2xl font-bold capitalize text-secondary">{role}</p></div><div className="card"><p className="text-sm text-slate-500">Branch</p><p className="mt-2 text-2xl font-bold text-secondary">{user?.branchId ? 'Assigned' : 'All branches'}</p></div><div className="card"><p className="text-sm text-slate-500">Workspace status</p><p className="mt-2"><span className="badge-success">Online</span></p></div></div></section>
  </main>
}

export default Dashboard
