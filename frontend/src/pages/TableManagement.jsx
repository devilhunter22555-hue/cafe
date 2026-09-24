import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  LayoutGrid,
  MoreVertical,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  Users,
  UtensilsCrossed,
  X
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import {
  createTable,
  deleteTable,
  getQrCodeUrl,
  getTables,
  updateTable,
  updateTableStatus
} from '../api/tableApi.js'

const emptyForm = { tableNumber: '', capacity: 4 }
const statuses = [
  { value: 'free', label: 'Available', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dot-emerald' },
  { value: 'occupied', label: 'Occupied', color: 'bg-rose-50 text-rose-700 border-rose-200 dot-rose' },
  { value: 'reserved', label: 'Reserved', color: 'bg-amber-50 text-amber-700 border-amber-200 dot-amber' }
]

function TableManagement() {
  const [tables, setTables] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [statusMenuId, setStatusMenuId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [qrModal, setQrModal] = useState(null)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const loadTables = async () => {
    try {
      const res = await getTables()
      setTables(res.data.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load tables')
    }
  }

  useEffect(() => {
    loadTables()
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
      if (editingId) {
        await updateTable(editingId, data)
      } else {
        await createTable(data)
      }
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

  const handleDelete = async (id, tableNumber) => {
    if (!window.confirm(`Are you sure you want to delete Table ${tableNumber}?`)) return
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

  const statusBadge = (status) => {
    switch (status) {
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-[#C75C5C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C75C5C]" />
            Occupied
          </span>
        )
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-[#D99A5B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D99A5B]" />
            Reserved
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#4F8A5A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F8A5A]" />
            Available
          </span>
        )
    }
  }

  const counts = {
    total: tables.length,
    free: tables.filter((t) => t.status === 'free').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length
  }

  const filteredTables = filterStatus === 'all'
    ? tables
    : tables.filter((t) => t.status === filterStatus)

  return (
    <div className="space-y-6">
      {/* Header and Summary Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">Table Management</h1>
          <p className="mt-1 text-sm text-[#7A7068]">
            Monitor dining floor layout, table statuses, and self-order QR codes
          </p>
        </div>

        <button
          type="button"
          onClick={() => openForm()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6F4E37] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2B2118] transition-all active:scale-[0.98]"
        >
          <Plus size={18} />
          <span>Add New Table</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats and Filter Chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${
            filterStatus === 'all'
              ? 'border-[#6F4E37] bg-white ring-2 ring-[#6F4E37]/20 shadow-sm'
              : 'border-[#EBE7DF] bg-white hover:border-[#6F4E37]/30'
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">Total Tables</span>
          <span className="mt-1 text-2xl font-bold text-[#2B2118]">{counts.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('free')}
          className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${
            filterStatus === 'free'
              ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-[#EBE7DF] bg-white hover:border-emerald-400'
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="mt-1 text-2xl font-bold text-emerald-700">{counts.free}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('occupied')}
          className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${
            filterStatus === 'occupied'
              ? 'border-rose-500 bg-white ring-2 ring-rose-500/20 shadow-sm'
              : 'border-[#EBE7DF] bg-white hover:border-rose-400'
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Occupied
          </span>
          <span className="mt-1 text-2xl font-bold text-rose-700">{counts.occupied}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('reserved')}
          className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${
            filterStatus === 'reserved'
              ? 'border-amber-500 bg-white ring-2 ring-amber-500/20 shadow-sm'
              : 'border-[#EBE7DF] bg-white hover:border-amber-400'
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Reserved
          </span>
          <span className="mt-1 text-2xl font-bold text-amber-700">{counts.reserved}</span>
        </button>
      </div>

      {/* Tables Grid */}
      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTables.map((table) => {
            const isMenuOpen = statusMenuId === table._id

            return (
              <div
                key={table._id}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs transition-all hover:border-[#6F4E37]/30 hover:shadow-md"
              >
                {/* Table Header: Table Number & Status Pill */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-[#7A7068]">Table</span>
                    <h3 className="text-2xl font-extrabold text-[#2B2118]">
                      #{table.tableNumber}
                    </h3>
                  </div>

                  {/* Interactive Status Selector Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStatusMenuId(isMenuOpen ? null : table._id)}
                      className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    >
                      {statusBadge(table.status)}
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1.5 w-36 overflow-hidden rounded-xl border border-[#EBE7DF] bg-white p-1 shadow-lg animate-in fade-in zoom-in-95">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Set Status
                        </div>
                        {['free', 'occupied', 'reserved'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatus(table._id, st)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                              table.status === st
                                ? 'bg-[#6F4E37]/10 text-[#6F4E37]'
                                : 'text-[#2B2118] hover:bg-[#F7F5F2]'
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                st === 'free'
                                  ? 'bg-[#4F8A5A]'
                                  : st === 'occupied'
                                  ? 'bg-[#C75C5C]'
                                  : 'bg-[#D99A5B]'
                              }`}
                            />
                            {st === 'free' ? 'Available' : st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Capacity Meta */}
                <div className="my-4 flex items-center gap-2 text-sm text-[#7A7068]">
                  <Users size={16} />
                  <span>Seats up to <strong className="text-[#2B2118]">{table.capacity}</strong> guests</span>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between border-t border-[#F7F5F2] pt-3">
                  <button
                    type="button"
                    onClick={() => showQr(table)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#F7F5F2] px-3 py-1.5 text-xs font-semibold text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white transition-all shadow-2xs"
                  >
                    <QrCode size={14} />
                    <span>View QR</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openForm(table)}
                      title="Edit Table"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-[#F7F5F2] hover:text-[#2B2118] transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(table._id, table.tableNumber)}
                      title="Delete Table"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-[#C75C5C] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-8 text-center">
          <UtensilsCrossed className="text-gray-300 mb-3" size={40} />
          <h3 className="font-bold text-[#2B2118]">No tables match this filter</h3>
          <p className="mt-1 text-sm text-[#7A7068]">Try selecting a different status filter or add new tables</p>
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="mb-5 flex items-center justify-between border-b border-[#F7F5F2] pb-3">
              <h2 className="text-lg font-bold text-[#2B2118]">
                {editingId ? 'Edit Table' : 'Add New Table'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Table Number / Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1, 12, Patio-3"
                  value={form.tableNumber}
                  onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#F7F5F2] pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-[#EBE7DF] px-4 py-2 text-sm font-semibold text-[#7A7068] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#6F4E37] px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#2B2118]"
              >
                Save Table
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#EBE7DF] bg-white p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="mb-4 flex items-center justify-between border-b border-[#F7F5F2] pb-3 text-left">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">Digital Menu</span>
                <h3 className="text-lg font-bold text-[#2B2118]">
                  Table {qrModal.table.tableNumber} QR
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-5 inline-block rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-sm">
              <QRCodeCanvas size={200} value={qrModal.url} includeMargin />
            </div>

            <p className="text-xs text-[#7A7068]">
              Scan with camera to order directly from this table
            </p>
            <p className="mt-1 break-all rounded-lg bg-[#F7F5F2] p-2 text-[11px] font-mono text-[#7A7068]">
              {qrModal.url}
            </p>

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setQrModal(null)}
                className="rounded-xl border border-[#EBE7DF] px-5 py-2 text-sm font-semibold text-[#7A7068] hover:bg-gray-50"
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

export default TableManagement