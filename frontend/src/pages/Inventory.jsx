import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X
} from 'lucide-react'
import {
  adjustStock,
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItems,
  getStockLogs,
  updateInventoryItem
} from '../api/inventoryApi.js'

const units = ['kg', 'g', 'l', 'ml', 'pcs']
const changeTypes = [
  { value: 'purchase', label: 'Purchase (+)', color: 'text-[#4F8A5A] border-emerald-300' },
  { value: 'wastage', label: 'Wastage (-)', color: 'text-[#C75C5C] border-rose-300' },
  { value: 'manual_adjustment', label: 'Manual Correction', color: 'text-[#6F4E37] border-amber-300' }
]

const emptyForm = { name: '', unit: 'kg', lowStockThreshold: '5' }

function Inventory() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingItem, setEditingItem] = useState(null)
  const [adjustingItem, setAdjustingItem] = useState(null)
  const [historyItem, setHistoryItem] = useState(null)
  const [logs, setLogs] = useState([])
  const [changeType, setChangeType] = useState('purchase')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const loadItems = async () => {
    try {
      const response = await getInventoryItems()
      setItems(response.data.data || [])
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const closeModal = () => {
    setModal(null)
    setEditingItem(null)
    setAdjustingItem(null)
    setHistoryItem(null)
    setLogs([])
    setError('')
  }

  const openAdd = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setModal('form')
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      unit: item.unit,
      lowStockThreshold: String(item.lowStockThreshold)
    })
    setModal('form')
  }

  const saveItem = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        unit: form.unit,
        lowStockThreshold: Number(form.lowStockThreshold)
      }
      if (editingItem) {
        await updateInventoryItem(editingItem._id, data)
      } else {
        await createInventoryItem(data)
      }
      closeModal()
      await loadItems()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save inventory item')
    } finally {
      setSaving(false)
    }
  }

  const openAdjust = (item) => {
    setAdjustingItem(item)
    setChangeType('purchase')
    setQuantity('')
    setNote('')
    setModal('adjust')
  }

  const saveAdjustment = async (event) => {
    event.preventDefault()
    const amount = Number(quantity)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a quantity greater than zero')
      return
    }
    setSaving(true)
    try {
      await adjustStock(adjustingItem._id, {
        changeType,
        quantityChange: changeType === 'purchase' ? amount : -amount,
        note: note.trim() || undefined
      })
      closeModal()
      await loadItems()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to adjust stock')
    } finally {
      setSaving(false)
    }
  }

  const openHistory = async (item) => {
    setHistoryItem(item)
    setModal('history')
    try {
      const response = await getStockLogs(item._id)
      setLogs(response.data.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load stock history')
    }
  }

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete ${item.name} from inventory?`)) return
    try {
      await deleteInventoryItem(item._id)
      await loadItems()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete inventory item')
    }
  }

  const lowStockCount = items.filter((i) => i.isLowStock).length

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">Inventory &amp; Raw Stock</h1>
          <p className="mt-1 text-sm text-[#7A7068]">
            Manage ingredients, track low stock alerts, log wastage, and adjust supplies
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6F4E37] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2B2118] transition-all active:scale-[0.98]"
        >
          <Plus size={18} />
          <span>Add Stock Item</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats & Search */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Total Raw Items
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#2B2118]">{items.length}</p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Low Stock Alerts
          </span>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-extrabold text-[#D99A5B]">{lowStockCount}</p>
            {lowStockCount > 0 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                Action Needed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center rounded-2xl border border-[#EBE7DF] bg-white p-4 shadow-xs">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredient by name..."
              className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-2 pl-9 pr-3 text-xs text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[#7A7068]">Loading inventory...</div>
      ) : filteredItems.length > 0 ? (
        <div className="divide-y divide-[#EBE7DF] rounded-2xl border border-[#EBE7DF] bg-white shadow-xs overflow-hidden">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="flex flex-wrap items-center justify-between gap-4 p-4.5 transition-colors hover:bg-[#F7F5F2]/50"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F5F2] text-[#6F4E37] border border-[#EBE7DF]">
                  <Package size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#2B2118]">{item.name}</h3>
                    <span className="rounded-md bg-[#F7F5F2] px-2 py-0.5 text-xs font-semibold text-[#7A7068]">
                      {item.unit}
                    </span>
                    {item.isLowStock && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-[#D99A5B]">
                        <AlertTriangle size={12} />
                        Low Stock
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#7A7068]">
                    Min. threshold: {item.lowStockThreshold} {item.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span
                    className={`text-xl font-black ${
                      item.isLowStock ? 'text-[#C75C5C]' : 'text-[#2B2118]'
                    }`}
                  >
                    {item.currentStock} {item.unit}
                  </span>
                  <p className="text-[11px] text-[#7A7068]">In Stock</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openAdjust(item)}
                    className="rounded-xl bg-[#F7F5F2] px-3 py-1.5 text-xs font-bold text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white transition-all shadow-2xs"
                  >
                    Adjust
                  </button>
                  <button
                    type="button"
                    onClick={() => openHistory(item)}
                    title="Stock Logs"
                    className="rounded-lg p-2 text-gray-400 hover:bg-[#F7F5F2] hover:text-[#2B2118] transition-colors"
                  >
                    <History size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    title="Edit Item"
                    className="rounded-lg p-2 text-gray-400 hover:bg-[#F7F5F2] hover:text-[#2B2118] transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    title="Delete Item"
                    className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-[#C75C5C] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[35vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-8 text-center">
          <Package className="text-gray-300 mb-3" size={40} />
          <h3 className="font-bold text-[#2B2118]">No inventory items found</h3>
          <p className="mt-1 text-sm text-[#7A7068]">
            Click "Add Stock Item" to create trackable ingredients
          </p>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {modal === 'form' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={saveItem}
            className="w-full max-w-sm rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="mb-5 flex items-center justify-between border-b border-[#F7F5F2] pb-3">
              <h2 className="text-lg font-bold text-[#2B2118]">
                {editingItem ? 'Edit Ingredient' : 'New Ingredient'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Ingredient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arabica Coffee Beans, Whole Milk"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Measurement Unit
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#F7F5F2] pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-[#EBE7DF] px-4 py-2 text-sm font-semibold text-[#7A7068] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#6F4E37] px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#2B2118]"
              >
                {saving ? 'Saving...' : 'Save Ingredient'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {modal === 'adjust' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={saveAdjustment}
            className="w-full max-w-sm rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="mb-5 flex items-center justify-between border-b border-[#F7F5F2] pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Stock Adjustment
                </span>
                <h2 className="text-lg font-bold text-[#2B2118]">{adjustingItem.name}</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068] mb-1.5">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {changeTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setChangeType(type.value)}
                      className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                        changeType === type.value
                          ? 'border-[#6F4E37] bg-[#6F4E37] text-white shadow-xs'
                          : 'border-[#EBE7DF] bg-white text-[#7A7068] hover:bg-gray-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Quantity ({adjustingItem.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Adjustment Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Supplier receipt, spill, end of shift..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#F7F5F2] pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-[#EBE7DF] px-4 py-2 text-sm font-semibold text-[#7A7068] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#6F4E37] px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#2B2118]"
              >
                {saving ? 'Adjusting...' : 'Save Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock History Modal */}
      {modal === 'history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-[#EBE7DF] bg-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F7F5F2] px-6 py-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Audit Log
                </span>
                <h2 className="text-lg font-bold text-[#2B2118]">{historyItem.name} History</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {logs.length > 0 ? (
                <div className="divide-y divide-[#F7F5F2] space-y-3">
                  {logs.map((log) => (
                    <div key={log._id} className="pt-3 first:pt-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold capitalize text-[#2B2118]">
                          {log.changeType.replace('_', ' ')}
                        </span>
                        <span className="text-gray-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-[#7A7068]">{log.note || 'No note'}</span>
                        <span
                          className={`text-sm font-bold ${
                            log.quantityChange >= 0 ? 'text-[#4F8A5A]' : 'text-[#C75C5C]'
                          }`}
                        >
                          {log.quantityChange > 0 ? '+' : ''}
                          {log.quantityChange} {historyItem.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-[#7A7068]">No stock logs found.</p>
              )}
            </div>

            <div className="border-t border-[#F7F5F2] px-6 py-3 text-right">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-[#EBE7DF] px-4 py-2 text-xs font-semibold text-[#7A7068] hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
