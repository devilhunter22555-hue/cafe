import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  Store,
  Trash2,
  User,
} from 'lucide-react'
import {
  createCafe,
  deleteCafe,
  getCafes,
  getPlans,
  resetCafeAdminPassword,
  updateCafe,
  updateCafeStatus,
} from '../api/adminApi.js'
import {
  CreateCafeModal,
  ResetCafeAdminPasswordModal,
} from '../components/CreateCafeModal.jsx'
import {
  ConfirmDialog,
  EmptyState,
  LoadingState,
  SearchBar,
  StatCard,
  StatusBadge,
  Toast,
} from '../components/ui/AdminUI.jsx'

const staffPanelUrl =
  import.meta.env.VITE_STAFF_PANEL_URL || 'http://localhost:5173/login'

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

function CafeManagement() {
  const [cafes, setCafes] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  // Search, Filter & Pagination
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals & Confirmations
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCafe, setEditingCafe] = useState(null)
  const [savingCafe, setSavingCafe] = useState(false)
  const [createdBanner, setCreatedBanner] = useState(null)
  const [copiedDetails, setCopiedDetails] = useState(false)

  const [confirmToggleCafe, setConfirmToggleCafe] = useState(null)
  const [confirmDeleteCafe, setConfirmDeleteCafe] = useState(null)
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadCafes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const [cafesRes, plansRes] = await Promise.all([
        getCafes(),
        getPlans().catch(() => ({ data: [] })),
      ])
      setCafes(cafesRes.data || [])
      setPlans(plansRes.data || [])
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Unable to load cafés directory.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadCafes(false)
  }, [loadCafes])

  const stats = useMemo(() => {
    const total = cafes.length
    const active = cafes.filter((c) => c.isActive).length
    const inactive = total - active
    const totalAdmins = cafes.reduce(
      (sum, c) => sum + (Number(c.adminCount) || (c.owner ? 1 : 0)),
      0
    )
    return { total, active, inactive, totalAdmins }
  }, [cafes])

  const filteredCafes = useMemo(() => {
    return cafes.filter((c) => {
      if (statusFilter === 'active' && !c.isActive) return false
      if (statusFilter === 'inactive' && c.isActive) return false

      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const nameMatch = c.name?.toLowerCase().includes(q)
        const ownerMatch =
          c.ownerName?.toLowerCase().includes(q) ||
          c.owner?.name?.toLowerCase().includes(q) ||
          c.admin?.name?.toLowerCase().includes(q)
        const emailMatch =
          c.email?.toLowerCase().includes(q) ||
          c.owner?.email?.toLowerCase().includes(q) ||
          c.admin?.email?.toLowerCase().includes(q)
        const phoneMatch =
          c.phone?.toLowerCase().includes(q) ||
          c.owner?.phone?.toLowerCase().includes(q)
        const cityMatch = c.city?.toLowerCase().includes(q)

        if (!nameMatch && !ownerMatch && !emailMatch && !phoneMatch && !cityMatch) {
          return false
        }
      }
      return true
    })
  }, [cafes, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredCafes.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedCafes = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCafes.slice(start, start + pageSize)
  }, [filteredCafes, currentPage, pageSize])

  const handleCreateOrEditSubmit = async (payload) => {
    setSavingCafe(true)
    try {
      if (editingCafe) {
        await updateCafe(editingCafe._id, payload)
        setToast({
          message: `Café "${payload.cafeName}" updated successfully.`,
          type: 'success',
        })
        setEditingCafe(null)
      } else {
        const response = await createCafe(payload)
        const createdAdminEmail =
          response?.data?.admin?.email ||
          response?.data?.owner?.email ||
          payload.adminEmail
        const createdCafeName =
          response?.data?.cafe?.name ||
          response?.data?.restaurant?.name ||
          payload.cafeName

        setShowCreateModal(false)
        setCreatedBanner({
          cafeName: createdCafeName,
          adminName:
            response?.data?.admin?.name ||
            response?.data?.owner?.name ||
            payload.adminName,
          adminEmail: createdAdminEmail,
          plan: payload.plan,
          staffPanelUrl,
        })
        setToast({
          message: `Café "${createdCafeName}" and Admin account created!`,
          type: 'success',
        })
      }
      await loadCafes(true)
    } finally {
      setSavingCafe(false)
    }
  }

  const handleToggleStatusConfirm = async () => {
    if (!confirmToggleCafe) return
    setActionLoading(true)
    try {
      const nextStatus = !confirmToggleCafe.isActive
      await updateCafeStatus(confirmToggleCafe._id, nextStatus)
      setToast({
        message: nextStatus
          ? `Café "${confirmToggleCafe.name}" activated.`
          : `Café "${confirmToggleCafe.name}" deactivated.`,
        type: 'success',
      })
      setConfirmToggleCafe(null)
      await loadCafes(true)
    } catch (err) {
      setToast({
        message:
          err?.response?.data?.message || 'Unable to update café status.',
        type: 'error',
      })
      setConfirmToggleCafe(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteCafe) return
    setActionLoading(true)
    try {
      await deleteCafe(confirmDeleteCafe._id)
      setToast({
        message: `Café "${confirmDeleteCafe.name}" deleted.`,
        type: 'success',
      })
      setConfirmDeleteCafe(null)
      await loadCafes(true)
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || 'Unable to delete café.',
        type: 'error',
      })
      setConfirmDeleteCafe(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (newPassword) => {
    if (!resetPasswordTarget) return
    setActionLoading(true)
    try {
      const res = await resetCafeAdminPassword(resetPasswordTarget._id, newPassword)
      setToast({
        message:
          res.message ||
          `Admin password reset for "${resetPasswordTarget.name}".`,
        type: 'success',
      })
      setResetPasswordTarget(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCopyCredentials = () => {
    if (!createdBanner) return
    const text = `Café Account Created! Café: ${createdBanner.cafeName} | Admin Email: ${createdBanner.adminEmail} | Login URL: ${createdBanner.staffPanelUrl}`
    navigator.clipboard?.writeText(text)
    setCopiedDetails(true)
    setTimeout(() => setCopiedDetails(false), 2500)
  }

  return (
    <div className="space-y-7">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-xs">
              <Store size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#241B15]">
                Café Management
              </h1>
              <p className="text-xs sm:text-sm text-[#81766D]">
                Create, configure, activate/deactivate, and manage isolated multi-tenant café accounts
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadCafes(true)}
            disabled={loading || refreshing}
            className="btn-secondary text-xs px-3.5 py-2.5"
          >
            <RefreshCw
              size={14}
              className={refreshing ? 'animate-spin text-[#6F4E37]' : 'text-[#6F4E37]'}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCafe(null)
              setShowCreateModal(true)
            }}
            className="btn-primary text-xs px-4 py-2.5"
          >
            <Plus size={16} />
            <span>+ Create Café</span>
          </button>
        </div>
      </div>

      {/* Created Café Admin Credentials Banner */}
      {createdBanner && (
        <div className="card border-[#4F8A5A]/40 bg-[#4F8A5A]/[0.07] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F8A5A] text-white">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#241B15]">
                  {createdBanner.cafeName} &amp; Admin Account Created!
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#241B15]">
                  Admin Login Email:{' '}
                  <strong className="text-[#6F4E37]">{createdBanner.adminEmail}</strong> · Portal:{' '}
                  <a
                    href={createdBanner.staffPanelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#6F4E37] underline"
                  >
                    {createdBanner.staffPanelUrl}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                    <span>Copy Login Info</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCreatedBanner(null)}
                className="text-xs font-semibold text-[#81766D] hover:text-[#241B15] px-2"
              >
                Dismiss
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

      {/* 4 Top Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cafés"
          value={stats.total}
          subtitle="All onboarded café accounts"
          icon={Store}
          tone="coffee"
          loading={loading}
        />
        <StatCard
          title="Active Cafés"
          value={stats.active}
          badge={stats.active > 0 ? 'ACTIVE' : undefined}
          subtitle="Operational café tenants"
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <StatCard
          title="Inactive Cafés"
          value={stats.inactive}
          subtitle="Deactivated / suspended cafés"
          icon={Building2}
          tone="danger"
          loading={loading}
        />
        <StatCard
          title="Total Café Admins"
          value={stats.totalAdmins}
          subtitle="Assigned primary café admins"
          icon={ShieldCheck}
          tone="dark"
          loading={loading}
        />
      </div>

      {/* Search & Status Filter Bar */}
      <div className="card flex flex-col gap-3.5 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex flex-wrap rounded-xl border border-[#E8E1DA] bg-[#F7F5F2] p-1">
          {[
            { id: 'all', label: `All (${stats.total})` },
            { id: 'active', label: `Active (${stats.active})` },
            { id: 'inactive', label: `Inactive (${stats.inactive})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id)
                setPage(1)
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-[#6F4E37] shadow-2xs font-bold'
                  : 'text-[#81766D] hover:text-[#241B15]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          placeholder="Search by café name, owner, email, phone, or city..."
          className="w-full lg:w-96"
        />
      </div>

      {/* Cafés Table / Mobile Cards */}
      {loading ? (
        <LoadingState message="Loading cafés directory..." rows={5} />
      ) : filteredCafes.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No cafés match your criteria"
          description={
            search || statusFilter !== 'all'
              ? 'Try clearing your search query or switching the status filter.'
              : 'Get started by creating your first multi-tenant café and admin account.'
          }
          actionLabel="+ Create Café"
          onAction={() => {
            setEditingCafe(null)
            setShowCreateModal(true)
          }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E1DA] bg-[#F7F5F2]/70 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <th className="py-3.5 pl-5 pr-3">Café Name</th>
                  <th className="px-3 py-3.5">Owner / Admin</th>
                  <th className="px-3 py-3.5">Email</th>
                  <th className="px-3 py-3.5">Phone</th>
                  <th className="px-3 py-3.5">City</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">Created Date</th>
                  <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F5F2] text-xs sm:text-sm">
                {paginatedCafes.map((cafe) => {
                  const ownerDisplay =
                    cafe.ownerName || cafe.owner?.name || cafe.admin?.name || 'Unassigned'
                  const emailDisplay =
                    cafe.email || cafe.owner?.email || cafe.admin?.email || '—'
                  const phoneDisplay =
                    cafe.phone || cafe.owner?.phone || cafe.admin?.phone || '—'
                  const cityDisplay = cafe.city || '—'

                  return (
                    <tr
                      key={cafe._id}
                      className="transition-colors hover:bg-[#F7F5F2]/50"
                    >
                      <td className="py-4 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          {cafe.logo ? (
                            <img
                              src={cafe.logo}
                              alt={cafe.name}
                              className="h-10 w-10 shrink-0 rounded-xl border border-[#E8E1DA] object-cover bg-white"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6F4E37]/12 text-xs font-extrabold text-[#6F4E37]">
                              {cafe.name?.slice(0, 2).toUpperCase() || 'CF'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/dashboard/cafes/${cafe._id}`}
                              className="font-extrabold text-[#241B15] hover:text-[#6F4E37] truncate block"
                            >
                              {cafe.name}
                            </Link>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#81766D]">
                              <span className="uppercase font-bold text-[#6F4E37]">
                                {cafe.plan || 'trial'}
                              </span>
                              <span>•</span>
                              <span>{cafe.totalOrders || 0} orders</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-[#241B15]">
                          <User size={13} className="text-[#6F4E37] shrink-0" />
                          <span className="truncate max-w-[150px]">{ownerDisplay}</span>
                        </div>
                      </td>

                      <td className="px-3 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#81766D]">
                          <Mail size={13} className="text-[#C98A5B] shrink-0" />
                          <span className="truncate max-w-[180px]">{emailDisplay}</span>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-xs text-[#241B15] font-medium">
                        {phoneDisplay !== '—' ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={12} className="text-[#81766D]" />
                            {phoneDisplay}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-3 py-4 text-xs text-[#241B15]">
                        {cityDisplay !== '—' ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} className="text-[#C98A5B]" />
                            {cityDisplay}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <StatusBadge
                          status={cafe.isActive ? 'active' : 'inactive'}
                          label={cafe.isActive ? 'ACTIVE' : 'INACTIVE'}
                        />
                      </td>

                      <td className="px-3 py-4 text-xs text-[#81766D]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(cafe.createdAt)}
                        </span>
                      </td>

                      <td className="py-4 pl-3 pr-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            to={`/dashboard/cafes/${cafe._id}`}
                            title="View Café Details"
                            className="inline-flex items-center gap-1 rounded-xl border border-[#E8E1DA] bg-white px-2.5 py-1.5 text-xs font-bold text-[#241B15] hover:border-[#6F4E37] hover:text-[#6F4E37]"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setEditingCafe(cafe)}
                            title="Edit Café"
                            className="inline-flex items-center gap-1 rounded-xl border border-[#E8E1DA] bg-white px-2.5 py-1.5 text-xs font-bold text-[#241B15] hover:border-[#6F4E37] hover:text-[#6F4E37]"
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmToggleCafe(cafe)}
                            title={cafe.isActive ? 'Deactivate Café' : 'Activate Café'}
                            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                              cafe.isActive
                                ? 'border-[#C75C5C]/30 bg-[#C75C5C]/10 text-[#C75C5C] hover:bg-[#C75C5C] hover:text-white'
                                : 'border-[#4F8A5A]/30 bg-[#4F8A5A]/10 text-[#4F8A5A] hover:bg-[#4F8A5A] hover:text-white'
                            }`}
                          >
                            <Power size={13} />
                            <span>{cafe.isActive ? 'Deactivate' : 'Activate'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setResetPasswordTarget(cafe)}
                            title="Reset Café Admin Password"
                            className="inline-flex items-center justify-center rounded-xl border border-[#E8E1DA] bg-white p-1.5 text-[#81766D] hover:border-[#6F4E37] hover:text-[#6F4E37]"
                          >
                            <KeyRound size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCafe(cafe)}
                            title="Delete Café"
                            className="inline-flex items-center justify-center rounded-xl border border-[#E8E1DA] bg-white p-1.5 text-[#81766D] hover:border-[#C75C5C]/40 hover:bg-[#C75C5C]/10 hover:text-[#C75C5C]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col gap-3 border-t border-[#E8E1DA] bg-[#F7F5F2]/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between text-xs text-[#81766D]">
            <div className="flex items-center gap-2">
              <span>
                Showing{' '}
                <strong className="text-[#241B15]">
                  {(currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-[#241B15]">
                  {Math.min(currentPage * pageSize, filteredCafes.length)}
                </strong>{' '}
                of <strong className="text-[#241B15]">{filteredCafes.length}</strong> cafés
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="rounded-lg border border-[#E8E1DA] bg-white px-2 py-1 text-xs font-semibold text-[#241B15]"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E8E1DA] bg-white px-2.5 py-1.5 font-semibold text-[#241B15] disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span className="px-2 font-bold text-[#241B15]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E8E1DA] bg-white px-2.5 py-1.5 font-semibold text-[#241B15] disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Café Multi-Section Modal */}
      <CreateCafeModal
        open={showCreateModal || Boolean(editingCafe)}
        onClose={() => {
          setShowCreateModal(false)
          setEditingCafe(null)
        }}
        onSubmit={handleCreateOrEditSubmit}
        plans={plans}
        loading={savingCafe}
        mode={editingCafe ? 'edit' : 'create'}
        initialCafe={editingCafe}
      />

      {/* Reset Admin Password Modal */}
      <ResetCafeAdminPasswordModal
        open={Boolean(resetPasswordTarget)}
        onClose={() => setResetPasswordTarget(null)}
        admin={resetPasswordTarget?.admin || resetPasswordTarget?.owner}
        cafeName={resetPasswordTarget?.name}
        onSubmit={handleResetPasswordSubmit}
        loading={actionLoading}
      />

      {/* Activate / Deactivate Café Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmToggleCafe)}
        onClose={() => setConfirmToggleCafe(null)}
        onConfirm={handleToggleStatusConfirm}
        loading={actionLoading}
        variant={confirmToggleCafe?.isActive ? 'danger' : 'primary'}
        title={
          confirmToggleCafe?.isActive
            ? `Deactivate "${confirmToggleCafe?.name}"?`
            : `Activate "${confirmToggleCafe?.name}"?`
        }
        description={
          confirmToggleCafe?.isActive
            ? 'Deactivating this café will immediately block its Café Admin, Staff, and Customer QR ordering from using the system. All café data is safely preserved.'
            : 'Activating this café restores full access for its Café Admin, Staff, and Customer QR ordering.'
        }
        confirmLabel={confirmToggleCafe?.isActive ? 'Deactivate Café' : 'Activate Café'}
      />

      {/* Delete Café Confirmation */}
      <ConfirmDialog
        open={Boolean(confirmDeleteCafe)}
        onClose={() => setConfirmDeleteCafe(null)}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
        variant="danger"
        title={`Delete "${confirmDeleteCafe?.name}" Permanently?`}
        description="This action permanently deletes the café tenant and its associated records. If you only want to block access without losing data, use Deactivate instead."
        confirmLabel="Delete Café"
      />
    </div>
  )
}

export default CafeManagement
