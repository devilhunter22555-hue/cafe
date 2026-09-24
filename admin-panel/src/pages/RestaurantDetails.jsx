import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  DollarSign,
  LoaderCircle,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users
} from 'lucide-react'
import {
  getRestaurantDetails,
  updateRestaurantPlan,
  updateRestaurantStatus
} from '../api/adminApi.js'

const planOptions = ['trial', 'basic', 'pro']

function RestaurantDetails() {
  const { id } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchRestaurant = async () => {
    try {
      const response = await getRestaurantDetails(id)
      setRestaurant(response.data || null)
      setError('')
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Unable to load restaurant details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestaurant()
  }, [id])

  const handleStatusToggle = async () => {
    if (!restaurant) return

    setSaving(true)
    setNotice('')

    try {
      const response = await updateRestaurantStatus(id, !restaurant.isActive)
      const updatedRestaurant = response.data || restaurant
      setRestaurant((current) => ({
        ...current,
        ...updatedRestaurant,
        isActive: updatedRestaurant.isActive
      }))
      setNotice(
        updatedRestaurant.isActive
          ? 'Restaurant reactivated. Staff can sign in again.'
          : 'Restaurant suspended. Staff access is blocked.'
      )
    } catch (statusError) {
      setNotice(statusError.response?.data?.message || 'Unable to update restaurant status.')
    } finally {
      setSaving(false)
    }
  }

  const handlePlanChange = async (event) => {
    const nextPlan = event.target.value
    if (!restaurant || !nextPlan) return

    setSaving(true)
    setNotice('')

    try {
      const response = await updateRestaurantPlan(id, nextPlan)
      const updatedRestaurant = response.data || restaurant
      setRestaurant((current) => ({
        ...current,
        ...updatedRestaurant,
        plan: updatedRestaurant.plan
      }))
      setNotice(`Subscription plan updated to ${updatedRestaurant.plan.toUpperCase()}.`)
    } catch (planError) {
      setNotice(planError.response?.data?.message || 'Unable to update subscription plan.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#7A7068]">
        <div className="flex items-center gap-2">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#6F4E37]" />
          Loading café account details...
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xs">
        <p className="text-sm font-semibold text-[#C75C5C]">{error || 'Restaurant not found.'}</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6F4E37] px-4 py-2 text-xs font-semibold text-white shadow-xs"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A7068] hover:text-[#6F4E37] transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          <span>Back to All Accounts</span>
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-xs">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">
                {restaurant.name}
              </h1>
              <p className="text-xs text-[#7A7068]">
                Tenant ID: <span className="font-mono">{restaurant._id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={restaurant.isActive ? 'badge-success' : 'badge-danger'}>
              {restaurant.isActive ? 'Active License' : 'Suspended'}
            </span>

            <button
              type="button"
              onClick={handleStatusToggle}
              disabled={saving}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                restaurant.isActive
                  ? 'border border-rose-200 bg-rose-50 text-[#C75C5C] hover:bg-rose-100'
                  : 'bg-[#4F8A5A] text-white hover:bg-emerald-600'
              }`}
            >
              {saving
                ? 'Updating...'
                : restaurant.isActive
                ? 'Suspend Tenant'
                : 'Reactivate Tenant'}
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Building2 size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7068]">
              Branches
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#2B2118]">
            {restaurant.branches?.length || restaurant.branchCount || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Users size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7068]">
              Staff Members
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#2B2118]">
            {restaurant.staffCount || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <DollarSign size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7068]">
              Reported Revenue
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#6F4E37]">
            ₹{Number(restaurant.totalRevenue || 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <CheckCircle2 size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7068]">
              Completed Orders
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#2B2118]">
            {restaurant.totalOrders || 0}
          </p>
        </div>
      </div>

      {/* Main Grid: Business Profile & Branches */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.8fr]">
        {/* Business Profile */}
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#F7F5F2] pb-3">
            <ShieldCheck size={18} className="text-[#6F4E37]" />
            <h3 className="text-base font-bold text-[#2B2118]">Subscription &amp; Business Profile</h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7068]">
                Owner Name
              </span>
              <p className="mt-1 font-semibold text-[#2B2118]">
                {restaurant.owner?.name || 'Unassigned'}
              </p>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7068]">
                Owner Email
              </span>
              <p className="mt-1 font-semibold text-[#2B2118]">
                {restaurant.owner?.email || 'N/A'}
              </p>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7068] mb-1.5">
                Assigned Subscription Plan
              </span>
              <select
                value={restaurant.plan || 'trial'}
                onChange={handlePlanChange}
                disabled={saving}
                className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2 text-sm font-semibold capitalize text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
              >
                {planOptions.map((p) => (
                  <option key={p} value={p}>
                    {p} plan
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7A7068]">
                Account Status
              </span>
              <p className="mt-2 text-sm font-semibold text-[#2B2118]">
                {restaurant.isActive ? 'Active (Full Platform Access)' : 'Suspended (Access Revoked)'}
              </p>
            </div>
          </div>
        </div>

        {/* Branches Card */}
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#2B2118] border-b border-[#F7F5F2] pb-3">
            Branches ({restaurant.branches?.length || 0})
          </h3>

          {restaurant.branches?.length > 0 ? (
            <div className="space-y-3">
              {restaurant.branches.map((branch) => (
                <div
                  key={branch._id}
                  className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F2]/60 p-3.5"
                >
                  <p className="font-bold text-[#2B2118]">{branch.name || 'Main Branch'}</p>
                  <p className="mt-0.5 text-xs text-[#7A7068]">
                    {branch.address || 'No physical address provided'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#7A7068] py-4 text-center">
              No branch locations recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default RestaurantDetails
