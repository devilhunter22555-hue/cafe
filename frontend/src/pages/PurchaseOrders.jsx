import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Plus, X } from 'lucide-react'
import { getInventoryItems } from '../api/inventoryApi.js'
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrders,
  markAsReceived,
} from '../api/purchaseOrderApi.js'
import { getSuppliers } from '../api/supplierApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const statusOptions = ['all', 'pending', 'received', 'cancelled']

const statusStyles = {
  pending: 'bg-warning/10 text-warning',
  received: 'bg-success/10 text-success',
  cancelled: 'bg-gray-200 text-gray-700',
}

function PurchaseOrders() {
  const { user } = useAuth()
  const isAllowed = user?.role === 'owner' || user?.role === 'manager'

  const [statusFilter, setStatusFilter] = useState('all')
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const [form, setForm] = useState({
    supplierId: '',
    notes: '',
    items: [
      { inventoryItemId: '', quantity: '', unitPrice: '' },
    ],
  })

  const loadSuppliers = async () => {
    try {
      const response = await getSuppliers()
      setSuppliers(response.data?.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load suppliers.')
    }
  }

  const loadInventory = async () => {
    try {
      const response = await getInventoryItems()
      setInventoryItems(response.data?.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load inventory.')
    }
  }

  const loadPurchaseOrders = async () => {
    try {
      const response = await getPurchaseOrders(statusFilter === 'all' ? '' : statusFilter)
      setPurchaseOrders(response.data?.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load purchase orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAllowed) return
    const initializePage = async () => {
      setLoading(true)
      await Promise.all([loadSuppliers(), loadInventory(), loadPurchaseOrders()])
    }
    initializePage()
  }, [isAllowed, statusFilter])

  const totalAmount = useMemo(() => {
    return form.items.reduce((sum, row) => {
      const qty = Number(row.quantity) || 0
      const price = Number(row.unitPrice) || 0
      return sum + qty * price
    }, 0)
  }, [form.items])

  const updateItemRow = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item, rowIndex) => rowIndex === index ? { ...item, [field]: value } : item),
    }))
  }

  const addItemRow = () => {
    setForm((previous) => ({
      ...previous,
      items: [...previous.items, { inventoryItemId: '', quantity: '', unitPrice: '' }],
    }))
  }

  const removeItemRow = (index) => {
    setForm((previous) => ({
      ...previous,
      items: previous.items.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  const handleCreatePurchaseOrder = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    const validItems = form.items.filter((item) => item.inventoryItemId && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0)
    if (!form.supplierId || validItems.length === 0) {
      setError('Please select a supplier and at least one valid item.')
      return
    }

    try {
      await createPurchaseOrder({
        supplierId: form.supplierId,
        notes: form.notes,
        items: validItems.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      })
      setSuccessMessage('Purchase order created successfully.')
      setIsModalOpen(false)
      setForm({
        supplierId: '',
        notes: '',
        items: [{ inventoryItemId: '', quantity: '', unitPrice: '' }],
      })
      await loadPurchaseOrders()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create purchase order.')
    }
  }

  const handleMarkAsReceived = async (orderId) => {
    setError('')
    setSuccessMessage('')

    try {
      await markAsReceived(orderId)
      setSuccessMessage('Purchase order marked as received.')
      await loadPurchaseOrders()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark purchase order as received.')
    }
  }

  const handleCancelPurchaseOrder = async (orderId) => {
    if (!window.confirm('Cancel this purchase order?')) return
    setError('')
    setSuccessMessage('')

    try {
      await cancelPurchaseOrder(orderId)
      setSuccessMessage('Purchase order cancelled.')
      await loadPurchaseOrders()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to cancel purchase order.')
    }
  }

  if (!isAllowed) {
    return (
      <main className="p-6">
        <div className="card mx-auto max-w-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-secondary">Access denied</h1>
          <p className="mt-3 text-gray-500">Only owners and managers can manage purchase orders.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-primary" />
          <h1 className="text-2xl font-bold text-secondary">Purchase Orders</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
            {statusOptions.map((option) => (
              <button
                className={`rounded-md px-3 py-1.5 text-sm ${statusFilter === option ? 'bg-primary text-white' : 'text-gray-600 hover:bg-slate-100'}`}
                key={option}
                onClick={() => setStatusFilter(option)}
                type="button"
              >
                {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>

          <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)} type="button">
            <Plus size={18} /> New Purchase Order
          </button>
        </div>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {successMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

      {loading ? (
        <div className="card p-6 text-gray-500">Loading purchase orders...</div>
      ) : (
        <section className="space-y-3">
          {purchaseOrders.length === 0 ? (
            <div className="card p-6 text-gray-500">No purchase orders found.</div>
          ) : (
            purchaseOrders.map((order) => {
              const isExpanded = expandedId === order._id
              const itemCount = order.items?.length || 0
              const statusClass = statusStyles[order.status] || 'bg-gray-200 text-gray-700'

              return (
                <article className="card p-4" key={order._id}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" onClick={() => setExpandedId((current) => (current === order._id ? null : order._id))}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-secondary">{order.poNumber}</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">{order.supplierId?.name || 'Supplier'}</div>
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <div className="text-lg font-bold text-primary">
                        ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm text-gray-500">{itemCount} item{itemCount === 1 ? '' : 's'}</div>
                    </div>
                  </div>

                  {order.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <button className="btn-primary px-3 py-2 text-sm" onClick={() => handleMarkAsReceived(order._id)} type="button">Mark as Received</button>
                      <button className="btn-secondary px-3 py-2 text-sm" onClick={() => handleCancelPurchaseOrder(order._id)} type="button">Cancel</button>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <div className="space-y-3">
                        {order.items?.map((item, index) => (
                          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm" key={`${order._id}-${item.inventoryItemId?._id || index}`}>
                            <div>
                              <div className="font-medium text-secondary">{item.inventoryItemId?.name || 'Item'}</div>
                              <div className="text-gray-500">Qty: {item.quantity} · Unit Price: ₹{Number(item.unitPrice).toLocaleString('en-IN')} </div>
                            </div>
                            <div className="font-semibold text-secondary">₹{Number(item.lineTotal).toLocaleString('en-IN')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </section>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="card max-w-lg w-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">New Purchase Order</h2>
              <button className="rounded-full p-2 text-gray-500 hover:bg-slate-100" onClick={() => setIsModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreatePurchaseOrder}>
              <div>
                <label className="block text-sm font-medium text-secondary">Supplier</label>
                <select className="input-field mt-1" value={form.supplierId} onChange={(event) => setForm((previous) => ({ ...previous, supplierId: event.target.value }))}>
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id || supplier.id} value={supplier._id || supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {form.items.map((row, index) => (
                  <div className="rounded-lg border border-slate-200 p-3" key={`${index}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-secondary">Item {index + 1}</span>
                      {form.items.length > 1 && (
                        <button className="text-sm text-danger" onClick={() => removeItemRow(index)} type="button">Remove</button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-secondary">Inventory</label>
                        <select className="input-field mt-1" value={row.inventoryItemId} onChange={(event) => updateItemRow(index, 'inventoryItemId', event.target.value)}>
                          <option value="">Select item</option>
                          {inventoryItems.map((item) => (
                            <option key={item._id || item.id} value={item._id || item.id}>{item.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary">Quantity</label>
                        <input className="input-field mt-1" min="1" value={row.quantity} onChange={(event) => updateItemRow(index, 'quantity', event.target.value)} type="number" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary">Unit Price</label>
                        <input className="input-field mt-1" min="0" step="0.01" value={row.unitPrice} onChange={(event) => updateItemRow(index, 'unitPrice', event.target.value)} type="number" />
                      </div>
                    </div>

                    <div className="mt-2 text-right text-sm font-medium text-gray-600">
                      Line Total: ₹{((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <button className="text-sm font-medium text-primary" onClick={addItemRow} type="button">+ Add Item</button>

              <div>
                <label className="block text-sm font-medium text-secondary">Notes</label>
                <textarea className="input-field mt-1" value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} rows="3" />
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="text-lg font-bold text-secondary">Total: ₹{totalAmount.toLocaleString('en-IN')}</div>
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

export default PurchaseOrders
