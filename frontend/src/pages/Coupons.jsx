import { useEffect, useState } from 'react'
import { BadgePercent, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { createCoupon, deleteCoupon, getCoupons, updateCoupon } from '../api/couponApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function formatCurrency(value) {
  return money.format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

function Coupons() {
  const { user } = useAuth()
  const isAllowed = user?.role === 'owner' || user?.role === 'manager'

  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '0',
    maxDiscountAmount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    isActive: true,
  })

  const loadCoupons = async () => {
    try {
      setLoading(true)
      const response = await getCoupons()
      setCoupons(response.data?.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load coupons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAllowed) return
    loadCoupons()
  }, [isAllowed])

  const resetForm = () => {
    setForm({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderValue: '0',
      maxDiscountAmount: '',
      validFrom: '',
      validUntil: '',
      usageLimit: '',
      isActive: true,
    })
    setEditingCoupon(null)
  }

  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      minOrderValue: coupon.minOrderValue ?? '0',
      maxDiscountAmount: coupon.maxDiscountAmount ?? '',
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 10) : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 10) : '',
      usageLimit: coupon.usageLimit ?? '',
      isActive: Boolean(coupon.isActive),
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue || 0),
        maxDiscountAmount: form.maxDiscountAmount === '' ? null : Number(form.maxDiscountAmount),
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
        isActive: Boolean(form.isActive),
      }

      if (!payload.code || !payload.discountType || !payload.discountValue || !payload.validFrom || !payload.validUntil) {
        setError('Please complete all required coupon fields.')
        return
      }

      if (editingCoupon) {
        await updateCoupon(editingCoupon._id, payload)
        setSuccessMessage('Coupon updated successfully.')
      } else {
        await createCoupon(payload)
        setSuccessMessage('Coupon created successfully.')
      }

      setIsModalOpen(false)
      resetForm()
      await loadCoupons()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save coupon.')
    }
  }

  const handleDelete = async (couponId) => {
    if (!window.confirm('Deactivate this coupon?')) return
    try {
      setError('')
      setSuccessMessage('')
      await deleteCoupon(couponId)
      setSuccessMessage('Coupon deactivated successfully.')
      await loadCoupons()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete coupon.')
    }
  }

  if (!isAllowed) {
    return (
      <main className="p-6">
        <div className="card mx-auto max-w-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-secondary">Access denied</h1>
          <p className="mt-3 text-gray-500">Only owners and managers can manage discount coupons.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BadgePercent className="text-primary" />
          <h1 className="text-2xl font-bold text-secondary">Coupons</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAddModal} type="button">
          <Plus size={18} /> New Coupon
        </button>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {successMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

      {loading ? (
        <div className="card p-6 text-gray-500">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="card p-6 text-gray-500">No coupons found.</div>
      ) : (
        <section className="space-y-3">
          {coupons.map((coupon) => {
            const isExpired = new Date(coupon.validUntil) < new Date()
            const statusLabel = coupon.isActive && !isExpired ? 'Active' : 'Inactive'

            return (
              <article className="card flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between" key={coupon._id || coupon.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">{coupon.code}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${coupon.isActive && !isExpired ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium text-secondary">{coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `${formatCurrency(coupon.discountValue)} off`}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span>Min order {formatCurrency(coupon.minOrderValue || 0)}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Valid {formatDate(coupon.validFrom)} to {formatDate(coupon.validUntil)}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button className="rounded-md p-2 text-gray-600 transition hover:bg-slate-100 hover:text-secondary" onClick={() => openEditModal(coupon)} title="Edit coupon" type="button">
                    <Pencil size={18} />
                  </button>
                  <button className="rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-danger" onClick={() => handleDelete(coupon._id || coupon.id)} title="Deactivate coupon" type="button">
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button className="rounded-full p-2 text-gray-500 hover:bg-slate-100" onClick={() => setIsModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-secondary">Code</label>
                  <input className="input-field mt-1 uppercase" onChange={(event) => setForm((previous) => ({ ...previous, code: event.target.value }))} type="text" value={form.code} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary">Discount Type</label>
                  <select className="input-field mt-1" onChange={(event) => setForm((previous) => ({ ...previous, discountType: event.target.value }))} value={form.discountType}>
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-secondary">Discount Value</label>
                  <input className="input-field mt-1" min="0" onChange={(event) => setForm((previous) => ({ ...previous, discountValue: event.target.value }))} step="0.01" type="number" value={form.discountValue} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary">Min Order Value</label>
                  <input className="input-field mt-1" min="0" onChange={(event) => setForm((previous) => ({ ...previous, minOrderValue: event.target.value }))} step="0.01" type="number" value={form.minOrderValue} />
                </div>
              </div>

              {form.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-secondary">Max Discount Amount</label>
                  <input className="input-field mt-1" min="0" onChange={(event) => setForm((previous) => ({ ...previous, maxDiscountAmount: event.target.value }))} step="0.01" type="number" value={form.maxDiscountAmount} />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-secondary">Valid From</label>
                  <input className="input-field mt-1" onChange={(event) => setForm((previous) => ({ ...previous, validFrom: event.target.value }))} type="date" value={form.validFrom} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary">Valid Until</label>
                  <input className="input-field mt-1" onChange={(event) => setForm((previous) => ({ ...previous, validUntil: event.target.value }))} type="date" value={form.validUntil} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-secondary">Usage Limit</label>
                  <input className="input-field mt-1" min="1" onChange={(event) => setForm((previous) => ({ ...previous, usageLimit: event.target.value }))} type="number" value={form.usageLimit} />
                </div>
                <div className="flex items-end">
                  <label className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-secondary">
                    <span className="flex items-center gap-2">
                      <Tag size={16} /> Active
                    </span>
                    <input checked={form.isActive} onChange={(event) => setForm((previous) => ({ ...previous, isActive: event.target.checked }))} type="checkbox" />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button className="btn-secondary" onClick={() => setIsModalOpen(false)} type="button">Cancel</button>
                <button className="btn-primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Coupons
