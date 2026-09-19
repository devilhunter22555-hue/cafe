import { useEffect, useState } from 'react'
import { Wallet, X } from 'lucide-react'
import { generateMonthlySalaryRecords, getSalaryRecords, markSalaryPaid } from '../api/salaryApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const paymentModes = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
]

const roleStyles = {
  manager: 'bg-primary/10 text-primary',
  cashier: 'bg-success/10 text-success',
  kitchen: 'bg-warning/10 text-warning',
  waiter: 'bg-gray-200 text-gray-700',
}

function SalaryManagement() {
  const { user } = useAuth()
  const isAllowed = ['owner', 'manager'].includes(user?.role)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [paymentRecord, setPaymentRecord] = useState(null)
  const [paymentMode, setPaymentMode] = useState('cash')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const loadRecords = async () => {
    if (!month) return
    setLoading(true)
    setError('')
    try {
      const response = await getSalaryRecords(month)
      setRecords(response.data?.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load salary records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAllowed) loadRecords()
  }, [isAllowed, month])

  const handleGenerate = async () => {
    if (!month) return
    setGenerating(true)
    setError('')
    try {
      const response = await generateMonthlySalaryRecords(month)
      const created = response.data?.data?.created || 0
      setToast(`${created} salary record${created === 1 ? '' : 's'} created.`)
      await loadRecords()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate salary records.')
    } finally {
      setGenerating(false)
    }
  }

  const openPaymentModal = (record) => {
    setPaymentRecord(record)
    setPaymentMode('cash')
    setNote('')
  }

  const handleMarkPaid = async (event) => {
    event.preventDefault()
    if (!paymentRecord) return
    setPaying(true)
    setError('')
    try {
      await markSalaryPaid(paymentRecord._id || paymentRecord.id, paymentMode, note)
      setToast('Salary marked as paid.')
      setPaymentRecord(null)
      await loadRecords()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark salary as paid.')
    } finally {
      setPaying(false)
    }
  }

  if (!isAllowed) {
    return <main className="p-6"><div className="card mx-auto max-w-lg p-6 text-center"><h1 className="text-2xl font-bold text-secondary">Access denied</h1><p className="mt-3 text-gray-500">Only owners and managers can manage salaries.</p></div></main>
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold text-secondary"><Wallet className="text-primary" /> Salary Management</h1>

      <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-medium text-secondary">Month
          <input className="input-field mt-1" onChange={(event) => setMonth(event.target.value)} type="month" value={month} />
        </label>
        <button className="btn-primary" disabled={generating || !month} onClick={handleGenerate} type="button">{generating ? 'Generating...' : "Generate This Month's Records"}</button>
      </section>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-secondary px-4 py-3 text-sm text-white shadow-lg">{toast}</div>}

      {loading ? <div className="card p-6 text-gray-500">Loading salary records...</div> : records.length === 0 ? <div className="card p-6 text-gray-400">No salary records for this month.</div> : (
        <section className="space-y-3">
          {records.map((record) => {
            const staff = record.userId || {}
            const isPaid = record.status === 'paid'
            return <article className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between" key={record._id || record.id}>
              <div className="min-w-0 flex-1"><p className="font-semibold text-secondary">{staff.name || 'Staff member'}</p><span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${roleStyles[staff.role] || 'bg-gray-100 text-gray-700'}`}>{staff.role || 'staff'}</span></div>
              <p className="text-lg font-bold text-secondary">₹{Number(record.amount || 0).toLocaleString('en-IN')}</p>
              <div className="flex items-center gap-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${isPaid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{record.status}</span>{!isPaid && <button className="btn-primary px-3 py-1.5 text-sm" onClick={() => openPaymentModal(record)} type="button">Mark Paid</button>}</div>
            </article>
          })}
        </section>
      )}

      {paymentRecord && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><form className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onSubmit={handleMarkPaid}><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-secondary">Mark Salary Paid</h2><button className="rounded-full p-2 text-gray-500 hover:bg-slate-100" onClick={() => setPaymentRecord(null)} type="button"><X size={18} /></button></div><div className="space-y-4"><div><p className="mb-2 text-sm font-medium text-secondary">Payment mode</p><div className="grid grid-cols-3 gap-2">{paymentModes.map((option) => <button className={`rounded-lg border px-2 py-2 text-sm ${paymentMode === option.value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-600'}`} key={option.value} onClick={() => setPaymentMode(option.value)} type="button">{option.label}</button>)}</div></div><label className="block text-sm font-medium text-secondary">Note <span className="font-normal text-gray-400">(optional)</span><textarea className="input-field mt-1" onChange={(event) => setNote(event.target.value)} rows="3" value={note} /></label></div><div className="mt-6 flex justify-end gap-3"><button className="btn-secondary" onClick={() => setPaymentRecord(null)} type="button">Cancel</button><button className="btn-primary" disabled={paying} type="submit">{paying ? 'Saving...' : 'Confirm Payment'}</button></div></form></div>}
    </main>
  )
}

export default SalaryManagement
