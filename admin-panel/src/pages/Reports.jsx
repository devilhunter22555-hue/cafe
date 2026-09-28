import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  IndianRupee,
  Mail,
  RefreshCw,
  Send,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  getAuditLogs,
  getSuperAdminPerformanceReport,
  sendDailySalesReport,
  sendMonthlySalesReport,
} from '../api/adminApi.js'
import {
  EmptyState,
  LoadingState,
  StatCard,
  StatusBadge,
  Toast,
} from '../components/ui/AdminUI.jsx'

const rangeOptions = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
]

function formatCurrency(val) {
  return `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Reports() {
  const [range, setRange] = useState('30d')
  const [report, setReport] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingType, setSendingType] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const loadReports = useCallback(async (selectedRange = range) => {
    setLoading(true)
    setError('')
    try {
      const [reportRes, logsRes] = await Promise.all([
        getSuperAdminPerformanceReport(selectedRange),
        getAuditLogs({ limit: 30 }).catch(() => ({ data: [] })),
      ])
      setReport(reportRes.data || null)
      setAuditLogs(logsRes.data || [])
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Unable to load platform performance reports.'
      )
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    loadReports(range)
  }, [range, loadReports])

  const handleSendEmailReport = async (type) => {
    setSendingType(type)
    try {
      const res =
        type === 'daily'
          ? await sendDailySalesReport()
          : await sendMonthlySalesReport()
      setToast({
        message:
          res.message ||
          `${type === 'daily' ? 'Daily' : 'Monthly'} sales report emailed successfully.`,
        type: 'success',
      })
    } catch (err) {
      setToast({
        message:
          err?.response?.data?.message ||
          `Failed to send ${type} report. Check SMTP settings in Backend/.env.`,
        type: 'error',
      })
    } finally {
      setSendingType('')
    }
  }

  const totals = report?.totals || {
    totalCafes: 0,
    activeCafes: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
  }
  const cafeBreakdown = report?.cafeBreakdown || []
  const maxRevenue = Math.max(...cafeBreakdown.map((c) => Number(c.revenue) || 0), 1)

  return (
    <div className="space-y-8">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-xs">
            <BarChart3 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#241B15]">
              Super Admin Reports &amp; Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-[#81766D]">
              Per-café orders, revenue, customer reach, and administrative audit trail
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Filter */}
          <div className="inline-flex rounded-xl border border-[#E8E1DA] bg-white p-1">
            {rangeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  range === opt.id
                    ? 'bg-[#6F4E37] text-white shadow-2xs'
                    : 'text-[#81766D] hover:text-[#241B15]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleSendEmailReport('daily')}
            disabled={Boolean(sendingType)}
            className="btn-secondary text-xs px-3.5 py-2"
          >
            <Mail size={14} className="text-[#6F4E37]" />
            <span>
              {sendingType === 'daily' ? 'Sending...' : 'Send Daily Report'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSendEmailReport('monthly')}
            disabled={Boolean(sendingType)}
            className="btn-secondary text-xs px-3.5 py-2"
          >
            <Send size={14} className="text-[#6F4E37]" />
            <span>
              {sendingType === 'monthly' ? 'Sending...' : 'Send Monthly Report'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => loadReports(range)}
            disabled={loading}
            className="btn-secondary text-xs px-3 py-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-[#C75C5C]/30 bg-[#C75C5C]/10 p-4 text-sm font-medium text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Period Revenue"
          value={formatCurrency(totals.totalRevenue)}
          subtitle="Billed sales across all cafés"
          icon={IndianRupee}
          tone="coffee"
          loading={loading}
        />
        <StatCard
          title="Period Orders"
          value={Number(totals.totalOrders || 0).toLocaleString('en-IN')}
          subtitle="Orders placed in selected period"
          icon={ShoppingBag}
          tone="accent"
          loading={loading}
        />
        <StatCard
          title="Customers Served"
          value={Number(totals.totalCustomers || 0).toLocaleString('en-IN')}
          subtitle="Unique café customers"
          icon={Users}
          tone="success"
          loading={loading}
        />
        <StatCard
          title="Active Cafés"
          value={`${totals.activeCafes} / ${totals.totalCafes}`}
          subtitle="Operational café workspaces"
          icon={Store}
          tone="dark"
          loading={loading}
        />
      </div>

      {/* Per-Café Performance Overview Table */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E8E1DA] px-6 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#6F4E37]" />
            <h2 className="text-base font-extrabold text-[#241B15]">
              Café Performance Overview ({rangeOptions.find((r) => r.id === range)?.label})
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#81766D]">
            Real-time isolated tenant metrics
          </span>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingState message="Calculating per-café metrics..." rows={4} />
          </div>
        ) : cafeBreakdown.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Store}
              title="No café performance data yet"
              description="Onboard cafés to view their orders, revenue, and customer metrics."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E1DA] bg-[#F7F5F2]/70 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <th className="py-3.5 pl-6 pr-3">Café</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5 text-right">Orders</th>
                  <th className="px-3 py-3.5 text-right">Revenue</th>
                  <th className="px-3 py-3.5 text-right">Avg Order</th>
                  <th className="px-3 py-3.5 text-right">Customers</th>
                  <th className="px-3 py-3.5 text-right">Menu Items</th>
                  <th className="py-3.5 pl-3 pr-6">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F5F2] text-xs sm:text-sm">
                {cafeBreakdown.map((item) => {
                  const pct = Math.round(((Number(item.revenue) || 0) / maxRevenue) * 100)
                  return (
                    <tr key={item._id} className="hover:bg-[#F7F5F2]/50">
                      <td className="py-4 pl-6 pr-3">
                        <Link
                          to={`/dashboard/cafes/${item._id}`}
                          className="font-extrabold text-[#241B15] hover:text-[#6F4E37]"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[11px] text-[#81766D]">
                          {item.city || item.ownerEmail || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge
                          status={item.isActive ? 'active' : 'inactive'}
                          label={item.status}
                        />
                      </td>
                      <td className="px-3 py-4 text-right font-bold text-[#241B15]">
                        {Number(item.orders || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-4 text-right font-extrabold text-[#6F4E37]">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="px-3 py-4 text-right text-xs text-[#81766D]">
                        {formatCurrency(item.avgOrderValue)}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold text-[#241B15]">
                        {Number(item.customers || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-4 text-right text-xs text-[#81766D]">
                        {item.menuItems || 0}
                      </td>
                      <td className="py-4 pl-3 pr-6 w-44">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F7F5F2]">
                          <div
                            className="h-full rounded-full bg-[#6F4E37]"
                            style={{ width: `${Math.max(pct, item.revenue > 0 ? 6 : 0)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Audit Log Section */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E8E1DA] px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#6F4E37]" />
            <h2 className="text-base font-extrabold text-[#241B15]">
              Super Admin Audit Log
            </h2>
          </div>
          <span className="badge-coffee text-[10px]">{auditLogs.length} Recent Actions</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#81766D]">
            No Super Admin audit actions recorded yet. Actions like creating, editing, or activating/deactivating a café will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E1DA] bg-[#F7F5F2]/70 text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
                  <th className="py-3 pl-6 pr-3">Action</th>
                  <th className="px-3 py-3">Café</th>
                  <th className="px-3 py-3">Details</th>
                  <th className="px-3 py-3">Performed By</th>
                  <th className="py-3 pl-3 pr-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F5F2] text-xs">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#F7F5F2]/50">
                    <td className="py-3.5 pl-6 pr-3 font-extrabold text-[#6F4E37]">
                      {log.action}
                    </td>
                    <td className="px-3 py-3.5 font-bold text-[#241B15]">
                      {log.cafeId ? (
                        <Link
                          to={`/dashboard/cafes/${log.cafeId}`}
                          className="hover:text-[#6F4E37] hover:underline"
                        >
                          {log.cafeName || 'View Café'}
                        </Link>
                      ) : (
                        log.cafeName || '—'
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-[#241B15]">{log.details}</td>
                    <td className="px-3 py-3.5 text-[#81766D]">
                      {log.performedByEmail || 'Super Admin'}
                    </td>
                    <td className="py-3.5 pl-3 pr-6 text-right text-[#81766D]">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        {formatDateTime(log.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Reports
