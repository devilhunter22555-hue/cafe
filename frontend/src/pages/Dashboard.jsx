import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChefHat,
  Coffee,
  IndianRupee,
  LayoutGrid,
  Plus,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getSalesSummary, getTopSellingItems } from '../api/reportApi.js'
import { getTables } from '../api/tableApi.js'
import { getOrders } from '../api/orderApi.js'

function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning ☀️'
  if (hour < 17) return 'Good Afternoon ☕'
  return 'Good Evening 🌙'
}

function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [topItems, setTopItems] = useState([])
  const [tables, setTables] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const isOwnerOrManager = user?.role === 'owner' || user?.role === 'manager'

  useEffect(() => {
    let active = true
    const today = new Date().toISOString().slice(0, 10)

    const promises = [
      getTables().then((res) => (active ? setTables(res.data.data || []) : null)),
      getOrders('open').then((res) => (active ? setRecentOrders(res.data.data?.slice(0, 5) || []) : null)),
    ]

    if (isOwnerOrManager) {
      promises.push(
        getSalesSummary(today, today)
          .then((res) => (active ? setSummary(res.data.data) : null))
          .catch(() => null),
        getTopSellingItems(today, today, 5)
          .then((res) => (active ? setTopItems(res.data.data || []) : null))
          .catch(() => null)
      )
    }

    Promise.allSettled(promises).finally(() => {
      if (active) setLoading(false)
    })

    return () => {
      active = false
    }
  }, [isOwnerOrManager])

  const greeting = getTimeGreeting()
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  const occupiedCount = tables.filter((t) => t.status === 'occupied').length
  const totalTables = tables.length

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Top Welcome Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-secondary">
            {greeting}, {user?.name || 'Partner'}
          </h1>
          <p className="mt-1 text-sm text-[#7A7068]">
            Here's what's happening at your café today · <span className="font-medium text-secondary">{formattedDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/dashboard/pos" className="btn-primary text-xs sm:text-sm gap-2">
            <ShoppingCart size={16} />
            <span>New Order</span>
          </Link>
          {isOwnerOrManager && (
            <Link to="/dashboard/menu" className="btn-secondary text-xs sm:text-sm gap-2">
              <Plus size={16} />
              <span>Add Dish</span>
            </Link>
          )}
        </div>
      </div>

      {/* Real Statistics Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <div className="card flex items-center justify-between border-l-4 border-l-primary">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#A89F95]">
              Today's Sales
            </p>
            <p className="mt-2 text-2xl font-bold text-secondary">
              {loading ? '...' : `₹${Number(summary?.totalRevenue || 0).toLocaleString('en-IN')}`}
            </p>
            <p className="mt-1 text-[11px] text-[#7A7068]">Total billed revenue today</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <IndianRupee size={22} />
          </div>
        </div>

        {/* Total Orders */}
        <div className="card flex items-center justify-between border-l-4 border-l-accent">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#A89F95]">
              Total Orders
            </p>
            <p className="mt-2 text-2xl font-bold text-secondary">
              {loading ? '...' : (summary?.totalBills ?? recentOrders.length)}
            </p>
            <p className="mt-1 text-[11px] text-[#7A7068]">Completed invoices today</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Receipt size={22} />
          </div>
        </div>

        {/* Tables Capacity */}
        <div className="card flex items-center justify-between border-l-4 border-l-success">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#A89F95]">
              Table Occupancy
            </p>
            <p className="mt-2 text-2xl font-bold text-secondary">
              {loading ? '...' : `${occupiedCount} / ${totalTables}`}
            </p>
            <p className="mt-1 text-[11px] text-[#7A7068]">
              {totalTables > 0
                ? `${Math.round((occupiedCount / totalTables) * 100)}% dining room capacity`
                : 'Floor status'}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
            <LayoutGrid size={22} />
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="card flex items-center justify-between border-l-4 border-l-[#8C6549]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#A89F95]">
              Avg. Order Value
            </p>
            <p className="mt-2 text-2xl font-bold text-secondary">
              {loading ? '...' : `₹${Math.round(summary?.avgBillValue || 0).toLocaleString('en-IN')}`}
            </p>
            <p className="mt-1 text-[11px] text-[#7A7068]">Ticket size average</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8C6549]/15 text-primary">
            <TrendingUp size={22} />
          </div>
        </div>
      </section>

      {/* Quick Actions Shortcuts */}
      <section className="card bg-gradient-to-r from-primary/5 via-white to-accent/5 p-6 border-[#E0D9D0]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-secondary">Quick Workstation Actions</h2>
              <p className="text-xs text-[#7A7068] mt-0.5">
                Speedily navigate between POS terminal, live kitchen KOTs, and table management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/dashboard/pos"
              className="btn-primary text-xs px-4 py-2 gap-2"
            >
              <ShoppingCart size={15} />
              <span>POS Terminal</span>
            </Link>
            <Link
              to="/dashboard/kitchen"
              className="btn-secondary text-xs px-4 py-2 gap-2"
            >
              <ChefHat size={15} className="text-primary" />
              <span>Kitchen Display</span>
            </Link>
            <Link
              to="/dashboard/tables"
              className="btn-secondary text-xs px-4 py-2 gap-2"
            >
              <LayoutGrid size={15} className="text-accent" />
              <span>Tables Floor</span>
            </Link>
            {isOwnerOrManager && (
              <Link
                to="/dashboard/analytics"
                className="btn-secondary text-xs px-4 py-2 gap-2"
              >
                <TrendingUp size={15} className="text-success" />
                <span>Sales Reports</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Two Column Grid: Popular Items + Recent Active Orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Popular Items Card */}
        <section className="card">
          <div className="mb-4 flex items-center justify-between border-b border-[#F2ECE4] pb-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={18} className="text-primary" />
              <h2 className="font-bold text-secondary text-base">Popular Dishes Today</h2>
            </div>
            <Link
              to="/dashboard/analytics"
              className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
            >
              <span>Full report</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {topItems.length > 0 ? (
            <div className="divide-y divide-[#F2ECE4]">
              {topItems.map((item, idx) => (
                <div key={item.name || idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2ECE4] text-xs font-bold text-secondary">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-secondary">{item.name}</p>
                      <p className="text-xs text-[#7A7068]">{item.totalQty} ordered</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    ₹{Number(item.totalRevenue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[#7A7068]">
              <Coffee size={32} className="mx-auto text-[#D5CEC4] mb-2" />
              <p>No sales recorded yet today.</p>
              <p className="text-xs text-[#A89F95] mt-1">Dishes ordered via POS will appear here.</p>
            </div>
          )}
        </section>

        {/* Live Active Orders / Tables */}
        <section className="card">
          <div className="mb-4 flex items-center justify-between border-b border-[#F2ECE4] pb-3">
            <div className="flex items-center gap-2">
              <ChefHat size={18} className="text-accent" />
              <h2 className="font-bold text-secondary text-base">Live Active Orders</h2>
            </div>
            <Link
              to="/dashboard/kitchen"
              className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
            >
              <span>Kitchen KOT</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="divide-y divide-[#F2ECE4]">
              {recentOrders.map((ord) => (
                <div key={ord._id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-secondary text-sm">
                        {ord.orderType === 'takeaway' ? 'Takeaway' : `Table ${ord.tableNumber || ord.tableId?.tableNumber || '—'}`}
                      </span>
                      <span className="badge-warning text-[10px]">
                        {ord.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A7068] mt-0.5">
                      {ord.items?.length || 0} items · {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Link
                    to="/dashboard/billing"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View Bill →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[#7A7068]">
              <Receipt size={32} className="mx-auto text-[#D5CEC4] mb-2" />
              <p>No open dine-in or takeaway orders right now.</p>
              <Link
                to="/dashboard/pos"
                className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
              >
                Create a new order in POS
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Dashboard
