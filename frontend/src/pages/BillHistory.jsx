import { useEffect, useMemo, useState } from 'react'
import { Receipt } from 'lucide-react'
import { getBills } from '../api/billApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function money(value) {
  return currency.format(Number(value) || 0)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function BillHistory() {
  const { branchId } = useAuth()
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [bills, setBills] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadBills = async () => {
    setLoading(true)
    try {
      const response = await getBills(from, to)
      setBills(response.data.data)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load bill history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBills()
  }, [branchId])

  const summary = useMemo(() => bills.reduce((result, bill) => {
    result.count += 1
    result.revenue += Number(bill.total) || 0
    if (result.byMode[bill.paymentMode] !== undefined) result.byMode[bill.paymentMode] += Number(bill.total) || 0
    return result
  }, { count: 0, revenue: 0, byMode: { cash: 0, card: 0, upi: 0 } }), [bills])

  return <main className="mx-auto max-w-5xl p-6">
    <h1 className="mb-6 text-2xl font-bold text-secondary">Bill History</h1>
    <form className="mb-6 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); loadBills() }}>
      <label className="text-sm text-gray-600">From<input className="input-field mt-1" onChange={(event) => setFrom(event.target.value)} type="date" value={from} /></label>
      <label className="text-sm text-gray-600">To<input className="input-field mt-1" onChange={(event) => setTo(event.target.value)} type="date" value={to} /></label>
      <button className="btn-primary px-4 py-2" disabled={loading} type="submit">{loading ? 'Loading...' : 'Apply'}</button>
    </form>

    {error && <p className="mb-6 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}

    <section className="card mb-6 flex flex-wrap gap-6">
      <div><p className="text-sm text-gray-500">Total bills</p><p className="text-xl font-bold text-secondary">{summary.count}</p></div>
      <div><p className="text-sm text-gray-500">Total revenue</p><p className="text-xl font-bold text-primary">{money(summary.revenue)}</p></div>
      <div className="flex flex-wrap items-end gap-3 text-sm text-gray-600"><span>Cash {money(summary.byMode.cash)}</span><span>Card {money(summary.byMode.card)}</span><span>UPI {money(summary.byMode.upi)}</span></div>
    </section>

    {bills.length ? <section className="space-y-3">{bills.map((bill) => <article className="card flex items-center justify-between p-4" key={bill._id}>
      <div><p className="font-semibold text-secondary">{bill.billNumber}</p><p className="text-xs text-gray-400">{new Date(bill.createdAt).toLocaleString()}</p><p className="mt-1 text-sm text-gray-500">{bill.items.reduce((count, item) => count + Number(item.qty || 0), 0)} items</p></div>
      <div className="flex items-center gap-4"><span className="text-lg font-bold text-primary">{money(bill.total)}</span><span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{bill.paymentMode}</span></div>
    </article>)}</section> : <div className="flex min-h-[40vh] flex-col items-center justify-center text-gray-400"><Receipt className="text-gray-300" size={48} /><p className="mt-3">No bills in this date range</p></div>}
  </main>
}

export default BillHistory
