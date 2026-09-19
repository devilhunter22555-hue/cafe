import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { createPlan, deletePlan, getPlans, updatePlan } from '../api/adminApi.js'

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

  const totalRevenue = useMemo(
    () => plans.reduce((sum, plan) => sum + Number(plan.price || 0), 0),
    [plans]
  )

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
        isActive: form.isActive,
      }

      if (!payload.name || Number.isNaN(payload.price) || Number.isNaN(payload.maxBranches) || Number.isNaN(payload.maxStaff)) {
        throw new Error('Please complete the plan details before saving.')
      }

      if (editingId) {
        const response = await updatePlan(editingId, payload)
        setPlans((current) => current.map((plan) => (plan._id === editingId ? response.data : plan)))
        setNotice(`Plan “${response.data.name}” updated successfully.`)
      } else {
        const response = await createPlan(payload)
        setPlans((current) => [...current, response.data])
        setNotice(`Plan “${response.data.name}” created successfully.`)
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
      isActive: plan.isActive !== false,
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscription plan?')) return

    try {
      await deletePlan(id)
      setPlans((current) => current.filter((plan) => plan._id !== id))
      setNotice('Plan deleted successfully.')
      if (editingId === id) resetForm()
    } catch (deleteError) {
      setNotice(deleteError.response?.data?.message || 'Unable to delete plan.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="text-lg font-semibold text-secondary">Subscription Plans</h1>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Plans</p>
            <p className="mt-2 text-3xl font-bold text-secondary">{plans.length}</p>
          </div>
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Max Monthly Value</p>
            <p className="mt-2 text-3xl font-bold text-secondary">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Active Plans</p>
            <p className="mt-2 text-3xl font-bold text-secondary">{plans.filter((plan) => plan.isActive !== false).length}</p>
          </div>
        </div>

        {notice && <div className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{notice}</div>}
        {error && <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">{editingId ? 'Edit Plan' : 'Create Plan'}</h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-sm font-medium text-primary">
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="e.g. Pro" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary">Price</label>
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary">Max branches</label>
                <input name="maxBranches" type="number" min="1" value={form.maxBranches} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">Max staff</label>
              <input name="maxStaff" type="number" min="1" value={form.maxStaff} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-secondary">Features</label>
              <input name="features" value={form.features} onChange={handleChange} className="input-field" placeholder="Inventory, CRM, AI Insights" />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-secondary">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              Active plan
            </label>

            <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingId ? 'Update Plan' : 'Add Plan'}
                </>
              )}
            </button>
          </form>

          <div className="card">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-secondary">Plans Catalog</h2>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading plans...
              </div>
            ) : plans.length ? (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-secondary">{plan.name}</p>
                        <p className="text-sm text-slate-500">
                          ${Number(plan.price || 0).toFixed(2)} • {plan.maxBranches} branches • {plan.maxStaff} staff
                        </p>
                      </div>
                      <span className={plan.isActive === false ? 'badge-danger' : 'badge-success'}>
                        {plan.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(plan.features || []).map((feature) => (
                        <span key={`${plan._id}-${feature}`} className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => handleEdit(plan)} className="btn-secondary compact">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(plan._id)} className="btn-secondary compact text-red-600">
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No plans have been created yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default SubscriptionPlans
