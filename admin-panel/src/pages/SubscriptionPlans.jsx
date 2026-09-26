import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Layers,
  LoaderCircle,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import { createPlan, deletePlan, getPlans, updatePlan } from '../api/adminApi.js'
import {
  ConfirmDialog,
  EmptyState,
  LoadingState,
  Modal,
  SearchBar,
  StatCard,
  StatusBadge,
  Toast,
} from '../components/ui/AdminUI.jsx'

const emptyForm = {
  name: '',
  price: '',
  maxBranches: '',
  maxStaff: '',
  features: '',
  isActive: true,
}

function SubscriptionPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getPlans()
      setPlans(response.data || [])
      setError('')
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message ||
          'Unable to load subscription plans.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleEdit = (plan) => {
    setEditingId(plan._id)
    setForm({
      name: plan.name || '',
      price: plan.price ?? '',
      maxBranches: plan.maxBranches ?? '',
      maxStaff: plan.maxStaff ?? '',
      features: (plan.features || []).join(', '),
      isActive: plan.isActive !== false,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        maxBranches: Number(form.maxBranches),
        maxStaff: Number(form.maxStaff),
        features: form.features
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        isActive: form.isActive,
      }

      if (
        !payload.name ||
        Number.isNaN(payload.price) ||
        Number.isNaN(payload.maxBranches) ||
        Number.isNaN(payload.maxStaff)
      ) {
        throw new Error('Please complete all required plan fields before saving.')
      }

      if (editingId) {
        const response = await updatePlan(editingId, payload)
        setPlans((current) =>
          current.map((plan) => (plan._id === editingId ? response.data : plan))
        )
        setToast({
          message: `Plan "${response.data.name}" updated successfully.`,
          type: 'success',
        })
      } else {
        const response = await createPlan(payload)
        setPlans((current) => [...current, response.data])
        setToast({
          message: `Plan "${response.data.name}" created successfully.`,
          type: 'success',
        })
      }

      resetForm()
      setIsModalOpen(false)
    } catch (submitError) {
      setToast({
        message:
          submitError.response?.data?.message ||
          submitError.message ||
          'Unable to save subscription plan.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeletePlan) return
    setSaving(true)

    try {
      await deletePlan(confirmDeletePlan._id)
      setPlans((current) =>
        current.filter((plan) => plan._id !== confirmDeletePlan._id)
      )
      setToast({
        message: `Plan "${confirmDeletePlan.name}" deleted.`,
        type: 'success',
      })
      if (editingId === confirmDeletePlan._id) resetForm()
      setConfirmDeletePlan(null)
    } catch (deleteError) {
      setToast({
        message:
          deleteError.response?.data?.message || 'Unable to delete plan.',
        type: 'error',
      })
      setConfirmDeletePlan(null)
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const total = plans.length
    const active = plans.filter((p) => p.isActive !== false).length
    const avgPrice =
      total > 0
        ? Math.round(
            plans.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / total
          )
        : 0
    return { total, active, avgPrice }
  }, [plans])

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const isPlanActive = p.isActive !== false
      if (statusFilter === 'active' && !isPlanActive) return false
      if (statusFilter === 'disabled' && isPlanActive) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = p.name?.toLowerCase().includes(q)
        const matchFeat = (p.features || []).some((f) =>
          f.toLowerCase().includes(q)
        )
        if (!matchName && !matchFeat) return false
      }
      return true
    })
  }, [plans, search, statusFilter])

  return (
    <div className="space-y-8">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6F4E37]/10 text-[#6F4E37]">
              <CreditCard size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#241B15]">
                Subscription Plans &amp; Tiers
              </h1>
              <p className="text-xs text-[#81766D]">
                Configure SaaS pricing tiers, branch &amp; staff quotas, and feature entitlements
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create Plan Tier</span>
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
          title="Defined Tiers"
          value={stats.total}
          subtitle="Total subscription plans in catalog"
          icon={Layers}
          tone="coffee"
          loading={loading}
        />
        <StatCard
          title="Active for Signups"
          value={stats.active}
          badge={stats.active > 0 ? 'Enabled' : undefined}
          subtitle="Available for café tenant assignment"
          icon={CheckCircle2}
          tone="success"
          loading={loading}
        />
        <StatCard
          title="Average Monthly Fee"
          value={`₹${stats.avgPrice.toLocaleString('en-IN')}`}
          subtitle="Recurring monthly billing cycle"
          icon={IndianRupee}
          tone="accent"
          loading={loading}
        />
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-[#E8E1DA] bg-[#F7F5F2] p-1 self-start sm:self-auto">
          {[
            { id: 'all', label: `All Plans (${stats.total})` },
            { id: 'active', label: `Active (${stats.active})` },
            { id: 'disabled', label: `Disabled (${stats.total - stats.active})` },
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
          placeholder="Search plans or features..."
          className="w-full sm:w-72"
        />
      </div>

      {loading ? (
        <LoadingState message="Loading subscription tiers..." rows={3} />
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscription plans found"
          description="Create your first pricing tier to define branch limits, staff quotas, and included POS features."
          actionLabel="+ Create Plan Tier"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => {
            const isPlanActive = plan.isActive !== false
            return (
              <div
                key={plan._id}
                className="card-interactive flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles size={15} className="text-[#C98A5B]" />
                        <h3 className="text-lg font-extrabold text-[#241B15]">
                          {plan.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-[#81766D]">
                        Monthly recurring SaaS license
                      </p>
                    </div>

                    <StatusBadge
                      status={isPlanActive ? 'active' : 'disabled'}
                      label={isPlanActive ? 'Active' : 'Disabled'}
                    />
                  </div>

                  <div className="my-5 flex items-baseline gap-1 border-y border-[#F7F5F2] py-4">
                    <span className="text-3xl font-extrabold tracking-tight text-[#6F4E37]">
                      ₹{Number(plan.price || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-medium text-[#81766D]">
                      / month
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-[#F7F5F2] p-3 text-xs">
                      <span className="flex items-center gap-1 text-[#81766D]">
                        <Building2 size={12} className="text-[#6F4E37]" />
                        <span>Max Branches</span>
                      </span>
                      <p className="mt-1 text-sm font-extrabold text-[#241B15]">
                        Up to {plan.maxBranches}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F7F5F2] p-3 text-xs">
                      <span className="flex items-center gap-1 text-[#81766D]">
                        <Users size={12} className="text-[#C98A5B]" />
                        <span>Max Staff</span>
                      </span>
                      <p className="mt-1 text-sm font-extrabold text-[#241B15]">
                        Up to {plan.maxStaff}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#81766D]">
                      Included Entitlements
                    </p>
                    {(plan.features || []).length > 0 ? (
                      (plan.features || []).map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-[#241B15]"
                        >
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#4F8A5A]/15 text-[#4F8A5A]">
                            <Check size={10} />
                          </span>
                          <span>{feat}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#81766D] italic">
                        Standard POS &amp; dashboard features
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-2 border-t border-[#F7F5F2] pt-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(plan)}
                    className="btn-secondary flex-1 py-2 text-xs"
                  >
                    <Pencil size={13} className="text-[#6F4E37]" />
                    <span>Edit Tier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePlan(plan)}
                    className="rounded-xl border border-[#E8E1DA] p-2 text-[#81766D] transition-colors hover:border-[#C75C5C]/30 hover:bg-[#C75C5C]/10 hover:text-[#C75C5C]"
                    title="Delete Plan"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingId ? 'Edit Subscription Tier' : 'Create Subscription Tier'}
        subtitle="Configure pricing, branch & staff quotas, and included feature entitlements"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
              Tier Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Starter, Basic, Pro, Enterprise"
              required
              className="input-field mt-1.5"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                Monthly Fee (₹) *
              </label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="999"
                required
                className="input-field mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                Max Branches *
              </label>
              <input
                name="maxBranches"
                type="number"
                min="1"
                value={form.maxBranches}
                onChange={handleChange}
                placeholder="1"
                required
                className="input-field mt-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                Max Staff *
              </label>
              <input
                name="maxStaff"
                type="number"
                min="1"
                value={form.maxStaff}
                onChange={handleChange}
                placeholder="10"
                required
                className="input-field mt-1.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
              Included Features (Comma separated)
            </label>
            <textarea
              name="features"
              rows={3}
              value={form.features}
              onChange={handleChange}
              placeholder="POS Terminal, Kitchen Display, Inventory Tracking, Loyalty CRM, AI Insights"
              className="input-field mt-1.5"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E8E1DA] bg-[#F7F5F2] px-4 py-3 text-xs font-bold text-[#241B15]">
            <span>Enable tier for new café subscriptions</span>
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 accent-[#6F4E37]"
            />
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-[#F7F5F2] pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingId ? 'Save Changes' : 'Create Tier'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDeletePlan)}
        onClose={() => setConfirmDeletePlan(null)}
        onConfirm={handleDelete}
        loading={saving}
        variant="danger"
        title={`Delete "${confirmDeletePlan?.name}" Plan?`}
        description="This subscription plan tier will be permanently removed from the catalog."
        confirmLabel="Delete Plan"
      />
    </div>
  )
}

export default SubscriptionPlans
