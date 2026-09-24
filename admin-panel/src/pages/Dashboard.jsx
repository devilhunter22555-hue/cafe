import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Search,
  Shield,
  Store,
  Users,
  XCircle
} from 'lucide-react'
import { getRestaurants } from '../api/adminApi.js'

const planStyles = {
  trial: 'bg-stone-100 text-stone-700 border-stone-200',
  basic: 'bg-amber-50 text-amber-800 border-amber-200',
  pro: 'bg-[#6F4E37]/10 text-[#6F4E37] border-[#6F4E37]/20 font-bold'
}

function Dashboard() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await getRestaurants()
        setRestaurants(response.data || [])
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || 'Unable to load restaurants.')
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  const stats = useMemo(() => {
    const total = restaurants.length
    const active = restaurants.filter((r) => r.isActive).length
    const suspended = total - active
    const totalBranches = restaurants.reduce((sum, r) => sum + (r.branchCount || r.branches?.length || 0), 0)
    const totalStaff = restaurants.reduce((sum, r) => sum + (r.staffCount || 0), 0)
    return { total, active, suspended, totalBranches, totalStaff }
  }, [restaurants])

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.owner?.email?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? r.isActive
          : !r.isActive

      return matchesSearch && matchesStatus
    })
  }, [restaurants, search, statusFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">
          Café Accounts &amp; Tenants
        </h1>
        <p className="mt-1 text-sm text-[#7A7068]">
          Multi-tenant platform oversight: manage restaurant subscriptions, branches, and system access
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Total Cafés
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#2B2118]">{stats.total}</p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Active Tenants
          </span>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-extrabold text-[#4F8A5A]">{stats.active}</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              Live
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Total Branches
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#6F4E37]">{stats.totalBranches}</p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Active Staff Accounts
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#2B2118]">{stats.totalStaff}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#EBE7DF] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-1.5 rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] p-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-[#6F4E37] shadow-xs'
                : 'text-[#7A7068] hover:text-[#2B2118]'
            }`}
          >
            All Accounts ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-[#7A7068] hover:text-[#2B2118]'
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('suspended')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === 'suspended'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-[#7A7068] hover:text-[#2B2118]'
            }`}
          >
            Suspended ({stats.suspended})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search café or owner email..."
            className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-2 pl-9 pr-3 text-xs text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
          />
        </div>
      </div>

      {/* Restaurants List */}
      {loading ? (
        <div className="py-16 text-center text-sm text-[#7A7068]">Loading café tenants...</div>
      ) : filteredRestaurants.length > 0 ? (
        <div className="divide-y divide-[#EBE7DF] rounded-2xl border border-[#EBE7DF] bg-white shadow-xs overflow-hidden">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant._id}
              className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-[#F7F5F2]/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F5F2] text-[#6F4E37] border border-[#EBE7DF]">
                  <Store size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#2B2118]">{restaurant.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${
                        planStyles[restaurant.plan] || planStyles.trial
                      }`}
                    >
                      {restaurant.plan || 'trial'} Plan
                    </span>
                    <span
                      className={restaurant.isActive ? 'badge-success' : 'badge-danger'}
                    >
                      {restaurant.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[#7A7068]">
                    Owner: <strong className="text-[#2B2118]">{restaurant.owner?.name || 'Owner'}</strong> ({restaurant.owner?.email || 'No email'})
                  </p>

                  <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{restaurant.branchCount || restaurant.branches?.length || 0} branches</span>
                    <span>•</span>
                    <span>{restaurant.staffCount || 0} registered staff</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/dashboard/restaurants/${restaurant._id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#EBE7DF] bg-white px-4 py-2 text-xs font-semibold text-[#2B2118] shadow-2xs hover:bg-[#F7F5F2] hover:border-[#6F4E37]/30 transition-all"
                >
                  <span>Manage Details</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[35vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-8 text-center">
          <Store className="text-gray-300 mb-3" size={40} />
          <h3 className="font-bold text-[#2B2118]">No café accounts found</h3>
          <p className="mt-1 text-sm text-[#7A7068]">
            {search ? `No accounts match "${search}"` : 'Registered restaurants will appear here'}
          </p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
