import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChefHat,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Package,
  Receipt,
  ShoppingCart,
  Store,
  Tag,
  TrendingUp,
  Truck,
  UserCircle,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const navSections = [
  {
    title: 'OPERATIONS',
    items: [
      {
        label: 'New Order',
        path: '/dashboard/pos',
        icon: ShoppingCart,
        roles: ['owner', 'manager', 'cashier', 'waiter'],
      },
      {
        label: 'Kitchen',
        path: '/dashboard/kitchen',
        icon: ChefHat,
        roles: ['owner', 'manager', 'kitchen'],
      },
      {
        label: 'Billing',
        path: '/dashboard/billing',
        icon: Receipt,
        roles: ['owner', 'manager', 'cashier'],
      },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      {
        label: 'Menu',
        path: '/dashboard/menu',
        icon: UtensilsCrossed,
        roles: ['owner', 'manager'],
      },
      {
        label: 'Tables',
        path: '/dashboard/tables',
        icon: LayoutGrid,
        roles: ['owner', 'manager', 'cashier', 'waiter'],
      },
      {
        label: 'Inventory',
        path: '/dashboard/inventory',
        icon: Package,
        roles: ['owner', 'manager', 'cashier'],
      },
      {
        label: 'Suppliers',
        path: '/dashboard/suppliers',
        icon: Truck,
        roles: ['owner', 'manager'],
      },
      {
        label: 'Purchase Orders',
        path: '/dashboard/purchase-orders',
        icon: ClipboardList,
        roles: ['owner', 'manager'],
      },
      {
        label: 'Staff',
        path: '/dashboard/staff',
        icon: Users,
        roles: ['owner', 'manager'],
      },
      {
        label: 'Salary',
        path: '/dashboard/salary',
        icon: Wallet,
        roles: ['owner', 'manager'],
      },
      {
        label: 'My Salary',
        path: '/dashboard/my-salary',
        icon: Wallet,
        roles: ['manager', 'cashier', 'kitchen', 'waiter'],
      },
      {
        label: 'Customers',
        path: '/dashboard/customers',
        icon: UserCircle,
        roles: ['owner', 'manager', 'cashier'],
      },
      {
        label: 'Coupons',
        path: '/dashboard/coupons',
        icon: Tag,
        roles: ['owner', 'manager'],
      },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      {
        label: 'Analytics',
        path: '/dashboard/analytics',
        icon: TrendingUp,
        roles: ['owner', 'manager'],
      },
      {
        label: 'Insights',
        path: '/dashboard/insights',
        icon: Lightbulb,
        roles: ['owner', 'manager'],
      },
      {
        label: 'Bill History',
        path: '/dashboard/bills',
        icon: FileText,
        roles: ['owner', 'manager', 'cashier'],
      },
    ],
  },
]

function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const role = user?.role || ''

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)

  // Full-bleed mode for POS and KitchenDisplay to preserve dedicated edge-to-edge workspaces
  const isFullBleed =
    location.pathname.startsWith('/dashboard/pos') ||
    location.pathname.startsWith('/dashboard/kitchen')

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      {/* Persistent Left Sidebar */}
      <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-100 bg-white select-none z-20">
        {/* Top Branding */}
        <div className="p-6 shrink-0">
          <Link to="/dashboard" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
              <Store size={22} />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight text-secondary leading-tight">
                Restaurant POS
              </span>
              <span className="block truncate text-xs font-medium text-gray-400">
                Staff Terminal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
          <div>
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/8 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <LayoutDashboard size={18} className="shrink-0" />
              <span className="truncate">Dashboard</span>
            </NavLink>
          </div>

          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 tracking-wider uppercase">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                          isActive
                            ? 'bg-primary/8 text-primary font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Sidebar: User & Logout */}
        <div className="shrink-0 border-t border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 font-bold text-primary text-sm">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-secondary">
                {user?.name || 'Staff Member'}
              </p>
              <p className="truncate text-xs text-gray-400 capitalize">
                {user?.role || 'Staff'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-danger"
          >
            <LogOut size={14} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 bg-canvas overflow-y-auto ${isFullBleed ? '' : 'p-8'}`}>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
