import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { getMySalaryHistory } from '../api/salaryApi.js'

function formatMonth(month) {
  if (!month) return 'Unknown month'
  const [year, monthNumber] = month.split('-')
  return new Date(Number(year), Number(monthNumber) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function MySalary() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await getMySalaryHistory()
        setRecords(response.data?.data || [])
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load your salary history.')
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [])

  return <main className="p-6 max-w-2xl mx-auto"><h1 className="mb-6 flex items-center gap-3 text-2xl font-bold text-secondary"><Wallet className="text-primary" /> My Salary</h1>{error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}{loading ? <div className="card p-6 text-gray-500">Loading salary history...</div> : records.length === 0 ? <div className="card p-6 text-gray-400">No salary records yet</div> : <section className="space-y-3">{records.map((record) => <article className="card flex items-center justify-between gap-4 p-4" key={record._id || record.id}><div><p className="font-semibold text-secondary">{formatMonth(record.month)}</p>{record.status === 'paid' && <p className="mt-1 text-xs text-gray-400">Paid {record.paidAt ? new Date(record.paidAt).toLocaleDateString('en-IN') : ''}{record.paymentMode ? ` · ${record.paymentMode.replace('_', ' ')}` : ''}</p>}</div><div className="text-right"><p className="text-lg font-bold text-secondary">₹{Number(record.amount || 0).toLocaleString('en-IN')}</p><span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${record.status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{record.status}</span></div></article>)}</section>}</main>
}

export default MySalary
