import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Send
} from 'lucide-react'
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
import {
  getCategoryBreakdown,
  getSalesByDay,
  getSalesSummary,
  getTopSellingItems,
  sendDailyReportEmail,
  sendMonthlyReportEmail
} from '../api/reportApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const primaryColor = '#6F4E37'
const accentColor = '#C98A52'
const paymentColors = ['#6F4E37', '#C98A52', '#4F8A5A']

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
  const [sendingType, setSendingType] = useState('')
  const [reportNotice, setReportNotice] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      getSalesSummary(range.from, range.to),
      getSalesByDay(range.from, range.to),
      getTopSellingItems(range.from, range.to, 10),
      getCategoryBreakdown(range.from, range.to)
    ])
      .then(([summaryResponse, dailyResponse, itemsResponse, categoryResponse]) => {
        if (!active) return
        setSummary(summaryResponse.data.data)
        setSalesByDay(dailyResponse.data.data || [])
        setTopItems(itemsResponse.data.data || [])
        setCategories(categoryResponse.data.data || [])
        setError('')
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load analytics')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [branchId, range.from, range.to])

  const paymentData = useMemo(
    () => [
      { name: 'Cash', value: Number(summary?.paymentModeBreakdown?.cash) || 0 },
      { name: 'Card', value: Number(summary?.paymentModeBreakdown?.card) || 0 },
      { name: 'UPI', value: Number(summary?.paymentModeBreakdown?.upi) || 0 }
    ],
    [summary]
  )

  const applyQuickRange = (days) => {
    setRange(rangeFor(days))
    setActiveRange(String(days))
  }

  const handleTriggerReport = async (type) => {
    setSendingType(type)
    setReportNotice(null)
    try {
      const res =
        type === 'daily'
          ? await sendDailyReportEmail()
          : await sendMonthlyReportEmail()
      setReportNotice({
        type: 'success',
        message: res.data?.message || `Sales report (${type}) processed.`,
        subject: res.data?.data?.subject
      })
    } catch (err) {
      setReportNotice({
        type: 'error',
        message:
          err.response?.data?.message ||
          `Failed to send ${type} sales report.`
      })
    } finally {
      setSendingType('')
    }
  }

  const hasData = Boolean(summary?.totalBills || salesByDay.length || topItems.length || categories.length)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">Sales &amp; Business Analytics</h1>
          <p className="mt-1 text-sm text-[#7A7068]">
            Revenue trend charts, popular dishes, category performance, and payment breakdown
          </p>
        </div>

        {/* Date Filter Pills + Manual Email Report Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={Boolean(sendingType)}
            onClick={() => handleTriggerReport('daily')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#6F4E37]/30 bg-white px-3.5 py-2 text-xs font-bold text-[#6F4E37] shadow-2xs transition-all hover:bg-[#6F4E37] hover:text-white disabled:opacity-60"
          >
            <Mail size={14} />
            <span>{sendingType === 'daily' ? 'Sending Daily...' : 'Send Daily Report'}</span>
          </button>

          <button
            type="button"
            disabled={Boolean(sendingType)}
            onClick={() => handleTriggerReport('monthly')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6F4E37] px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#2B2118] disabled:opacity-60"
          >
            <Send size={13} />
            <span>{sendingType === 'monthly' ? 'Sending Monthly...' : 'Send Monthly Report'}</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#EBE7DF] bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => applyQuickRange(1)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeRange === '1'
                  ? 'bg-[#6F4E37] text-white shadow-xs'
                  : 'text-[#7A7068] hover:text-[#2B2118]'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange(7)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeRange === '7'
                  ? 'bg-[#6F4E37] text-white shadow-xs'
                  : 'text-[#7A7068] hover:text-[#2B2118]'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => applyQuickRange(30)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeRange === '30'
                  ? 'bg-[#6F4E37] text-white shadow-xs'
                  : 'text-[#7A7068] hover:text-[#2B2118]'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {reportNotice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs font-semibold ${
            reportNotice.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-[#C75C5C]'
              : 'border-emerald-200 bg-emerald-50 text-[#2B2118]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {reportNotice.type === 'error' ? (
              <AlertCircle size={16} className="text-[#C75C5C] shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-[#4F8A5A] shrink-0" />
            )}
            <span>
              {reportNotice.subject ? `${reportNotice.subject} — ` : ''}
              {reportNotice.message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReportNotice(null)}
            className="text-xs font-bold text-[#7A7068] hover:text-[#2B2118]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Date Pickers */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#EBE7DF] bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">From</span>
          <input
            type="date"
            value={range.from}
            onChange={(e) => {
              setRange((curr) => ({ ...curr, from: e.target.value }))
              setActiveRange('')
            }}
            className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3 py-1.5 text-xs font-medium text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">To</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => {
              setRange((curr) => ({ ...curr, to: e.target.value }))
              setActiveRange('')
            }}
            className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3 py-1.5 text-xs font-medium text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-[#7A7068]">Crunching café report numbers...</div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                Total Revenue
              </span>
              <p className="mt-1 text-2xl font-extrabold text-[#6F4E37]">
                {money(summary?.totalRevenue)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                Settled Bills
              </span>
              <p className="mt-1 text-2xl font-extrabold text-[#2B2118]">
                {summary?.totalBills || 0}
              </p>
            </div>

            <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                Average Ticket Size
              </span>
              <p className="mt-1 text-2xl font-extrabold text-[#2B2118]">
                {money(summary?.avgBillValue)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                Tax Collected (GST)
              </span>
              <p className="mt-1 text-2xl font-extrabold text-[#4F8A5A]">
                {money((Number(summary?.totalTax?.cgst) || 0) + (Number(summary?.totalTax?.sgst) || 0))}
              </p>
            </div>
          </div>

          {!hasData ? (
            <div className="rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-12 text-center text-sm text-[#7A7068]">
              No sales or billing records available for this selected date range.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Daily Sales Trend Chart */}
              <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-xs lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#2B2118]">Daily Revenue Trend</h3>
                    <p className="text-xs text-[#7A7068]">Gross sales across the period</p>
                  </div>
                </div>
                <ResponsiveContainer height={260} width="100%">
                  <LineChart data={salesByDay}>
                    <CartesianGrid stroke="#EBE7DF" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#7A7068', fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: '#7A7068', fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip formatter={(value) => money(value)} />
                    <Line
                      dataKey="revenue"
                      name="Revenue"
                      stroke={primaryColor}
                      strokeWidth={3}
                      dot={{ r: 4, fill: primaryColor }}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-[#2B2118] mb-1">Payment Modes</h3>
                <p className="text-xs text-[#7A7068] mb-4">Distribution by payment type</p>
                <ResponsiveContainer height={240} width="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {paymentData.map((entry, index) => (
                        <Cell fill={paymentColors[index]} key={entry.name} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(value)} />
                    <Legend
                      formatter={(value, entry) => (
                        <span className="text-xs text-[#2B2118]">
                          {value}: <strong>{money(entry.payload.value)}</strong>
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Selling Dishes */}
              <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-xs">
                <h3 className="text-base font-bold text-[#2B2118] mb-1">Top Selling Items</h3>
                <p className="text-xs text-[#7A7068] mb-4">Volume by units sold</p>
                <ResponsiveContainer height={240} width="100%">
                  <BarChart data={topItems} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid stroke="#EBE7DF" strokeDasharray="3 3" />
                    <XAxis allowDecimals={false} type="number" tick={{ fill: '#7A7068', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={85} tick={{ fill: '#2B2118', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="totalQty" fill={accentColor} radius={[0, 6, 6, 0]} name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue by Category */}
              <div className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-xs lg:col-span-2">
                <h3 className="text-base font-bold text-[#2B2118] mb-1">Revenue by Category</h3>
                <p className="text-xs text-[#7A7068] mb-4">Category contribution to overall gross sales</p>
                <div className="space-y-4">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <div key={category.categoryName} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-[#2B2118]">{category.categoryName}</span>
                          <span className="text-[#6F4E37]">
                            {Number(category.percentage || 0).toFixed(1)}% ({money(category.totalRevenue)})
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-[#F7F5F2] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#6F4E37] transition-all duration-500"
                            style={{ width: `${Math.min(Number(category.percentage) || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#7A7068]">No category data for this date range.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Analytics
