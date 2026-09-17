import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, Truck, X } from 'lucide-react'
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier } from '../api/supplierApi.js'
import { useAuth } from '../context/AuthContext.jsx'

function Suppliers() {
  const { user } = useAuth()
  const isAllowed = user?.role === 'owner' || user?.role === 'manager'
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  })

  const loadSuppliers = async () => {
    try {
      const response = await getSuppliers()
      setSuppliers(response.data?.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load suppliers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAllowed) return
    loadSuppliers()
  }, [isAllowed])

  const handleOpenAdd = () => {
    setEditingSupplier(null)
    setForm({ name: '', contactPerson: '', phone: '', email: '', address: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (supplier) => {
    setEditingSupplier(supplier)
    setForm({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier._id, form)
        setSuccessMessage('Supplier updated successfully.')
      } else {
        await createSupplier(form)
        setSuccessMessage('Supplier created successfully.')
      }
      setIsModalOpen(false)
      await loadSuppliers()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save supplier.')
    }
  }

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Delete this supplier?')) return
    setError('')
    setSuccessMessage('')

    try {
      await deleteSupplier(supplierId)
      setSuccessMessage('Supplier deleted successfully.')
      await loadSuppliers()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete supplier.')
    }
  }

  if (!isAllowed) {
    return (
      <main className="p-6">
        <div className="card mx-auto max-w-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-secondary">Access denied</h1>
          <p className="mt-3 text-gray-500">Only owners and managers can manage suppliers.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Truck className="text-primary" />
          <h1 className="text-2xl font-bold text-secondary">Suppliers</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={handleOpenAdd} type="button">
          <Plus size={18} /> Add Supplier
        </button>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {successMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

      {loading ? (
        <div className="card p-6 text-gray-500">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <div className="card p-6 text-gray-500">No suppliers found.</div>
      ) : (
        <section className="space-y-3">
          {suppliers.map((supplier) => (
            <article className="card flex items-center justify-between p-4" key={supplier._id || supplier.id}>
              <div>
                <div className="font-semibold text-secondary">{supplier.name}</div>
                <div className="mt-1 text-sm text-gray-500">
                  {supplier.contactPerson || 'No contact person'} · {supplier.phone || 'No phone'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="rounded-md p-2 text-gray-600 transition hover:bg-slate-100 hover:text-secondary" onClick={() => handleOpenEdit(supplier)} title="Edit supplier" type="button">
                  <Pencil size={18} />
                </button>
                <button className="rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-danger" onClick={() => handleDelete(supplier._id || supplier.id)} title="Delete supplier" type="button">
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button className="rounded-full p-2 text-gray-500 hover:bg-slate-100" onClick={() => setIsModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-secondary">Name</label>
                <input className="input-field mt-1" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} type="text" />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary">Contact Person</label>
                <input className="input-field mt-1" value={form.contactPerson} onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))} type="text" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-secondary">Phone</label>
                  <input className="input-field mt-1" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} type="text" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary">Email</label>
                  <input className="input-field mt-1" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} type="email" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary">Address</label>
                <textarea className="input-field mt-1" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} rows="3" />
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

export default Suppliers
