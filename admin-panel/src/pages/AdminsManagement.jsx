import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Power,
  RefreshCw,
  ShieldCheck,
  Store,
  UserCheck,
  Users,
} from 'lucide-react'
import {
  getAllCafeAdmins,
  resetAdminPasswordById,
  updateAdminById,
  updateAdminStatusById,
} from '../api/adminApi.js'
import {
  EditCafeAdminModal,
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

function AdminsManagement() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [editingAdmin, setEditingAdmin] = useState(null)
  const [resettingAdmin, setResettingAdmin] = useState(null)
  const [confirmToggleAdmin, setConfirmToggleAdmin] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadAdmins = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const res = await getAllCafeAdmins()
      setAdmins(res.data || [])
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Unable to load café administrators.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadAdmins(false)
  }, [loadAdmins])

  const stats = useMemo(() => {
    const total = admins.length
    const active = admins.filter((a) => a.isActive !== false).length
    const inactive = total - active
    return { total, active, inactive }
  }, [admins])

  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const isActive = a.isActive !== false
      if (statusFilter === 'active' && !isActive) return false
      if (statusFilter === 'inactive' && isActive) return false

      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matchName = a.name?.toLowerCase().includes(q)
        const matchEmail = a.email?.toLowerCase().includes(q)
        const matchPhone = a.phone?.toLowerCase().includes(q)
        const matchCafe = a.cafe?.name?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone && !matchCafe) return false
      }
      return true
    })
  }, [admins, search, statusFilter])

  const handleSaveAdmin = async (payload) => {
    if (!editingAdmin) return
    setActionLoading(true)
    try {
      await updateAdminById(editingAdmin._id, payload)
      setToast({
        message: `Admin "${payload.name}" updated successfully.`,
        type: 'success',
      })
      setEditingAdmin(null)
      await loadAdmins(true)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleAdminStatus = async () => {
    if (!confirmToggleAdmin) return
    setActionLoading(true)
    try {
      const nextStatus = confirmToggleAdmin.isActive === false
      await updateAdminStatusById(confirmToggleAdmin._id, nextStatus)
      setToast({
        message: nextStatus
          ? `Admin "${confirmToggleAdmin.name}" activated.`
          : `Admin "${confirmToggleAdmin.name}" deactivated.`,
        type: 'success',
      })
      setConfirmToggleAdmin(null)
      await loadAdmins(true)
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || 'Unable to update admin status.',
        type: 'error',
      })
      setConfirmToggleAdmin(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetPassword = async (newPassword) => {
    if (!resettingAdmin) return
    setActionLoading(true)
    try {
      const res = await resetAdminPasswordById(resettingAdmin._id, newPassword)
      setToast({
        message: res.message || `Password reset for ${resettingAdmin.email}.`,
        type: 'success',
      })
      setResettingAdmin(null)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-7">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-xs">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#241B15]">
              Café Administrators
            </h1>
            <p className="text-xs sm:text-sm text-[#81766D]">
              Manage Café Admin accounts, contact details, account status, and password resets
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadAdmins(true)}
          disabled={loading || refreshing}
          className="btn-secondary text-xs px-3.5 py-2.5 self-start sm:self-auto"
        >
          <RefreshCw
            size={14}
            className={refreshing ? 'animate-spin text-[#6F4E37]' : 'text-[#6F4E37]'}
          />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-[#C75C5C]/30 bg-[#C75C5C]/10 p-4 text-sm font-medium text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Café Admins"
          value={stats.total}
          subtitle="Primary ADMIN accounts across cafés"
          icon={Users}
          tone="coffee"
          loading={loading}
        />
        <StatCard
          title="Active Admins"
          value={stats.active}
          badge={stats.active > 0 ? 'Enabled' : undefined}
          subtitle="Authorized to sign in to POS & Admin"
          icon={UserCheck}
          tone="success"
          loading={loading}
        />
        <StatCard
          title="Inactive Admins"
          value={stats.inactive}
          subtitle="Temporarily disabled admin accounts"
          icon={CheckCircle2}
          tone="danger"
          loading={loading}
        />
      </div>

      <div className="card flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-[#E8E1DA] bg-[#F7F5F2] p-1 self-start sm:self-auto">
          {[
            { id: 'all', label: `All (${stats.total})` },
            { id: 'active', label: `Active (${stats.active})` },
            { id: 'inactive', label: `Inactive (${stats.inactive})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
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
          onChange={setSearch}
          placeholder="Search admin name, email, phone, or café..."
          className="w-full sm:w-80"
        />
      </div>

      {loading ? (
        <LoadingState message="Loading café administrators..." rows={4} />
      ) : filteredAdmins.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No café administrators found"
          description="Create a new café in Café Management to automatically provision its Café Admin account."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E1DA] bg-[#F7F5F2]/70 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <th className="py-3.5 pl-5 pr-3">Admin Name</th>
                  <th className="px-3 py-3.5">Email &amp; Phone</th>
                  <th className="px-3 py-3.5">Assigned Café</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">Last Login</th>
                  <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F5F2] text-xs sm:text-sm">
                {filteredAdmins.map((adminItem) => (
                  <tr key={adminItem._id} className="hover:bg-[#F7F5F2]/50">
                    <td className="py-4 pl-5 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6F4E37]/12 text-xs font-extrabold text-[#6F4E37]">
                          {adminItem.name?.slice(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div>
                          <p className="font-bold text-[#241B15]">{adminItem.name}</p>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F4E37]">
                            Role: ADMIN
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <div className="space-y-1 text-xs">
                        <p className="flex items-center gap-1.5 font-medium text-[#241B15]">
                          <Mail size={12} className="text-[#C98A5B]" />
                          <span>{adminItem.email}</span>
                        </p>
                        {adminItem.phone && (
                          <p className="flex items-center gap-1.5 text-[#81766D]">
                            <Phone size={12} />
                            <span>{adminItem.phone}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      {adminItem.cafe ? (
                        <Link
                          to={`/dashboard/cafes/${adminItem.cafe._id}`}
                          className="inline-flex items-center gap-1.5 font-bold text-[#6F4E37] hover:underline"
                        >
                          <Store size={13} />
                          <span>{adminItem.cafe.name}</span>
                          <ExternalLink size={11} />
                        </Link>
                      ) : (
                        <span className="text-xs text-[#81766D]">Unlinked</span>
                      )}
                    </td>

                    <td className="px-3 py-4">
                      <StatusBadge
                        status={adminItem.isActive !== false ? 'active' : 'inactive'}
                        label={adminItem.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      />
                    </td>

                    <td className="px-3 py-4 text-xs text-[#81766D]">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {formatDateTime(adminItem.lastLoginAt)}
                      </span>
                    </td>

                    <td className="py-4 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingAdmin(adminItem)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#E8E1DA] bg-white px-2.5 py-1.5 text-xs font-bold text-[#241B15] hover:border-[#6F4E37] hover:text-[#6F4E37]"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setResettingAdmin(adminItem)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#E8E1DA] bg-white px-2.5 py-1.5 text-xs font-bold text-[#241B15] hover:border-[#6F4E37] hover:text-[#6F4E37]"
                        >
                          <KeyRound size={12} />
                          <span>Reset Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmToggleAdmin(adminItem)}
                          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                            adminItem.isActive !== false
                              ? 'border-[#C75C5C]/30 bg-[#C75C5C]/10 text-[#C75C5C] hover:bg-[#C75C5C] hover:text-white'
                              : 'border-[#4F8A5A]/30 bg-[#4F8A5A]/10 text-[#4F8A5A] hover:bg-[#4F8A5A] hover:text-white'
                          }`}
                        >
                          <Power size={12} />
                          <span>
                            {adminItem.isActive !== false ? 'Deactivate' : 'Activate'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EditCafeAdminModal
        open={Boolean(editingAdmin)}
        onClose={() => setEditingAdmin(null)}
        admin={editingAdmin}
        cafeName={editingAdmin?.cafe?.name}
        onSubmit={handleSaveAdmin}
        loading={actionLoading}
      />

      <ResetCafeAdminPasswordModal
        open={Boolean(resettingAdmin)}
        onClose={() => setResettingAdmin(null)}
        admin={resettingAdmin}
        cafeName={resettingAdmin?.cafe?.name}
        onSubmit={handleResetPassword}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={Boolean(confirmToggleAdmin)}
        onClose={() => setConfirmToggleAdmin(null)}
        onConfirm={handleToggleAdminStatus}
        loading={actionLoading}
        variant={confirmToggleAdmin?.isActive !== false ? 'danger' : 'primary'}
        title={
          confirmToggleAdmin?.isActive !== false
            ? `Deactivate Admin "${confirmToggleAdmin?.name}"?`
            : `Activate Admin "${confirmToggleAdmin?.name}"?`
        }
        description={
          confirmToggleAdmin?.isActive !== false
            ? 'This admin will no longer be able to sign in or access their café dashboard until reactivated.'
            : 'Reactivating this admin restores their access to manage their café.'
        }
        confirmLabel={
          confirmToggleAdmin?.isActive !== false ? 'Deactivate Admin' : 'Activate Admin'
        }
      />
    </div>
  )
}

export default AdminsManagement
