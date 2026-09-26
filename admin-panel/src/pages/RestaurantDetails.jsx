import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  Users,
} from 'lucide-react'
import {
  getRestaurantDetails,
  updateRestaurantPlan,
  updateRestaurantStatus,
} from '../api/adminApi.js'
import {
  ConfirmDialog,
  EmptyState,
  LoadingState,
  StatCard,
  StatusBadge,
  Toast,
} from '../components/ui/AdminUI.jsx'

const planOptions = [
  {
    id: 'trial',
    label: 'Trial Plan',
    description: 'Evaluation tier for onboarding cafés',
  },
  {
    id: 'basic',
    label: 'Basic Plan',
    description: 'Standard POS, billing & kitchen workflows',
  },
  {
    id: 'pro',
    label: 'Pro Plan',
    description: 'Full multi-branch, analytics & CRM suite',
  },
]

function RestaurantDetails() {
  const { id } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false)

  const fetchRestaurant = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getRestaurantDetails(id)
      setRestaurant(response.data || null)
      setError('')
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message ||
          'Unable to load café account details.'
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRestaurant()
  }, [fetchRestaurant])

  const handleStatusToggle = async () => {
    if (!restaurant) return

    setSaving(true)
    try {
      const nextStatus = !restaurant.isActive
      const response = await updateRestaurantStatus(id, nextStatus)
      const updatedRestaurant = response.data || { ...restaurant, isActive: nextStatus }
      setRestaurant((current) => ({
        ...current,
        ...updatedRestaurant,
        isActive: updatedRestaurant.isActive,
      }))
      setToast({
        message: updatedRestaurant.isActive
          ? 'Café reactivated. Staff can sign in again.'
          : 'Café suspended. Staff access is blocked.',
        type: 'success',
      })
      setConfirmSuspendOpen(false)
    } catch (statusError) {
      setToast({
        message:
          statusError.response?.data?.message ||
          'Unable to update café status.',
        type: 'error',
      })
      setConfirmSuspendOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handlePlanChange = async (nextPlan) => {
    if (!restaurant || !nextPlan || restaurant.plan === nextPlan) return

    setSaving(true)
    try {
      const response = await updateRestaurantPlan(id, nextPlan)
      const updatedRestaurant = response.data || { ...restaurant, plan: nextPlan }
      setRestaurant((current) => ({
        ...current,
        ...updatedRestaurant,
        plan: updatedRestaurant.plan,
      }))
      setToast({
        message: `Subscription tier updated to ${updatedRestaurant.plan.toUpperCase()}.`,
        type: 'success',
      })
    } catch (planError) {
      setToast({
        message:
          planError.response?.data?.message ||
          'Unable to update subscription plan.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <LoadingState message="Loading café tenant profile & metrics..." rows={4} />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle size={36} className="mx-auto text-[#C75C5C] mb-3" />
        <p className="text-base font-bold text-[#241B15]">
          {error || 'Café account not found.'}
        </p>
        <Link to="/dashboard" className="btn-primary mt-4 text-xs">
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#81766D] hover:text-[#6F4E37] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Café Directory</span>
          </Link>

          <button
            type="button"
            onClick={fetchRestaurant}
            className="btn-secondary compact"
          >
            <RefreshCw size={13} className="text-[#6F4E37]" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="card flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-sm">
              <Store size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#241B15]">
                  {restaurant.name}
                </h1>
                <StatusBadge
                  status={restaurant.isActive ? 'active' : 'suspended'}
                  label={restaurant.isActive ? 'Active License' : 'Suspended'}
                />
                <StatusBadge
                  status={restaurant.plan || 'trial'}
                  label={`${restaurant.plan || 'trial'} tier`}
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#81766D]">
                <span>
                  Tenant ID: <strong className="font-mono text-[#241B15]">{restaurant._id}</strong>
                </span>
                {restaurant.createdAt && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      Joined{' '}
                      {new Date(restaurant.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setConfirmSuspendOpen(true)}
              disabled={saving}
              className={
                restaurant.isActive
                  ? 'btn-danger text-xs px-4 py-2.5'
                  : 'btn-primary text-xs px-4 py-2.5'
              }
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

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Reported Revenue"
          value={`₹${Number(restaurant.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Total cumulative billed sales"
          icon={IndianRupee}
          tone="coffee"
        />
        <StatCard
          title="Completed Orders"
          value={Number(restaurant.totalOrders || 0).toLocaleString('en-IN')}
          subtitle="Orders processed via POS & QR"
          icon={ShoppingBag}
          tone="accent"
        />
        <StatCard
          title="Branch Locations"
          value={restaurant.branches?.length || restaurant.branchCount || 0}
          subtitle="Configured café outlets"
          icon={Building2}
          tone="success"
        />
        <StatCard
          title="Staff Accounts"
          value={restaurant.staffCount || 0}
          subtitle="Managers, cashiers, kitchen & waiters"
          icon={Users}
          tone="dark"
        />
      </div>

      {/* Two-Column Detail Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#F7F5F2] pb-3.5">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#6F4E37]" />
                <div>
                  <h2 className="text-base font-bold text-[#241B15]">
                    Subscription Tier Assignment
                  </h2>
                  <p className="text-xs text-[#81766D]">
                    Select a plan below to immediately update this café&apos;s subscription tier
                  </p>
                </div>
              </div>
              <Link
                to="/dashboard/plans"
                className="text-xs font-semibold text-[#6F4E37] hover:underline"
              >
                Manage Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {planOptions.map((option) => {
                const isSelected = (restaurant.plan || 'trial') === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={saving}
                    onClick={() => handlePlanChange(option.id)}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-[#6F4E37] bg-[#6F4E37]/[0.06] ring-2 ring-[#6F4E37]/15'
                        : 'border-[#E8E1DA] bg-[#F7F5F2]/50 hover:bg-white hover:border-[#6F4E37]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold uppercase tracking-wide text-[#241B15]">
                          {option.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 size={16} className="text-[#6F4E37]" />
                        )}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#81766D]">
                        {option.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-[#E8E1DA]/60 text-[11px] font-bold text-[#6F4E37]">
                      {isSelected ? 'Current Active Plan' : 'Click to Assign →'}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F7F5F2] pb-3.5">
              <ShieldCheck size={18} className="text-[#6F4E37]" />
              <h2 className="text-base font-bold text-[#241B15]">
                Owner &amp; Account Credentials
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <User size={13} className="text-[#6F4E37]" />
                  <span>Primary Owner Name</span>
                </span>
                <p className="mt-1.5 text-sm font-bold text-[#241B15]">
                  {restaurant.owner?.name || 'Unassigned'}
                </p>
              </div>

              <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <Mail size={13} className="text-[#C98A5B]" />
                  <span>Owner Email Address</span>
                </span>
                <p className="mt-1.5 text-sm font-bold text-[#241B15] truncate">
                  {restaurant.owner?.email || 'N/A'}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="card p-6 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-[#F7F5F2] pb-3.5">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#6F4E37]" />
              <h2 className="text-base font-bold text-[#241B15]">
                Branches ({restaurant.branches?.length || 0})
              </h2>
            </div>
          </div>

          {restaurant.branches?.length > 0 ? (
            <div className="space-y-3">
              {restaurant.branches.map((branch, idx) => (
                <div
                  key={branch._id || idx}
                  className="rounded-2xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4 transition-colors hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#241B15]">
                      {branch.name || `Branch #${idx + 1}`}
                    </p>
                    <span className="badge-coffee text-[10px]">Outlet</span>
                  </div>
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-[#81766D]">
                    <MapPin size={13} className="mt-0.5 shrink-0 text-[#C98A5B]" />
                    <span>{branch.address || 'No physical address provided'}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title="No branches listed"
              description="This café account has not added additional branch locations yet."
            />
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmSuspendOpen}
        onClose={() => setConfirmSuspendOpen(false)}
        onConfirm={handleStatusToggle}
        loading={saving}
        variant={restaurant.isActive ? 'danger' : 'primary'}
        title={
          restaurant.isActive
            ? `Suspend ${restaurant.name}?`
            : `Reactivate ${restaurant.name}?`
        }
        description={
          restaurant.isActive
            ? 'Suspending this café account will immediately block its owner and staff from signing in until reactivated.'
            : 'Reactivating this café account restores full POS, kitchen, and management access.'
        }
        confirmLabel={
          restaurant.isActive ? 'Suspend Tenant' : 'Reactivate Tenant'
        }
      />
    </div>
  )
}

export default RestaurantDetails
