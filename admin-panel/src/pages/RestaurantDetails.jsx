import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  DollarSign,
  LoaderCircle,
  ShieldAlert,
  Users,
} from 'lucide-react'
import {
  getRestaurantDetails,
  updateRestaurantPlan,
  updateRestaurantStatus,
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
      setRestaurant((current) => ({ ...current, ...updatedRestaurant, isActive: updatedRestaurant.isActive }))
      setNotice(
        updatedRestaurant.isActive
          ? 'Restaurant reactivated. Staff can sign in again.'
          : 'Restaurant suspended. Staff login is now blocked.'
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
      setRestaurant((current) => ({ ...current, ...updatedRestaurant, plan: updatedRestaurant.plan }))
      setNotice(`Plan updated to ${updatedRestaurant.plan}.`)
    } catch (planError) {
      setNotice(planError.response?.data?.message || 'Unable to update subscription plan.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        <div className="flex items-center gap-2">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading restaurant details...
        </div>
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-danger">{error || 'Restaurant not found.'}</p>
          <Link to="/dashboard" className="btn-secondary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Restaurants
          </Link>
          <h1 className="text-lg font-semibold text-secondary">Restaurant Details</h1>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Account</p>
            <h2 className="text-3xl font-bold text-secondary">{restaurant.name}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={restaurant.isActive ? 'badge-success' : 'badge-danger'}>
              {restaurant.isActive ? 'Active' : 'Suspended'}
            </span>
            <button
              type="button"
              onClick={handleStatusToggle}
              disabled={saving}
              className={restaurant.isActive ? 'btn-secondary' : 'btn-primary'}
            >
              {saving ? 'Updating...' : restaurant.isActive ? 'Suspend Restaurant' : 'Reactivate Restaurant'}
            </button>
          </div>
        </div>

        {notice && (
          <div className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            {notice}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-4">
          <div className="card">
            <div className="mb-3 flex items-center gap-2 text-slate-500">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Branches</span>
            </div>
            <p className="text-3xl font-bold text-secondary">{restaurant.branches?.length || 0}</p>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center gap-2 text-slate-500">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Staff</span>
            </div>
            <p className="text-3xl font-bold text-secondary">{restaurant.staffCount || 0}</p>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center gap-2 text-slate-500">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Revenue</span>
            </div>
            <p className="text-3xl font-bold text-secondary">${Number(restaurant.totalRevenue || 0).toLocaleString()}</p>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center gap-2 text-slate-500">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Orders</span>
            </div>
            <p className="text-3xl font-bold text-secondary">{restaurant.totalOrders || 0}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold text-secondary">Business Profile</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Owner</p>
                <p className="mt-1 text-base font-medium text-secondary">{restaurant.owner?.name || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
                <p className="mt-1 text-base font-medium text-secondary">{restaurant.owner?.email || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Plan</p>
                <div className="mt-2">
                  <select
                    value={restaurant.plan || 'trial'}
                    onChange={handlePlanChange}
                    disabled={saving}
                    className="input-field"
                  >
                    {planOptions.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="mt-2 text-base font-medium text-secondary">
                  {restaurant.isActive ? 'Operational' : 'Suspended'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 text-lg font-semibold text-secondary">Branches</h3>
            {restaurant.branches?.length ? (
              <div className="space-y-3">
                {restaurant.branches.map((branch) => (
                  <div key={branch._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="font-medium text-secondary">{branch.name || 'Branch'}</p>
                    <p className="text-sm text-slate-500">{branch.address || 'No address provided'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No branches recorded.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default RestaurantDetails
