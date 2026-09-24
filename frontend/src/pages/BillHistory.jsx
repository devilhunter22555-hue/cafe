import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Calendar, CreditCard, Filter, Receipt, Search, Wallet } from 'lucide-react'
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
  const [search, setSearch] = useState('')

  const loadBills = async () => {
    setLoading(true)
    try {
      const response = await getBills(from, to)
      setBills(response.data.data || [])
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

  const summary = useMemo(
    () =>
      bills.reduce(
        (result, bill) => {
          result.count += 1
          result.revenue += Number(bill.total) || 0
          if (result.byMode[bill.paymentMode] !== undefined) {
            result.byMode[bill.paymentMode] += Number(bill.total) || 0
          }
          return result
        },
        { count: 0, revenue: 0, byMode: { cash: 0, card: 0, upi: 0 } }
      ),
    [bills]
  )

  const filteredBills = useMemo(() => {
    if (!search.trim()) return bills
    const query = search.toLowerCase()
    return bills.filter(
      (b) =>
        b.billNumber?.toLowerCase().includes(query) ||
        b.paymentMode?.toLowerCase().includes(query)
    )
  }, [bills, search])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">Bill &amp; Settlement History</h1>
          <p className="mt-1 text-sm text-[#7A7068]">
            Historical archive of paid bills, payment modes, and daily revenue receipts
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Date Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#EBE7DF] bg-white p-4 shadow-xs">
        <form
          className="flex flex-wrap items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            loadBills()
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3 py-1.5 text-xs font-medium text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3 py-1.5 text-xs font-medium text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#6F4E37] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#2B2118] transition-all disabled:opacity-50"
          >
            {loading ? 'Filtering...' : 'Apply Filter'}
          </button>
        </form>

        <div className="relative min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bill number..."
            className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-1.5 pl-8 pr-3 text-xs text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Total Invoices
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#2B2118]">{summary.count}</p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Total Settled
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#6F4E37]">{money(summary.revenue)}</p>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Cash &amp; Card
          </span>
          <div className="mt-1 flex items-baseline gap-2 text-xs">
            <span className="font-bold text-[#2B2118]">Cash: {money(summary.byMode.cash)}</span>
            <span>•</span>
            <span className="font-bold text-[#2B2118]">Card: {money(summary.byMode.card)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
            Digital UPI / QR
          </span>
          <p className="mt-1 text-2xl font-extrabold text-[#4F8A5A]">{money(summary.byMode.upi)}</p>
        </div>
      </div>

      {/* Bills List */}
      {filteredBills.length > 0 ? (
        <div className="divide-y divide-[#EBE7DF] rounded-2xl border border-[#EBE7DF] bg-white shadow-xs overflow-hidden">
          {filteredBills.map((bill) => {
            const itemCount = (bill.items || []).reduce((sum, i) => sum + Number(i.qty || 0), 0)

            return (
              <div
                key={bill._id}
                className="flex flex-wrap items-center justify-between gap-4 p-4.5 transition-colors hover:bg-[#F7F5F2]/50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F5F2] text-[#6F4E37] border border-[#EBE7DF]">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#2B2118]">Bill #{bill.billNumber}</span>
                      <span className="rounded-full bg-[#F7F5F2] px-2 py-0.5 text-[11px] font-semibold text-[#7A7068] uppercase border border-[#EBE7DF]">
                        {bill.paymentMode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#7A7068]">
                      {new Date(bill.createdAt).toLocaleString()} • {itemCount} items
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-[#6F4E37]">
                    {money(bill.total)}
                  </span>
                  <p className="text-[11px] text-[#7A7068]">Settled &amp; Closed</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex min-h-[35vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-8 text-center">
          <Receipt className="text-gray-300 mb-3" size={40} />
          <h3 className="font-bold text-[#2B2118]">No bills found</h3>
          <p className="mt-1 text-sm text-[#7A7068]">
            No settled bills found for the selected date range
          </p>
        </div>
      )}
    </div>
  )
}

export default BillHistory
