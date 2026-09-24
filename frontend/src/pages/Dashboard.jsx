import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChefHat,
  IndianRupee,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getSalesSummary } from '../api/reportApi.js'

function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager'
  const [loading, setLoading] = useState(isOwnerOrManager)

  useEffect(() => {
    if (!isOwnerOrManager) return
    let active = true
    const today = new Date().toISOString().slice(0, 10)

    getSalesSummary(today, today)
      .then((res) => {
        if (active) {
          setSummary(res.data.data)
        }
      })
      .catch(() => {
        // Silently handle if reports are unavailable or branch has no data
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOwnerOrManager])

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Welcome back, {user?.name || 'there'}
        </h1>
        <p className="text-sm text-gray-500">
          Today is <span className="font-medium text-secondary">{formattedDate}</span>. Here is your overview for today.
        </p>
      </div>

      {/* Quick-glance Stat Cards */}
      {isOwnerOrManager ? (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Today's Revenue
              </p>
              <p className="mt-2 text-2xl font-bold text-secondary">
                {loading ? '...' : `₹${Number(summary?.totalRevenue || 0).toLocaleString('en-IN')}`}
              </p>
              <p className="mt-1 text-xs text-gray-400">Total gross earnings today</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-primary">
              <IndianRupee size={22} />
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Orders Completed
              </p>
              <p className="mt-2 text-2xl font-bold text-secondary">
                {loading ? '...' : (summary?.totalBills ?? 0)}
              </p>
              <p className="mt-1 text-xs text-gray-400">Billed orders recorded today</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Receipt size={22} />
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Avg. Order Value
              </p>
              <p className="mt-2 text-2xl font-bold text-secondary">
                {loading ? '...' : `₹${Math.round(summary?.avgBillValue || 0).toLocaleString('en-IN')}`}
              </p>
              <p className="mt-1 text-xs text-gray-400">Per bill average today</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={22} />
            </div>
          </div>
        </section>
      ) : (
        <section className="card max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Active Shift · {user?.role}
            </span>
          </div>
          <p className="text-secondary font-medium">
            You are logged in as <span className="text-primary font-semibold">{user?.name}</span>. Access your active workstation from the left sidebar to handle live orders and tasks.
          </p>
        </section>
      )}

      {/* Quick Launch Shortcuts */}
      <section className="card bg-gradient-to-r from-orange-50/50 via-white to-orange-50/20 border-orange-100/60 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-secondary">Quick Workstation Access</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Jump directly into real-time order processing and operational flows
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'cashier' || user?.role === 'waiter') && (
              <Link
                to="/dashboard/pos"
                className="btn-primary flex items-center gap-2 text-xs px-4 py-2"
              >
                <ShoppingCart size={15} />
                <span>New Order (POS)</span>
              </Link>
            )}
            {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'kitchen') && (
              <Link
                to="/dashboard/kitchen"
                className="btn-secondary flex items-center gap-2 text-xs px-4 py-2"
              >
                <ChefHat size={15} />
                <span>Kitchen Display</span>
              </Link>
            )}
            {(user?.role === 'owner' || user?.role === 'manager') && (
              <Link
                to="/dashboard/analytics"
                className="btn-secondary flex items-center gap-2 text-xs px-4 py-2"
              >
                <TrendingUp size={15} />
                <span>Analytics</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
