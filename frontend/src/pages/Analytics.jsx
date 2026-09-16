import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { getCategoryBreakdown, getSalesByDay, getSalesSummary, getTopSellingItems } from '../api/reportApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const primaryColor = '#EA580C'
const paymentColors = ['#EA580C', '#16A34A', '#F59E0B']

function money(value) {
  return currency.format(Number(value) || 0)
}

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function rangeFor(days) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  return { from: formatDate(start), to: formatDate(end) }
}

function Analytics() {
  const { branchId } = useAuth()
  const [range, setRange] = useState(() => rangeFor(7))
  const [activeRange, setActiveRange] = useState('7')
  const [summary, setSummary] = useState(null)
  const [salesByDay, setSalesByDay] = useState([])
  const [topItems, setTopItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      getSalesSummary(range.from, range.to),
      getSalesByDay(range.from, range.to),
      getTopSellingItems(range.from, range.to, 10),
      getCategoryBreakdown(range.from, range.to)
    ])
      .then(([summaryResponse, dailyResponse, itemsResponse, categoryResponse]) => {
        if (!active) return
        setSummary(summaryResponse.data.data)
        setSalesByDay(dailyResponse.data.data)
        setTopItems(itemsResponse.data.data)
        setCategories(categoryResponse.data.data)
        setError('')
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load analytics')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [branchId, range.from, range.to])

  const paymentData = useMemo(() => [
    { name: 'Cash', value: Number(summary?.paymentModeBreakdown?.cash) || 0 },
    { name: 'Card', value: Number(summary?.paymentModeBreakdown?.card) || 0 },
    { name: 'UPI', value: Number(summary?.paymentModeBreakdown?.upi) || 0 }
  ], [summary])

  const applyQuickRange = (days) => {
    setRange(rangeFor(days))
    setActiveRange(String(days))
  }

  const hasData = Boolean(summary?.totalBills || salesByDay.length || topItems.length || categories.length)

  return <main className="mx-auto max-w-6xl p-6">
    <h1 className="mb-2 text-2xl font-bold text-secondary">Analytics</h1>
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <label className="text-sm text-gray-600">From<input className="input-field mt-1" onChange={(event) => { setRange((current) => ({ ...current, from: event.target.value })); setActiveRange('') }} type="date" value={range.from} /></label>
      <label className="text-sm text-gray-600">To<input className="input-field mt-1" onChange={(event) => { setRange((current) => ({ ...current, to: event.target.value })); setActiveRange('') }} type="date" value={range.to} /></label>
      <div className="flex gap-2"><button className={`btn-secondary px-3 py-2 text-sm ${activeRange === '1' ? 'border-primary bg-primary/10 text-primary' : ''}`} onClick={() => applyQuickRange(1)} type="button">Today</button><button className={`btn-secondary px-3 py-2 text-sm ${activeRange === '7' ? 'border-primary bg-primary/10 text-primary' : ''}`} onClick={() => applyQuickRange(7)} type="button">Last 7 Days</button><button className={`btn-secondary px-3 py-2 text-sm ${activeRange === '30' ? 'border-primary bg-primary/10 text-primary' : ''}`} onClick={() => applyQuickRange(30)} type="button">Last 30 Days</button></div>
    </div>

    {error && <p className="mb-6 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}
    {loading ? <p className="py-12 text-center text-gray-500">Loading...</p> : <>
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[['Total Revenue', money(summary?.totalRevenue)], ['Total Bills', summary?.totalBills || 0], ['Avg Bill Value', money(summary?.avgBillValue)], ['Total Tax Collected', money((Number(summary?.totalTax?.cgst) || 0) + (Number(summary?.totalTax?.sgst) || 0))]].map(([label, value]) => <article className="card p-4" key={label}><p className="text-sm text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-secondary">{value}</p></article>)}
      </section>

      {!hasData ? <div className="card py-16 text-center text-gray-500">No analytics data for this date range.</div> : <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="card p-4 lg:col-span-2"><h2 className="mb-4 font-semibold text-secondary">Revenue Trend</h2><ResponsiveContainer height={250} width="100%"><LineChart data={salesByDay}><CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(value) => `₹${value}`} /><Tooltip formatter={(value) => money(value)} /><Line dataKey="revenue" dot={{ r: 3 }} name="Revenue" stroke={primaryColor} strokeWidth={3} type="monotone" /></LineChart></ResponsiveContainer></article>
        <article className="card p-4"><h2 className="mb-4 font-semibold text-secondary">Payment Methods</h2><ResponsiveContainer height={250} width="100%"><PieChart><Pie data={paymentData} dataKey="value" nameKey="name" outerRadius={82} label>{paymentData.map((entry, index) => <Cell fill={paymentColors[index]} key={entry.name} />)}</Pie><Tooltip formatter={(value) => money(value)} /><Legend formatter={(value, entry) => `${value}: ${money(entry.payload.value)}`} /></PieChart></ResponsiveContainer></article>
        <article className="card p-4"><h2 className="mb-4 font-semibold text-secondary">Top Selling Items</h2><ResponsiveContainer height={250} width="100%"><BarChart data={topItems} layout="vertical" margin={{ left: 12, right: 12 }}><CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" /><XAxis allowDecimals={false} type="number" /><YAxis dataKey="name" type="category" width={80} /><Tooltip /><Bar dataKey="totalQty" fill={primaryColor} name="Quantity" /></BarChart></ResponsiveContainer></article>
        <article className="card p-4 lg:col-span-2"><h2 className="mb-4 font-semibold text-secondary">Revenue by Category</h2><div className="space-y-4">{categories.length ? categories.map((category) => <div className="flex items-center gap-3" key={category.categoryName}><span className="w-28 shrink-0 truncate text-sm text-gray-600">{category.categoryName}</span><div className="h-3 flex-1 rounded-full bg-gray-100"><div className="h-3 rounded-full bg-primary" style={{ width: `${Math.min(Number(category.percentage) || 0, 100)}%` }} /></div><span className="w-28 shrink-0 text-right text-sm text-gray-600">{Number(category.percentage || 0).toFixed(1)}% · {money(category.totalRevenue)}</span></div>) : <p className="text-sm text-gray-500">No category data for this date range.</p>}</div></article>
      </section>}
    </>}
  </main>
}

export default Analytics
