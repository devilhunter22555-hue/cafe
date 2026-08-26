import { useEffect, useState } from 'react'
import { Pencil, QrCode, Trash2, X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import {
  createTable,
  deleteTable,
  getQrCodeUrl,
  getTables,
  updateTable,
  updateTableStatus,
} from '../api/tableApi.js'

const emptyForm = { tableNumber: '', capacity: 4 }
const statuses = ['free', 'occupied', 'reserved']

function TableManagement() {
  const [tables, setTables] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [statusMenuId, setStatusMenuId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [qrModal, setQrModal] = useState(null)
  const [error, setError] = useState('')

  const loadTables = async () => {
    try {
      setTables((await getTables()).data.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load tables')
    }
  }

  useEffect(() => {
    getTables()
      .then((response) => setTables(response.data.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load tables'))
  }, [])

  const openForm = (table = null) => {
    setEditingId(table?._id || null)
    setForm(table ? { tableNumber: table.tableNumber, capacity: table.capacity } : emptyForm)
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const data = { tableNumber: form.tableNumber, capacity: Number(form.capacity) }
      if (editingId) await updateTable(editingId, data)
      else await createTable(data)
      setModalOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      setError('')
      await loadTables()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save table')
    }
  }

  const handleStatus = async (id, status) => {
    try {
      await updateTableStatus(id, status)
      setStatusMenuId(null)
      await loadTables()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update table status')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteTable(id)
      await loadTables()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete table')
    }
  }

  const showQr = async (table) => {
    try {
      const response = await getQrCodeUrl(table._id)
      setQrModal({ table, url: response.data.data.url })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate QR code')
    }
  }

  const statusClass = {
    free: 'border border-success bg-success/10 text-success',
    occupied: 'border border-danger bg-danger/10 text-danger',
    reserved: 'border border-warning bg-warning/10 text-warning',
  }

  return <main className="mx-auto max-w-6xl p-6">
    <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold text-secondary">Table Management</h1><button className="btn-primary" onClick={() => openForm()} type="button">+ Add Table</button></div>
    {error && <p className="mb-4 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {tables.map((table) => <article className="card p-4 text-center" key={table._id}>
        <p className="text-3xl font-bold text-secondary">{table.tableNumber}</p>
        <p className="text-sm text-gray-500">Capacity: {table.capacity}</p>
        <div className="relative mt-2"><button className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass[table.status]}`} onClick={() => setStatusMenuId(statusMenuId === table._id ? null : table._id)} type="button">{table.status}</button>{statusMenuId === table._id && <div className="absolute left-1/2 z-10 mt-1 w-32 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-1 text-left shadow-lg">{statuses.map((status) => <button className="block w-full rounded px-3 py-2 text-left text-sm capitalize hover:bg-gray-50" key={status} onClick={() => handleStatus(table._id, status)} type="button">{status}</button>)}</div>}</div>
        <div className="mt-4 flex justify-center gap-2"><button className="btn-secondary flex items-center gap-1 px-3 py-1 text-sm" onClick={() => showQr(table)} type="button"><QrCode size={15} /> Show QR</button><button aria-label={`Edit table ${table.tableNumber}`} className="text-gray-400 hover:text-primary" onClick={() => openForm(table)} type="button"><Pencil size={18} /></button><button aria-label={`Delete table ${table.tableNumber}`} className="text-gray-400 hover:text-danger" onClick={() => handleDelete(table._id)} type="button"><Trash2 size={18} /></button></div>
      </article>)}
    </div>

    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form className="card w-full max-w-sm" onSubmit={handleSubmit}><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-secondary">{editingId ? 'Edit Table' : 'Add Table'}</h2><button aria-label="Close" className="text-gray-400 hover:text-secondary" onClick={() => setModalOpen(false)} type="button"><X size={20} /></button></div><label className="mb-4 block text-sm font-medium text-secondary">Table number<input className="input-field mt-1" required value={form.tableNumber} onChange={(event) => setForm({ ...form, tableNumber: event.target.value })} /></label><label className="block text-sm font-medium text-secondary">Capacity<input className="input-field mt-1" min="1" required type="number" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label><div className="mt-6 flex justify-end gap-3"><button className="btn-secondary" onClick={() => setModalOpen(false)} type="button">Cancel</button><button className="btn-primary" type="submit">Save</button></div></form></div>}
    {qrModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="card w-full max-w-sm text-center"><h2 className="mb-4 font-semibold text-secondary">Table {qrModal.table.tableNumber} QR Code</h2><div className="mx-auto w-fit rounded-lg border border-gray-200 bg-white p-4"><QRCodeCanvas size={220} value={qrModal.url} /></div><p className="mt-3 break-all text-xs text-gray-400">{qrModal.url}</p><button className="btn-secondary mt-4" onClick={() => setQrModal(null)} type="button">Close</button></div></div>}
  </main>
}

export default TableManagement