import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Ban,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Coffee,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  IndianRupee,
  Layers,
  Mail,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import {
  createRestaurant,
  getPlans,
  getRestaurantDetails,
  getRestaurants,
  sendDailySalesReport,
  sendMonthlySalesReport,
  updateRestaurantPlan,
  updateRestaurantStatus,
} from '../api/adminApi.js'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import CreateCafeModal from '../components/CreateCafeModal.jsx'
import {
  ConfirmDialog,
  Drawer,
  EmptyState,
  LoadingState,
  SearchBar,
  StatCard,
  StatusBadge,
  Toast,
} from '../components/ui/AdminUI.jsx'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

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

const planOptions = ['trial', 'basic', 'pro']
const staffPanelUrl =
  import.meta.env.VITE_STAFF_PANEL_URL || 'http://localhost:5173/login'

function Dashboard() {
  const { admin } = useAdminAuth()
  const [restaurants, setRestaurants] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [chartMetric, setChartMetric] = useState('revenue') // 'revenue' | 'orders'
  const [chartScope, setChartScope] = useState('all') // 'all' | 'active' | 'pro'

  // Quick-view Drawer & Confirm Dialog
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [confirmToggleTenant, setConfirmToggleTenant] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Create Café Modal & Confirmation State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createdConfirmation, setCreatedConfirmation] = useState(null)
  const [copiedDetails, setCopiedDetails] = useState(false)
  const [sendingReportType, setSendingReportType] = useState('')

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError('')

    try {
      const [restaurantsRes, plansRes] = await Promise.all([
        getRestaurants(),
        getPlans().catch(() => ({ data: [] })),
      ])

      const baseList = restaurantsRes.data || []
      setPlans(plansRes.data || [])

      const enriched = await Promise.all(
        baseList.map(async (item) => {
          try {
            const detailRes = await getRestaurantDetails(item._id)
            return detailRes.data ? { ...item, ...detailRes.data } : item
          } catch {
            return item
          }
        })
      )

      setRestaurants(enriched)
      setSelectedTenant((current) =>
        current ? enriched.find((r) => r._id === current._id) || current : null
      )
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message ||
          'Unable to load café dashboard data.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData(false)
  }, [loadDashboardData])

  const stats = useMemo(() => {
    const totalCafes = restaurants.length
    const activeCafes = restaurants.filter((r) => r.isActive).length
    const suspendedCafes = totalCafes - activeCafes
    const totalBranches = restaurants.reduce(
      (sum, r) => sum + (r.branches?.length ?? r.branchCount ?? 0),
      0
    )
    const totalStaff = restaurants.reduce(
      (sum, r) => sum + (Number(r.staffCount) || 0),
      0
    )
    const totalRevenue = restaurants.reduce(
      (sum, r) => sum + (Number(r.totalRevenue) || 0),
      0
    )
    const totalOrders = restaurants.reduce(
      (sum, r) => sum + (Number(r.totalOrders) || 0),
      0
    )
    const totalCustomers = restaurants.reduce(
      (sum, r) => sum + (Number(r.totalCustomers ?? r.customerCount) || 0),
      0
    )
    const totalAdmins = restaurants.filter((r) => Boolean(r.admin || r.owner)).length || totalCafes

    const trialCount = restaurants.filter((r) => (r.plan || 'trial') === 'trial').length
    const basicCount = restaurants.filter((r) => r.plan === 'basic').length
    const proCount = restaurants.filter((r) => r.plan === 'pro').length

    return {
      totalCafes,
      activeCafes,
      suspendedCafes,
      totalBranches,
      totalStaff,
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalAdmins,
      trialCount,
      basicCount,
      proCount,
    }
  }, [restaurants])

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        r.name?.toLowerCase().includes(q) ||
        r.owner?.name?.toLowerCase().includes(q) ||
        r.owner?.email?.toLowerCase().includes(q) ||
        String(r._id || '').toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? r.isActive
            : !r.isActive

      const matchesPlan =
        planFilter === 'all' ? true : (r.plan || 'trial') === planFilter

      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [restaurants, search, statusFilter, planFilter])

  const chartItems = useMemo(() => {
    const scoped = restaurants.filter((r) => {
      if (chartScope === 'active') return r.isActive
      if (chartScope === 'pro') return r.plan === 'pro'
      return true
    })
    return [...scoped]
      .sort((a, b) =>
        chartMetric === 'revenue'
          ? (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0)
          : (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0)
      )
      .slice(0, 6)
  }, [restaurants, chartMetric, chartScope])

  const maxChartValue = useMemo(() => {
    if (chartItems.length === 0) return 1
    const max = Math.max(
      ...chartItems.map((item) =>
        chartMetric === 'revenue'
          ? Number(item.totalRevenue) || 0
          : Number(item.totalOrders) || 0
      )
    )
    return max > 0 ? max : 1
  }, [chartItems, chartMetric])

  const topPerformingCafes = useMemo(() => {
    return [...restaurants]
      .sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0))
      .slice(0, 5)
  }, [restaurants])

  const handleToggleStatus = async (tenant) => {
    if (!tenant) return
    setActionLoading(true)
    try {
      const nextStatus = !tenant.isActive
      const response = await updateRestaurantStatus(tenant._id, nextStatus)
      const updated = response.data || { ...tenant, isActive: nextStatus }

      setRestaurants((prev) =>
        prev.map((item) =>
          item._id === tenant._id
            ? { ...item, ...updated, isActive: updated.isActive }
            : item
        )
      )
      setSelectedTenant((prev) =>
        prev && prev._id === tenant._id
          ? { ...prev, ...updated, isActive: updated.isActive }
          : prev
      )
      setToast({
        message: updated.isActive
          ? `${tenant.name} reactivated successfully.`
          : `${tenant.name} suspended.`,
        type: 'success',
      })
      setConfirmToggleTenant(null)
    } catch (err) {
      setToast({
        message:
          err.response?.data?.message || 'Unable to update café status.',
        type: 'error',
      })
      setConfirmToggleTenant(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePlanChange = async (tenantId, nextPlan) => {
    if (!tenantId || !nextPlan) return
    setActionLoading(true)
    try {
      const response = await updateRestaurantPlan(tenantId, nextPlan)
      const updated = response.data || { plan: nextPlan }
      setRestaurants((prev) =>
        prev.map((item) =>
          item._id === tenantId
            ? { ...item, plan: updated.plan || nextPlan }
            : item
        )
      )
      setSelectedTenant((prev) =>
        prev && prev._id === tenantId
          ? { ...prev, plan: updated.plan || nextPlan }
          : prev
      )
      setToast({
        message: `Subscription tier updated to ${(updated.plan || nextPlan).toUpperCase()}.`,
        type: 'success',
      })
    } catch (err) {
      setToast({
        message:
          err.response?.data?.message || 'Unable to update subscription plan.',
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenCreateModal = async () => {
    setShowCreateModal(true)
    if (plans.length === 0) {
      try {
        const plansRes = await getPlans()
        setPlans(plansRes.data || [])
      } catch {
        // Keep default fallback tiers if plans endpoint fails
      }
    }
  }

  const handleCreateRestaurant = async (payload) => {
    setCreating(true)
    try {
      const response = await createRestaurant(payload)
      const createdOwnerEmail =
        response?.data?.admin?.email ||
        response?.data?.owner?.email ||
        payload.adminEmail ||
        payload.ownerEmail
      const createdRestaurantName =
        response?.data?.cafe?.name ||
        response?.data?.restaurant?.name ||
        response?.data?.name ||
        payload.name ||
        payload.restaurantName

      setShowCreateModal(false)
      setCreatedConfirmation({
        restaurantName: createdRestaurantName,
        ownerName:
          response?.data?.admin?.name ||
          response?.data?.owner?.name ||
          payload.adminName ||
          payload.ownerName,
        ownerEmail: createdOwnerEmail,
        plan: payload.subscriptionPlan || payload.plan || 'trial',
        staffPanelUrl,
      })
      setToast({
        message: `${createdRestaurantName} created successfully!`,
        type: 'success',
      })
      await loadDashboardData(true)
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!createdConfirmation) return
    const text = `Account created! Share these login details with the restaurant owner: Email: ${createdConfirmation.ownerEmail}, they can log in at ${createdConfirmation.staffPanelUrl}`
    navigator.clipboard?.writeText(text)
    setCopiedDetails(true)
    setTimeout(() => setCopiedDetails(false), 2500)
  }

  const handleSendSalesReport = async (type) => {
    setSendingReportType(type)
    try {
      const response =
        type === 'daily'
          ? await sendDailySalesReport()
          : await sendMonthlySalesReport()
      setToast({
        message:
          response.data?.message ||
          `${type === 'daily' ? 'Daily' : 'Monthly'} sales report generated and emailed successfully.`,
        type: 'success',
      })
    } catch (err) {
      setToast({
        message:
          err.response?.data?.message ||
          `Failed to send ${type} sales report. Check SMTP configuration in Backend/.env.`,
        type: 'error',
      })
    } finally {
      setSendingReportType('')
    }
  }

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-8">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Hero Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[#6F4E37]">
            {getGreeting()}, {admin?.name || 'Admin'} 👋
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#241B15]">
            Here&apos;s what&apos;s happening at your café today.
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#81766D]">
            Real-time multi-tenant café performance, order volume, and subscription oversight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#E8E1DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#81766D] shadow-2xs">
            <Calendar size={14} className="text-[#6F4E37]" />
            <span>{todayLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing || loading}
            className="btn-secondary text-xs px-3.5 py-2"
          >
            <RefreshCw
              size={14}
              className={refreshing ? 'animate-spin text-[#6F4E37]' : 'text-[#6F4E37]'}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link to="/dashboard/plans" className="btn-secondary text-xs px-4 py-2">
            <CreditCard size={14} className="text-[#6F4E37]" />
            <span>Manage Plans</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn-primary text-xs px-4 py-2"
          >
            <Plus size={15} />
            <span>+ Create Café</span>
          </button>
        </div>
      </div>

      {/* Created Restaurant Owner Login Confirmation Banner */}
      {createdConfirmation && (
        <div className="card border-[#4F8A5A]/40 bg-[#4F8A5A]/[0.07] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F8A5A] text-white shadow-2xs">
                <CheckCircle2 size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#241B15]">
                    {createdConfirmation.restaurantName} Onboarded Successfully
                  </h3>
                  <StatusBadge
                    status={createdConfirmation.plan}
                    label={`${createdConfirmation.plan} plan`}
                  />
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#241B15] leading-relaxed">
                  Account created! Share these login details with the restaurant owner:{' '}
                  <span className="font-extrabold text-[#6F4E37]">
                    Email: {createdConfirmation.ownerEmail}
                  </span>
                  , they can log in at{' '}
                  <a
                    href={createdConfirmation.staffPanelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#6F4E37] underline hover:text-[#2B2118]"
                  >
                    {createdConfirmation.staffPanelUrl}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                {copiedDetails ? (
                  <>
                    <Check size={13} className="text-[#4F8A5A]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-[#6F4E37]" />
                    <span>Copy Details</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCreatedConfirmation(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#81766D] hover:bg-white hover:text-[#241B15]"
                aria-label="Dismiss confirmation"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-[#C75C5C]/30 bg-[#C75C5C]/10 p-4 text-sm font-medium text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Statistics — Real Database Counts */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Cafés"
            value={stats.totalCafes.toLocaleString('en-IN')}
            subtitle={`${stats.totalBranches} registered branch locations`}
            icon={Store}
            tone="coffee"
            loading={loading}
          />
          <StatCard
            title="Active Cafés"
            value={stats.activeCafes.toLocaleString('en-IN')}
            badge={stats.activeCafes > 0 ? 'ACTIVE' : undefined}
            subtitle="Operational cafés accepting orders"
            icon={CheckCircle2}
            tone="success"
            loading={loading}
          />
          <StatCard
            title="Inactive Cafés"
            value={stats.suspendedCafes.toLocaleString('en-IN')}
            subtitle="Paused or deactivated café accounts"
            icon={Ban}
            tone="accent"
            loading={loading}
          />
          <StatCard
            title="Total Café Admins"
            value={stats.totalAdmins.toLocaleString('en-IN')}
            subtitle={`${stats.totalStaff.toLocaleString('en-IN')} total staff & team accounts`}
            icon={ShieldCheck}
            tone="dark"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString('en-IN')}
            subtitle="Orders processed across all cafés"
            icon={ShoppingBag}
            tone="accent"
            loading={loading}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            subtitle="Total billed revenue across cafés"
            icon={IndianRupee}
            tone="coffee"
            loading={loading}
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString('en-IN')}
            subtitle="Registered customers across all cafés"
            icon={Users}
            tone="success"
            loading={loading}
          />
        </div>
      </section>

      {/* Quick Actions Bar */}
      <section className="card bg-gradient-to-r from-[#6F4E37]/[0.05] via-white to-[#C98A5B]/[0.08] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#241B15]">Quick Actions</h2>
              <p className="text-xs text-[#81766D]">
                Onboard a new café tenant, manage subscription tiers, or filter licenses
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn-primary text-xs px-3.5 py-2"
            >
              <Plus size={14} />
              <span>+ Create Café</span>
            </button>
            <Link to="/dashboard/plans" className="btn-secondary text-xs px-3.5 py-2">
              <CreditCard size={14} className="text-[#6F4E37]" />
              <span>+ Add / Edit Plans</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('active')
                document
                  .getElementById('tenants-table-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              <CheckCircle2 size={14} className="text-[#4F8A5A]" />
              <span>Active Cafés ({stats.activeCafes})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('suspended')
                document
                  .getElementById('tenants-table-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              <Building2 size={14} className="text-[#C98A5B]" />
              <span>Suspended ({stats.suspendedCafes})</span>
            </button>
            <button
              type="button"
              onClick={() => handleSendSalesReport('daily')}
              disabled={Boolean(sendingReportType)}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              <Mail size={14} className="text-[#6F4E37]" />
              <span>
                {sendingReportType === 'daily'
                  ? 'Sending Daily Report...'
                  : 'Send Daily Report'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSendSalesReport('monthly')}
              disabled={Boolean(sendingReportType)}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              <Send size={14} className="text-[#6F4E37]" />
              <span>
                {sendingReportType === 'monthly'
                  ? 'Sending Monthly Report...'
                  : 'Send Monthly Report'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setPlanFilter('all')
                setSearch('')
              }}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              <Layers size={14} className="text-[#6F4E37]" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Analytics: Sales & Orders Overview */}
      <section className="card p-6">
        <div className="flex flex-col gap-4 border-b border-[#F7F5F2] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#6F4E37]" />
              <h2 className="text-base font-bold text-[#241B15]">Sales &amp; Orders Overview</h2>
            </div>
            <p className="mt-0.5 text-xs text-[#81766D]">
              Real revenue and order volume comparison across registered café tenants
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-[#E8E1DA] bg-[#F7F5F2] p-1">
              {[
                { id: 'revenue', label: 'Revenue (₹)' },
                { id: 'orders', label: 'Orders' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setChartMetric(m.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    chartMetric === m.id
                      ? 'bg-[#6F4E37] text-white shadow-2xs'
                      : 'text-[#81766D] hover:text-[#241B15]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-xl border border-[#E8E1DA] bg-[#F7F5F2] p-1">
              {[
                { id: 'all', label: 'All Cafés' },
                { id: 'active', label: 'Active Only' },
                { id: 'pro', label: 'Pro Tier' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setChartScope(s.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    chartScope === s.id
                      ? 'bg-white text-[#241B15] shadow-2xs font-bold'
                      : 'text-[#81766D] hover:text-[#241B15]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingState message="Calculating real café revenue & order metrics..." rows={2} />
          </div>
        ) : chartItems.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={TrendingUp}
              title="No café metrics for this filter"
              description="Switch the filter tab above or register café accounts to view comparative analytics."
            />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {chartItems.map((cafe) => {
              const val =
                chartMetric === 'revenue'
                  ? Number(cafe.totalRevenue) || 0
                  : Number(cafe.totalOrders) || 0
              const pct = Math.max(6, Math.round((val / maxChartValue) * 100))

              return (
                <div key={cafe._id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-[#241B15] truncate">{cafe.name}</span>
                      <StatusBadge status={cafe.plan || 'trial'} />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[#81766D]">
                        {Number(cafe.totalOrders || 0).toLocaleString('en-IN')} orders
                      </span>
                      <span className="font-extrabold text-[#6F4E37]">
                        {formatCurrency(cafe.totalRevenue || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-[#F7F5F2] border border-[#E8E1DA]/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#6F4E37] to-[#C98A5B] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Second Section: Left (Top Performing Cafés) + Right (Status & Plan Breakdown) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card flex flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-[#F7F5F2] pb-3.5">
              <div className="flex items-center gap-2">
                <Coffee size={18} className="text-[#6F4E37]" />
                <div>
                  <h2 className="text-base font-bold text-[#241B15]">Top Performing Cafés</h2>
                  <p className="text-xs text-[#81766D]">Ranked by real billed revenue &amp; order volume</p>
                </div>
              </div>
              <span className="badge-coffee">Live Ranking</span>
            </div>

            {loading ? (
              <LoadingState message="Loading top cafés..." rows={3} />
            ) : topPerformingCafes.length === 0 ? (
              <EmptyState
                icon={Coffee}
                title="No cafés registered yet"
                description="Once cafés start billing orders, their performance ranking will appear here."
              />
            ) : (
              <div className="divide-y divide-[#F7F5F2]">
                {topPerformingCafes.map((cafe, idx) => (
                  <div
                    key={cafe._id}
                    className="flex items-center justify-between gap-4 py-3.5"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F5F2] border border-[#E8E1DA] text-xs font-extrabold text-[#6F4E37]">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/dashboard/restaurants/${cafe._id}`}
                            className="truncate text-sm font-bold text-[#241B15] hover:text-[#6F4E37] transition-colors"
                          >
                            {cafe.name}
                          </Link>
                          <StatusBadge status={cafe.plan || 'trial'} />
                        </div>
                        <p className="mt-0.5 text-xs text-[#81766D] truncate">
                          {Number(cafe.totalOrders || 0).toLocaleString('en-IN')} orders ·{' '}
                          {cafe.branches?.length ?? cafe.branchCount ?? 0} branches ·{' '}
                          {cafe.staffCount || 0} staff
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-[#6F4E37]">
                        {formatCurrency(cafe.totalRevenue || 0)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedTenant(cafe)}
                        className="mt-0.5 text-[11px] font-semibold text-[#81766D] hover:text-[#241B15]"
                      >
                        Inspect →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card flex flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-[#F7F5F2] pb-3.5">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#C98A5B]" />
                <div>
                  <h2 className="text-base font-bold text-[#241B15]">License &amp; Tier Breakdown</h2>
                  <p className="text-xs text-[#81766D]">Distribution of tenant statuses and subscription plans</p>
                </div>
              </div>
              <Link
                to="/dashboard/plans"
                className="text-xs font-semibold text-[#6F4E37] hover:underline"
              >
                View Plans →
              </Link>
            </div>

            <div className="space-y-4 pt-1">
              {[
                {
                  label: 'Active Café Licenses',
                  count: stats.activeCafes,
                  total: stats.totalCafes,
                  barColor: 'bg-[#4F8A5A]',
                },
                {
                  label: 'Suspended Café Licenses',
                  count: stats.suspendedCafes,
                  total: stats.totalCafes,
                  barColor: 'bg-[#C75C5C]',
                },
                {
                  label: 'Pro Tier Subscriptions',
                  count: stats.proCount,
                  total: stats.totalCafes,
                  barColor: 'bg-[#6F4E37]',
                },
                {
                  label: 'Basic Tier Subscriptions',
                  count: stats.basicCount,
                  total: stats.totalCafes,
                  barColor: 'bg-[#D99A5B]',
                },
                {
                  label: 'Trial Tier Accounts',
                  count: stats.trialCount,
                  total: stats.totalCafes,
                  barColor: 'bg-[#81766D]',
                },
              ].map((row) => {
                const pct =
                  row.total > 0 ? Math.round((row.count / row.total) * 100) : 0
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#241B15]">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#241B15]">{row.count}</span>
                        <span className="text-[#81766D]">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F7F5F2]">
                      <div
                        className={`h-full rounded-full ${row.barColor} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/70 px-4 py-3 text-xs">
            <span className="font-semibold text-[#81766D]">
              Defined Subscription Tiers in Catalog
            </span>
            <span className="font-extrabold text-[#241B15]">{plans.length} Plans</span>
          </div>
        </section>
      </div>

      {/* Café Accounts Directory Table */}
      <section id="tenants-table-section" className="card overflow-hidden p-0">
        <div className="border-b border-[#E8E1DA] p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#241B15]">Café Accounts Directory</h2>
              <p className="text-xs text-[#81766D]">
                Click any café account to open its quick-inspection drawer or manage its subscription license
              </p>
            </div>
            <span className="badge-neutral self-start sm:self-auto">
              Showing {filteredRestaurants.length} of {restaurants.length} cafés
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-[#E8E1DA] bg-[#F7F5F2] p-1">
                {[
                  { id: 'all', label: `All (${stats.totalCafes})` },
                  { id: 'active', label: `Active (${stats.activeCafes})` },
                  { id: 'suspended', label: `Suspended (${stats.suspendedCafes})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      statusFilter === tab.id
                        ? 'bg-white text-[#6F4E37] shadow-2xs font-bold'
                        : 'text-[#81766D] hover:text-[#241B15]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="inline-flex rounded-xl border border-[#E8E1DA] bg-[#F7F5F2] p-1">
                {['all', 'trial', 'basic', 'pro'].map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setPlanFilter(plan)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                      planFilter === plan
                        ? 'bg-[#6F4E37] text-white shadow-2xs'
                        : 'text-[#81766D] hover:text-[#241B15]'
                    }`}
                  >
                    {plan === 'all' ? 'All Plans' : plan}
                  </button>
                ))}
              </div>
            </div>

            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search café name, owner, or email..."
              className="w-full lg:w-72"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingState message="Loading café accounts directory..." rows={4} />
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Store}
              title="No café accounts match your filters"
              description={
                search
                  ? `No café tenants matched "${search}". Try clearing your search query.`
                  : 'Registered café accounts will appear here.'
              }
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch('')
                setStatusFilter('all')
                setPlanFilter('all')
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8E1DA] bg-[#F7F5F2] text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <th className="px-6 py-3.5">Café ID</th>
                  <th className="px-6 py-3.5">Café &amp; Owner</th>
                  <th className="px-6 py-3.5">Branches &amp; Staff</th>
                  <th className="px-6 py-3.5">Orders</th>
                  <th className="px-6 py-3.5">Revenue</th>
                  <th className="px-6 py-3.5">Plan Tier</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F5F2]">
                {filteredRestaurants.map((restaurant) => (
                  <tr
                    key={restaurant._id}
                    onClick={() => setSelectedTenant(restaurant)}
                    className="cursor-pointer transition-colors hover:bg-[#F7F5F2]/70"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-[#6F4E37]">
                      #{String(restaurant._id || '').slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F5F2] border border-[#E8E1DA] text-[#6F4E37]">
                          <Store size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#241B15] truncate">{restaurant.name}</p>
                          <p className="text-xs text-[#81766D] truncate">
                            {restaurant.owner?.name || 'Owner'} ·{' '}
                            {restaurant.owner?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#81766D]">
                      <span className="font-semibold text-[#241B15]">
                        {restaurant.branches?.length ?? restaurant.branchCount ?? 0}
                      </span>{' '}
                      branches ·{' '}
                      <span className="font-semibold text-[#241B15]">
                        {restaurant.staffCount || 0}
                      </span>{' '}
                      staff
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#241B15]">
                      {Number(restaurant.totalOrders || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[#6F4E37]">
                      {formatCurrency(restaurant.totalRevenue || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={restaurant.plan || 'trial'}
                        label={`${restaurant.plan || 'trial'} plan`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={restaurant.isActive ? 'active' : 'suspended'}
                        label={restaurant.isActive ? 'Active' : 'Suspended'}
                      />
                    </td>
                    <td className="px-6 py-4 text-xs text-[#81766D]">
                      {formatDate(restaurant.createdAt)}
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTenant(restaurant)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#E8E1DA] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#241B15] hover:bg-[#F7F5F2] transition-colors"
                          title="Quick Inspect Drawer"
                        >
                          <Eye size={13} className="text-[#6F4E37]" />
                          <span>View</span>
                        </button>

                        <Link
                          to={`/dashboard/restaurants/${restaurant._id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#6F4E37]/10 px-2.5 py-1.5 text-xs font-semibold text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white transition-colors"
                          title="Open Full Details Page"
                        >
                          <span>Manage</span>
                          <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Slide-Over Tenant Quick Detail Drawer */}
      <Drawer
        open={Boolean(selectedTenant)}
        onClose={() => setSelectedTenant(null)}
        title={selectedTenant?.name || 'Café Account'}
        subtitle={`Tenant ID: ${selectedTenant?._id || ''}`}
      >
        {selectedTenant && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-[#E8E1DA] bg-[#F7F5F2]/70 p-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81766D]">
                  License Status
                </span>
                <div className="mt-1">
                  <StatusBadge
                    status={selectedTenant.isActive ? 'active' : 'suspended'}
                    label={selectedTenant.isActive ? 'Active License' : 'Suspended'}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmToggleTenant(selectedTenant)}
                disabled={actionLoading}
                className={
                  selectedTenant.isActive
                    ? 'btn-danger text-xs px-3.5 py-2'
                    : 'btn-primary text-xs px-3.5 py-2'
                }
              >
                {selectedTenant.isActive ? 'Suspend License' : 'Reactivate License'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#E8E1DA] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81766D]">
                  Billed Revenue
                </span>
                <p className="mt-1 text-xl font-extrabold text-[#6F4E37]">
                  {formatCurrency(selectedTenant.totalRevenue || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E8E1DA] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81766D]">
                  Total Orders
                </span>
                <p className="mt-1 text-xl font-extrabold text-[#241B15]">
                  {Number(selectedTenant.totalOrders || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E8E1DA] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81766D]">
                  Branches
                </span>
                <p className="mt-1 text-xl font-extrabold text-[#241B15]">
                  {selectedTenant.branches?.length ?? selectedTenant.branchCount ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E8E1DA] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#81766D]">
                  Staff Accounts
                </span>
                <p className="mt-1 text-xl font-extrabold text-[#241B15]">
                  {selectedTenant.staffCount || 0}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8E1DA] p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#241B15] border-b border-[#F7F5F2] pb-2.5">
                Owner &amp; Subscription Tier
              </h3>

              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#81766D]">
                    Owner Name
                  </span>
                  <p className="mt-0.5 font-bold text-[#241B15]">
                    {selectedTenant.owner?.name || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#81766D]">
                    Owner Email
                  </span>
                  <p className="mt-0.5 font-bold text-[#241B15] truncate">
                    {selectedTenant.owner?.email || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#81766D] mb-1.5">
                  Change Subscription Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {planOptions.map((tier) => {
                    const isCurrent = (selectedTenant.plan || 'trial') === tier
                    return (
                      <button
                        key={tier}
                        type="button"
                        disabled={actionLoading || isCurrent}
                        onClick={() => handlePlanChange(selectedTenant._id, tier)}
                        className={`rounded-xl border py-2 text-xs font-bold uppercase transition-all ${
                          isCurrent
                            ? 'border-[#6F4E37] bg-[#6F4E37] text-white shadow-2xs'
                            : 'border-[#E8E1DA] bg-[#F7F5F2] text-[#81766D] hover:border-[#6F4E37]/40 hover:text-[#241B15]'
                        }`}
                      >
                        {tier}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8E1DA] p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#241B15]">
                Branch Locations ({selectedTenant.branches?.length || 0})
              </h3>
              {selectedTenant.branches?.length > 0 ? (
                <div className="space-y-2">
                  {selectedTenant.branches.map((b) => (
                    <div
                      key={b._id}
                      className="rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-3 text-xs"
                    >
                      <p className="font-bold text-[#241B15]">{b.name || 'Main Branch'}</p>
                      <p className="mt-0.5 text-[#81766D]">
                        {b.address || 'No physical address listed'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#81766D]">No branch records found.</p>
              )}
            </div>

            <div className="pt-2">
              <Link
                to={`/dashboard/restaurants/${selectedTenant._id}`}
                onClick={() => setSelectedTenant(null)}
                className="btn-primary w-full justify-center"
              >
                <span>Open Full Tenant Workspace</span>
                <ExternalLink size={15} />
              </Link>
            </div>
          </div>
        )}
      </Drawer>

      {/* Multi-Section Create Café + Admin Modal */}
      <CreateCafeModal
        open={showCreateModal}
        onClose={() => !creating && setShowCreateModal(false)}
        onSubmit={handleCreateRestaurant}
        plans={plans}
        loading={creating}
        mode="create"
      />

      <ConfirmDialog
        open={Boolean(confirmToggleTenant)}
        onClose={() => setConfirmToggleTenant(null)}
        onConfirm={() => handleToggleStatus(confirmToggleTenant)}
        loading={actionLoading}
        variant={confirmToggleTenant?.isActive ? 'danger' : 'primary'}
        title={
          confirmToggleTenant?.isActive
            ? `Suspend ${confirmToggleTenant?.name}?`
            : `Reactivate ${confirmToggleTenant?.name}?`
        }
        description={
          confirmToggleTenant?.isActive
            ? 'Suspending this café tenant will immediately block staff logins until reactivated.'
            : 'Reactivating this café tenant will restore full platform access for its owner and staff.'
        }
        confirmLabel={
          confirmToggleTenant?.isActive ? 'Suspend Tenant' : 'Reactivate Tenant'
        }
      />
    </div>
  )
}

export default Dashboard
