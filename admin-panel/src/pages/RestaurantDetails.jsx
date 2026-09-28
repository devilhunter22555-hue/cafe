import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  CreditCard,
  Globe,
  IndianRupee,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import {
  getPlans,
  getRestaurantDetails,
  resetCafeAdminPassword,
  updateCafe,
  updateCafeAdmin,
  updateCafeAdminStatus,
  updateRestaurantPlan,
  updateRestaurantStatus,
} from '../api/adminApi.js'
import {
  CreateCafeModal,
  EditCafeAdminModal,
  ResetCafeAdminPasswordModal,
} from '../components/CreateCafeModal.jsx'
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

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  if (!value) return 'Never signed in'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RestaurantDetails() {
  const { id } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  // Modals & Confirmations
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false)
  const [editCafeOpen, setEditCafeOpen] = useState(false)
  const [editAdminOpen, setEditAdminOpen] = useState(false)
  const [resetAdminPassOpen, setResetAdminPassOpen] = useState(false)
  const [confirmAdminToggleOpen, setConfirmAdminToggleOpen] = useState(false)

  const fetchRestaurant = useCallback(async () => {
    try {
      setLoading(true)
      const [detailRes, plansRes] = await Promise.all([
        getRestaurantDetails(id),
        getPlans().catch(() => ({ data: [] })),
      ])
      setRestaurant(detailRes.data || null)
      setPlans(plansRes.data || [])
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
      await updateRestaurantStatus(id, nextStatus)
      setToast({
        message: nextStatus
          ? 'Café activated. Admin, staff, and customer ordering restored.'
          : 'Café deactivated. Access is now blocked while preserving all data.',
        type: 'success',
      })
      setConfirmSuspendOpen(false)
      await fetchRestaurant()
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
      await updateRestaurantPlan(id, nextPlan)
      setToast({
        message: `Subscription tier updated to ${nextPlan.toUpperCase()}.`,
        type: 'success',
      })
      await fetchRestaurant()
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

  const handleEditCafeSubmit = async (payload) => {
    setSaving(true)
    try {
      await updateCafe(id, payload)
      setToast({
        message: `Café "${payload.cafeName}" updated successfully.`,
        type: 'success',
      })
      setEditCafeOpen(false)
      await fetchRestaurant()
    } finally {
      setSaving(false)
    }
  }

  const handleEditAdminSubmit = async (payload) => {
    setSaving(true)
    try {
      await updateCafeAdmin(id, payload)
      setToast({
        message: 'Café Admin account updated successfully.',
        type: 'success',
      })
      setEditAdminOpen(false)
      await fetchRestaurant()
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAdminStatus = async () => {
    const adminAcc = restaurant?.admin || restaurant?.owner
    if (!adminAcc) return
    setSaving(true)
    try {
      const nextActive = adminAcc.isActive === false
      await updateCafeAdminStatus(id, nextActive)
      setToast({
        message: nextActive
          ? 'Café Admin account activated.'
          : 'Café Admin account deactivated.',
        type: 'success',
      })
      setConfirmAdminToggleOpen(false)
      await fetchRestaurant()
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || 'Unable to update admin status.',
        type: 'error',
      })
      setConfirmAdminToggleOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleResetAdminPassword = async (newPassword) => {
    setSaving(true)
    try {
      const res = await resetCafeAdminPassword(id, newPassword)
      setToast({
        message: res.message || 'Café Admin password reset successfully.',
        type: 'success',
      })
      setResetAdminPassOpen(false)
      await fetchRestaurant()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <LoadingState message="Loading café profile, admin account & metrics..." rows={4} />
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
        <Link to="/dashboard/cafes" className="btn-primary mt-4 text-xs">
          <ArrowLeft size={14} />
          <span>Back to Café Management</span>
        </Link>
      </div>
    )
  }

  const adminAccount = restaurant.admin || restaurant.owner
  const settings = restaurant.settings || {}
  const fullAddress = [
    restaurant.address,
    restaurant.city,
    restaurant.state,
    restaurant.pincode,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-8">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Top Navigation & Café Hero Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard/cafes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#81766D] hover:text-[#6F4E37] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Café Management</span>
          </Link>

          <button
            type="button"
            onClick={fetchRestaurant}
            className="btn-secondary text-xs px-3.5 py-2"
          >
            <RefreshCw size={13} className="text-[#6F4E37]" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="card flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between p-6">
          <div className="flex items-center gap-4">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="h-16 w-16 shrink-0 rounded-2xl border border-[#E8E1DA] object-cover bg-white shadow-xs"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-sm">
                <Store size={28} />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#241B15]">
                  {restaurant.name}
                </h1>
                <StatusBadge
                  status={restaurant.isActive ? 'active' : 'inactive'}
                  label={restaurant.isActive ? 'ACTIVE' : 'INACTIVE'}
                />
                <StatusBadge
                  status={restaurant.plan || 'trial'}
                  label={`${restaurant.plan || 'trial'} tier`}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#81766D]">
                <span>
                  Café ID:{' '}
                  <strong className="font-mono text-[#241B15]">
                    {restaurant.cafeId || restaurant._id}
                  </strong>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} />
                  Created {formatDate(restaurant.createdAt)}
                </span>
                {restaurant.city && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="text-[#C98A5B]" />
                      {restaurant.city}
                      {restaurant.state ? `, ${restaurant.state}` : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setEditCafeOpen(true)}
              disabled={saving}
              className="btn-secondary text-xs px-4 py-2.5"
            >
              <Pencil size={14} className="text-[#6F4E37]" />
              <span>Edit Café</span>
            </button>

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
              <Power size={14} />
              <span>
                {saving
                  ? 'Updating...'
                  : restaurant.isActive
                    ? 'Deactivate Café'
                    : 'Activate Café'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Real Database Statistics Cards (Orders, Customers, Revenue, Menu Items, Staff) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Revenue"
          value={`₹${Number(restaurant.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Total billed café revenue"
          icon={IndianRupee}
          tone="coffee"
        />
        <StatCard
          title="Orders"
          value={Number(restaurant.totalOrders || 0).toLocaleString('en-IN')}
          subtitle="Orders placed in this café"
          icon={ShoppingBag}
          tone="accent"
        />
        <StatCard
          title="Customers"
          value={Number(restaurant.totalCustomers || 0).toLocaleString('en-IN')}
          subtitle="Registered café customers"
          icon={Users}
          tone="success"
        />
        <StatCard
          title="Menu Items"
          value={Number(restaurant.menuItemCount || 0).toLocaleString('en-IN')}
          subtitle="Configured dishes & drinks"
          icon={UtensilsCrossed}
          tone="coffee"
        />
        <StatCard
          title="Staff"
          value={Number(restaurant.staffCount || 0).toLocaleString('en-IN')}
          subtitle="Managers, cashiers & waiters"
          icon={Building2}
          tone="dark"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Café Profile + Admin Account + Subscription Tier */}
        <div className="space-y-6 lg:col-span-2">
          {/* Café Information Card */}
          <section className="card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#F7F5F2] pb-3.5">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-[#6F4E37]" />
                <h2 className="text-base font-bold text-[#241B15]">
                  Café Information &amp; Contact
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditCafeOpen(true)}
                className="text-xs font-bold text-[#6F4E37] hover:underline"
              >
                Edit Details →
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <User size={13} className="text-[#6F4E37]" />
                  <span>Owner Name</span>
                </span>
                <p className="mt-1.5 text-sm font-bold text-[#241B15]">
                  {restaurant.ownerName || adminAccount?.name || '—'}
                </p>
              </div>

              <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <Mail size={13} className="text-[#C98A5B]" />
                  <span>Café Email</span>
                </span>
                <p className="mt-1.5 text-sm font-bold text-[#241B15] truncate">
                  {restaurant.email || adminAccount?.email || '—'}
                </p>
              </div>

              <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <Phone size={13} className="text-[#6F4E37]" />
                  <span>Café Phone</span>
                </span>
                <p className="mt-1.5 text-sm font-bold text-[#241B15]">
                  {restaurant.phone || adminAccount?.phone || '—'}
                </p>
              </div>

              <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <MapPin size={13} className="text-[#C98A5B]" />
                  <span>Address &amp; City</span>
                </span>
                <p className="mt-1.5 text-sm font-bold text-[#241B15]">
                  {fullAddress || 'No address specified'}
                </p>
              </div>
            </div>
          </section>

          {/* =====================================================
              CAFÉ ADMIN MANAGEMENT SECTION ("Admin Account")
             ===================================================== */}
          <section className="card p-6 space-y-5">
            <div className="flex flex-col gap-3 border-b border-[#F7F5F2] pb-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#6F4E37]" />
                <div>
                  <h2 className="text-base font-bold text-[#241B15]">
                    Admin Account
                  </h2>
                  <p className="text-xs text-[#81766D]">
                    Primary Café Admin credentials &amp; access management (passwords are never displayed)
                  </p>
                </div>
              </div>

              {adminAccount && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAdminOpen(true)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <Pencil size={13} className="text-[#6F4E37]" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetAdminPassOpen(true)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <KeyRound size={13} className="text-[#6F4E37]" />
                    <span>Reset Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmAdminToggleOpen(true)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                      adminAccount.isActive !== false
                        ? 'border-[#C75C5C]/30 bg-[#C75C5C]/10 text-[#C75C5C] hover:bg-[#C75C5C] hover:text-white'
                        : 'border-[#4F8A5A]/30 bg-[#4F8A5A]/10 text-[#4F8A5A] hover:bg-[#4F8A5A] hover:text-white'
                    }`}
                  >
                    <Power size={13} />
                    <span>
                      {adminAccount.isActive !== false ? 'Deactivate' : 'Activate'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {adminAccount ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                    Admin Name
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-[#241B15]">
                    {adminAccount.name}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                    Admin Email
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-[#241B15] truncate">
                    {adminAccount.email}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                    Admin Phone
                  </span>
                  <p className="mt-1 text-sm font-extrabold text-[#241B15]">
                    {adminAccount.phone || restaurant.phone || '—'}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                    Account Status
                  </span>
                  <div className="mt-1.5">
                    <StatusBadge
                      status={adminAccount.isActive !== false ? 'active' : 'inactive'}
                      label={adminAccount.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4 sm:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                    Last Login
                  </span>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#241B15]">
                    <Clock size={14} className="text-[#6F4E37]" />
                    <span>{formatDateTime(adminAccount.lastLoginAt)}</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#81766D]">
                No Café Admin account is currently linked to this café.
              </p>
            )}
          </section>

          {/* Subscription Plan Section */}
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
        </div>

        {/* Right Column: Café Settings + Branches + Audit Logs */}
        <div className="space-y-6">
          {/* Café Settings Card */}
          <section className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F7F5F2] pb-3.5">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[#6F4E37]" />
                <h2 className="text-base font-bold text-[#241B15]">Café Settings</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditCafeOpen(true)}
                className="text-xs font-bold text-[#6F4E37] hover:underline"
              >
                Configure
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-[#F7F5F2]/70 px-3.5 py-2.5">
                <span className="text-[#81766D] font-semibold">Currency</span>
                <span className="font-bold text-[#241B15]">
                  {settings.currency || 'INR'} ({settings.currencySymbol || '₹'})
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F7F5F2]/70 px-3.5 py-2.5">
                <span className="text-[#81766D] font-semibold">Default Tax / GST</span>
                <span className="font-bold text-[#241B15]">
                  {settings.taxPercent ?? 5}%
                </span>
              </div>
              {settings.gstNumber && (
                <div className="flex items-center justify-between rounded-xl bg-[#F7F5F2]/70 px-3.5 py-2.5">
                  <span className="text-[#81766D] font-semibold">GSTIN</span>
                  <span className="font-mono font-bold text-[#241B15]">
                    {settings.gstNumber}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-xl bg-[#F7F5F2]/70 px-3.5 py-2.5">
                <span className="text-[#81766D] font-semibold">Operating Hours</span>
                <span className="font-bold text-[#241B15]">
                  {settings.openingTime || '09:00'} – {settings.closingTime || '23:00'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F7F5F2]/70 px-3.5 py-2.5">
                <span className="text-[#81766D] font-semibold">Timezone</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#241B15]">
                  <Globe size={12} className="text-[#6F4E37]" />
                  {settings.timezone || 'Asia/Kolkata'}
                </span>
              </div>
            </div>
          </section>

          {/* Branches Card */}
          <section className="card p-6 space-y-4">
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
                    className="rounded-2xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#241B15]">
                        {branch.name || `Branch #${idx + 1}`}
                      </p>
                      <span className="badge-coffee text-[10px]">Outlet</span>
                    </div>
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-[#81766D]">
                      <MapPin size={13} className="mt-0.5 shrink-0 text-[#C98A5B]" />
                      <span>
                        {branch.address || fullAddress || 'No physical address provided'}
                      </span>
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

          {/* Recent Café Audit Log */}
          {restaurant.auditLogs?.length > 0 && (
            <section className="card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#F7F5F2] pb-3.5">
                <Activity size={17} className="text-[#6F4E37]" />
                <h2 className="text-sm font-bold text-[#241B15]">
                  Recent Admin Audit Trail
                </h2>
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {restaurant.auditLogs.slice(0, 6).map((log) => (
                  <div
                    key={log._id}
                    className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/50 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#6F4E37]">{log.action}</span>
                      <span className="text-[10px] text-[#81766D]">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[#241B15]">{log.details}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateCafeModal
        open={editCafeOpen}
        onClose={() => setEditCafeOpen(false)}
        onSubmit={handleEditCafeSubmit}
        plans={plans}
        loading={saving}
        mode="edit"
        initialCafe={restaurant}
      />

      <EditCafeAdminModal
        open={editAdminOpen}
        onClose={() => setEditAdminOpen(false)}
        admin={adminAccount}
        cafeName={restaurant.name}
        onSubmit={handleEditAdminSubmit}
        loading={saving}
      />

      <ResetCafeAdminPasswordModal
        open={resetAdminPassOpen}
        onClose={() => setResetAdminPassOpen(false)}
        admin={adminAccount}
        cafeName={restaurant.name}
        onSubmit={handleResetAdminPassword}
        loading={saving}
      />

      <ConfirmDialog
        open={confirmSuspendOpen}
        onClose={() => setConfirmSuspendOpen(false)}
        onConfirm={handleStatusToggle}
        loading={saving}
        variant={restaurant.isActive ? 'danger' : 'primary'}
        title={
          restaurant.isActive
            ? `Deactivate ${restaurant.name}?`
            : `Activate ${restaurant.name}?`
        }
        description={
          restaurant.isActive
            ? 'Deactivating this café account will immediately block its Café Admin, Staff, and Customer ordering until reactivated. No data is deleted.'
            : 'Activating this café account restores full POS, kitchen, customer QR ordering, and management access.'
        }
        confirmLabel={
          restaurant.isActive ? 'Deactivate Café' : 'Activate Café'
        }
      />

      <ConfirmDialog
        open={confirmAdminToggleOpen}
        onClose={() => setConfirmAdminToggleOpen(false)}
        onConfirm={handleToggleAdminStatus}
        loading={saving}
        variant={adminAccount?.isActive !== false ? 'danger' : 'primary'}
        title={
          adminAccount?.isActive !== false
            ? `Deactivate Admin "${adminAccount?.name}"?`
            : `Activate Admin "${adminAccount?.name}"?`
        }
        description={
          adminAccount?.isActive !== false
            ? 'This admin account will be blocked from signing in until reactivated.'
            : 'Reactivating this admin account restores sign-in access.'
        }
        confirmLabel={
          adminAccount?.isActive !== false ? 'Deactivate Admin' : 'Activate Admin'
        }
      />
    </div>
  )
}

export default RestaurantDetails
