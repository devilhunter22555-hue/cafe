import { useEffect, useState } from 'react'
import { AlertTriangle, History, Package, Pencil, Plus, Trash2, X } from 'lucide-react'
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
  { value: 'purchase', label: 'Purchase' },
  { value: 'wastage', label: 'Wastage' },
  { value: 'manual_adjustment', label: 'Adjustment' }
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

  const loadItems = async () => {
    try {
      const response = await getInventoryItems()
      setItems(response.data.data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getInventoryItems()
      .then((response) => { if (active) setItems(response.data.data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load inventory') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
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
    setForm({ name: item.name, unit: item.unit, lowStockThreshold: String(item.lowStockThreshold) })
    setModal('form')
  }

  const saveItem = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const data = { name: form.name, unit: form.unit, lowStockThreshold: Number(form.lowStockThreshold) }
      if (editingItem) await updateInventoryItem(editingItem._id, data)
      else await createInventoryItem(data)
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
      setLogs(response.data.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load stock history')
    }
  }

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return
    try {
      await deleteInventoryItem(item._id)
      await loadItems()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete inventory item')
    }
  }

  return <main className="mx-auto max-w-6xl p-6">
    <header className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold text-secondary">Inventory</h1><button className="btn-primary flex items-center gap-2" onClick={openAdd} type="button"><Plus size={18} /> Add Item</button></header>
    {error && <p className="mb-4 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}
    {loading ? <p className="py-12 text-center text-gray-500">Loading inventory...</p> : items.length ? <section className="space-y-3">{items.map((item) => <article className="card flex items-center justify-between gap-4 p-4" key={item._id}>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-secondary">{item.name}</h2><span className="text-xs text-gray-400">({item.unit})</span>{item.isLowStock && <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning"><AlertTriangle size={13} /> Low Stock</span>}</div><p className={`mt-1 text-lg font-bold ${item.isLowStock ? 'text-danger' : 'text-secondary'}`}>{item.currentStock} {item.unit}</p></div>
      <div className="flex shrink-0 items-center gap-2"><button className="btn-secondary px-3 py-1.5 text-sm" onClick={() => openAdjust(item)} type="button">Adjust Stock</button><button aria-label={`View history for ${item.name}`} className="rounded-lg p-2 text-gray-400 hover:text-primary" onClick={() => openHistory(item)} type="button"><History size={18} /></button><button aria-label={`Edit ${item.name}`} className="rounded-lg p-2 text-gray-400 hover:text-primary" onClick={() => openEdit(item)} type="button"><Pencil size={18} /></button><button aria-label={`Delete ${item.name}`} className="rounded-lg p-2 text-gray-400 hover:text-danger" onClick={() => deleteItem(item)} type="button"><Trash2 size={18} /></button></div>
    </article>)}</section> : <div className="flex min-h-[40vh] flex-col items-center justify-center text-gray-400"><Package size={48} /><p className="mt-3">No inventory items yet.</p></div>}

    {modal === 'form' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form className="card w-full max-w-sm" onSubmit={saveItem}><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-secondary">{editingItem ? 'Edit Item' : 'Add Item'}</h2><button aria-label="Close" className="text-gray-400 hover:text-secondary" onClick={closeModal} type="button"><X size={20} /></button></div><div className="space-y-4"><label className="block text-sm text-gray-600">Name<input className="input-field mt-1" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label><label className="block text-sm text-gray-600">Unit<select className="input-field mt-1" onChange={(event) => setForm({ ...form, unit: event.target.value })} value={form.unit}>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label><label className="block text-sm text-gray-600">Low stock threshold<input className="input-field mt-1" min="0" onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} required type="number" value={form.lowStockThreshold} /></label></div><div className="mt-6 flex justify-end gap-3"><button className="btn-secondary" onClick={closeModal} type="button">Cancel</button><button className="btn-primary" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save'}</button></div></form></div>}

    {modal === 'adjust' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form className="card w-full max-w-sm" onSubmit={saveAdjustment}><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-secondary">Adjust {adjustingItem.name}</h2><button aria-label="Close" className="text-gray-400 hover:text-secondary" onClick={closeModal} type="button"><X size={20} /></button></div><div className="flex gap-2">{changeTypes.map((type) => <button className={`flex-1 rounded-lg border px-2 py-2 text-sm ${changeType === type.value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 bg-white text-gray-600'}`} key={type.value} onClick={() => setChangeType(type.value)} type="button">{type.label}</button>)}</div><div className="mt-4 space-y-4"><label className="block text-sm text-gray-600">{changeType === 'purchase' ? 'Quantity to add' : 'Quantity to remove'}<input className="input-field mt-1" min="0" onChange={(event) => setQuantity(event.target.value)} required step="any" type="number" value={quantity} /></label><label className="block text-sm text-gray-600">Note<input className="input-field mt-1" onChange={(event) => setNote(event.target.value)} value={note} /></label></div><div className="mt-6 flex justify-end gap-3"><button className="btn-secondary" onClick={closeModal} type="button">Cancel</button><button className="btn-primary" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save'}</button></div></form></div>}

    {modal === 'history' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section className="card w-full max-w-lg"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-secondary">{historyItem.name} History</h2><button aria-label="Close" className="text-gray-400 hover:text-secondary" onClick={closeModal} type="button"><X size={20} /></button></div>{logs.length ? <div className="max-h-80 space-y-3 overflow-y-auto">{logs.map((log) => <div className="border-b border-gray-100 pb-3 last:border-0" key={log._id}><div className="flex items-center justify-between gap-3"><span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span><span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{log.changeType.replace('_', ' ')}</span><span className={log.quantityChange >= 0 ? 'font-semibold text-success' : 'font-semibold text-danger'}>{log.quantityChange > 0 ? '+' : ''}{log.quantityChange} {historyItem.unit}</span></div>{log.note && <p className="mt-1 text-sm text-gray-500">{log.note}</p>}</div>)}</div> : <div className="py-10 text-center text-gray-400">No stock logs yet.</div>}<div className="mt-5 flex justify-end"><button className="btn-secondary" onClick={closeModal} type="button">Close</button></div></section></div>}
  </main>
}

export default Inventory
