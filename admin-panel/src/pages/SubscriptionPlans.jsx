import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CreditCard,
  Layers,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import { createPlan, deletePlan, getPlans, updatePlan } from '../api/adminApi.js'

const emptyForm = {
  name: '',
  price: '',
  maxBranches: '',
  maxStaff: '',
  features: '',
  isActive: true
}

function SubscriptionPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const fetchPlans = async () => {
    try {
      const response = await getPlans()
      setPlans(response.data || [])
      setError('')
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Unable to load subscription plans.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice('')

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
        isActive: form.isActive
      }

      if (
        !payload.name ||
        Number.isNaN(payload.price) ||
        Number.isNaN(payload.maxBranches) ||
        Number.isNaN(payload.maxStaff)
      ) {
        throw new Error('Please complete all plan fields before saving.')
      }

      if (editingId) {
        const response = await updatePlan(editingId, payload)
        setPlans((current) =>
          current.map((plan) => (plan._id === editingId ? response.data : plan))
        )
        setNotice(`Plan "${response.data.name}" updated successfully.`)
      } else {
        const response = await createPlan(payload)
        setPlans((current) => [...current, response.data])
        setNotice(`Plan "${response.data.name}" created successfully.`)
      }

      resetForm()
    } catch (submitError) {
      setNotice(submitError.response?.data?.message || submitError.message || 'Unable to save plan.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (plan) => {
    setEditingId(plan._id)
    setForm({
      name: plan.name || '',
      price: plan.price ?? '',
      maxBranches: plan.maxBranches ?? '',
      maxStaff: plan.maxStaff ?? '',
      features: (plan.features || []).join(', '),
      isActive: plan.isActive !== false
    })
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete plan "${name}"?`)) return

    try {
      await deletePlan(id)
      setPlans((current) => current.filter((plan) => plan._id !== id))
      setNotice('Plan removed successfully.')
      if (editingId === id) resetForm()
    } catch (deleteError) {
      setNotice(deleteError.response?.data?.message || 'Unable to delete plan.')
    }
  }

  const activePlansCount = plans.filter((p) => p.isActive !== false).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">Subscription Tiers</h1>
        <p className="mt-1 text-sm text-[#7A7068]">
          Configure SaaS subscription tiers, pricing, branch &amp; staff limits, and feature entitlements
        </p>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Defined Tiers
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#2B2118]">{plans.length}</p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Active for Signups
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#4F8A5A]">{activePlansCount}</p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Billing Frequency
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#6F4E37]">Monthly Recurring</p>
        </div>
      </div>

      {/* Main Grid: Form + Plans Catalog */}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        {/* Plan Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-xs space-y-4 h-fit"
        >
          <div className="flex items-center justify-between border-b border-[#F7F5F2] pb-3">
            <h2 className="text-base font-bold text-[#2B2118]">
              {editingId ? 'Edit Plan Tier' : 'Create New Tier'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-[#6F4E37] hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
              Tier Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Starter, Pro, Enterprise"
              required
              className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                Monthly Fee (₹)
              </label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="0"
                required
                className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                Max Branches
              </label>
              <input
                name="maxBranches"
                type="number"
                min="1"
                value={form.maxBranches}
                onChange={handleChange}
                placeholder="1"
                required
                className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
              Max Staff Users
            </label>
            <input
              name="maxStaff"
              type="number"
              min="1"
              value={form.maxStaff}
              onChange={handleChange}
              placeholder="5"
              required
              className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
              Features (Comma separated)
            </label>
            <textarea
              name="features"
              rows={3}
              value={form.features}
              onChange={handleChange}
              placeholder="POS Terminal, Kitchen Display, Inventory Tracking, Loyalty CRM"
              className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1 text-sm font-semibold text-[#2B2118]">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded-md border-[#EBE7DF] text-[#6F4E37] focus:ring-[#6F4E37]"
            />
            <span>Active plan (Enabled for new subscriptions)</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6F4E37] py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#2B2118] transition-all disabled:opacity-60"
          >
            {saving ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Saving Tier...</span>
              </>
            ) : (
              <>
                {editingId ? <Pencil size={16} /> : <Plus size={16} />}
                <span>{editingId ? 'Update Subscription Tier' : 'Create Subscription Tier'}</span>
              </>
            )}
          </button>
        </form>

        {/* Plans Catalog */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#2B2118]">Current Plan Catalog</h2>

          {loading ? (
            <div className="py-12 text-center text-sm text-[#7A7068]">Loading plans...</div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="flex flex-col justify-between rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs transition-all hover:border-[#6F4E37]/30"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-[#2B2118]">{plan.name}</h3>
                        <p className="mt-0.5 text-xs text-[#7A7068]">
                          Up to {plan.maxBranches} branches • {plan.maxStaff} staff
                        </p>
                      </div>

                      <span
                        className={plan.isActive === false ? 'badge-danger' : 'badge-success'}
                      >
                        {plan.isActive === false ? 'Disabled' : 'Active'}
                      </span>
                    </div>

                    <div className="my-4">
                      <span className="text-3xl font-extrabold text-[#6F4E37]">
                        ₹{Number(plan.price || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-[#7A7068]"> / month</span>
                    </div>

                    {/* Features List */}
                    <div className="space-y-1.5 border-t border-[#F7F5F2] pt-3">
                      {(plan.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#2B2118]">
                          <Check size={14} className="text-[#4F8A5A] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#F7F5F2] pt-3">
                    <button
                      type="button"
                      onClick={() => handleEdit(plan)}
                      className="rounded-lg bg-[#F7F5F2] px-3 py-1.5 text-xs font-semibold text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white transition-all shadow-2xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(plan._id, plan.name)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-[#C75C5C] transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-8 text-center text-sm text-[#7A7068]">
              No plans defined yet. Create your first subscription plan on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPlans
