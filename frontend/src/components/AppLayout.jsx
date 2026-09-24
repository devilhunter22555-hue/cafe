import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Coffee,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Menu as MenuIcon,
  Package,
  Receipt,
  ShoppingCart,
  Tag,
  TrendingUp,
  Truck,
  User,
  UserCircle,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
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
        label: 'Kitchen Display',
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
        label: 'Salary Management',
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
        label: 'Customers CRM',
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
        label: 'Reports & Analytics',
        path: '/dashboard/analytics',
        icon: TrendingUp,
        roles: ['owner', 'manager'],
      },
      {
        label: 'Cost Insights',
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

const pageTitles = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/pos': 'Point of Sale (POS)',
  '/dashboard/kitchen': 'Live Kitchen Display',
  '/dashboard/billing': 'Order Billing & Checkout',
  '/dashboard/bills': 'Bill & Payment History',
  '/dashboard/menu': 'Menu & Recipe Management',
  '/dashboard/tables': 'Table Floor Management',
  '/dashboard/inventory': 'Inventory & Stock Control',
  '/dashboard/suppliers': 'Supplier Directory',
  '/dashboard/purchase-orders': 'Purchase Orders',
  '/dashboard/staff': 'Staff & Roles',
  '/dashboard/salary': 'Salary Management',
  '/dashboard/my-salary': 'My Salary',
  '/dashboard/customers': 'Customer CRM',
  '/dashboard/coupons': 'Discount Coupons',
  '/dashboard/analytics': 'Sales Reports & Analytics',
  '/dashboard/insights': 'Food Cost & Margin Insights',
}

function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const role = user?.role || ''

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles) return true
        if (!role) return true
        return item.roles.includes(role)
      }),
    }))
    .filter((section) => section.items.length > 0)

  const isFullBleed =
    location.pathname === '/dashboard/pos' ||
    location.pathname === '/dashboard/kitchen' ||
    location.pathname.startsWith('/dashboard/pos/') ||
    location.pathname.startsWith('/dashboard/kitchen/')

  const currentPageTitle = pageTitles[location.pathname] || 'Café Management'

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas text-secondary">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#2B2118]/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent / Collapsible Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#EBE7DF] bg-white transition-all duration-300 ease-in-out lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Top Branding */}
        <div className="flex h-16 items-center justify-between border-b border-[#EBE7DF] px-4">
          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Coffee size={22} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block truncate text-base font-bold tracking-tight text-secondary leading-tight">
                  Café POS
                </span>
                <span className="block truncate text-xs font-medium text-accent">
                  Staff Workspace
                </span>
              </div>
            )}
          </Link>

          {/* Close on mobile */}
          <button
            type="button"
            className="rounded-lg p-1.5 text-[#7A7068] hover:bg-[#F2ECE4] lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <NavLink
              to="/dashboard"
              end
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                    : 'text-[#7A7068] hover:bg-[#F2ECE4] hover:text-secondary'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title="Dashboard Overview"
            >
              <LayoutDashboard size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">Dashboard</span>}
            </NavLink>
          </div>

          {visibleSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-[#A89F95] uppercase">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'text-[#7A7068] hover:bg-[#F2ECE4] hover:text-secondary'
                      } ${collapsed ? 'justify-center' : ''}`
                    }
                    title={item.label}
                  >
                    <Icon size={19} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Collapse Toggle & Quick User Info */}
        <div className="shrink-0 border-t border-[#EBE7DF] bg-[#FAF8F5] p-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-bold text-primary text-sm">
              {(user?.name || 'C').charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-secondary">
                  {user?.name || 'Staff User'}
                </p>
                <p className="truncate text-[11px] capitalize text-[#7A7068]">
                  {user?.role || 'Staff'}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="mt-3 hidden w-full items-center justify-center gap-2 rounded-lg border border-[#E0D9D0] bg-white py-1.5 text-xs font-medium text-[#7A7068] shadow-2xs hover:bg-[#F2ECE4] hover:text-secondary lg:flex"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> <span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main Content View with Top Navbar */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#EBE7DF] bg-white px-4 md:px-6 z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger button */}
            <button
              type="button"
              className="rounded-xl border border-[#E0D9D0] p-2 text-[#7A7068] hover:bg-[#F2ECE4] hover:text-secondary lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar menu"
            >
              <MenuIcon size={20} />
            </button>

            {/* Breadcrumb & Title */}
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7A7068]">
                <span>Café</span>
                <span>/</span>
                <span className="font-medium text-accent">Workspace</span>
              </div>
              <h1 className="text-base font-bold text-secondary leading-tight truncate">
                {currentPageTitle}
              </h1>
            </div>
          </div>

          {/* Right actions: Live status badge & Profile dropdown */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#EBE7DF] bg-[#FAF8F5] px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-[#7A7068]">POS Terminal Active</span>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-[#EBE7DF] bg-white p-1.5 pr-3 shadow-2xs hover:border-[#D5CEC4] transition-all"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-semibold text-secondary leading-tight truncate max-w-[100px]">
                    {user?.name || 'Staff'}
                  </p>
                  <p className="text-[10px] capitalize text-[#7A7068]">
                    {user?.role || 'Staff'}
                  </p>
                </div>
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#EBE7DF] bg-white p-2 shadow-hover z-40">
                    <div className="border-b border-[#F2ECE4] px-3 py-2 mb-1">
                      <p className="text-sm font-semibold text-secondary">{user?.name}</p>
                      <p className="text-xs text-[#7A7068] truncate">{user?.email || 'Logged In'}</p>
                      <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                        {user?.role}
                      </span>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-secondary hover:bg-[#F2ECE4] transition-colors"
                    >
                      <User size={15} className="text-[#7A7068]" />
                      <span>Workspace Overview</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors mt-1"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main
          className={`flex-1 min-w-0 bg-canvas overflow-y-auto ${
            isFullBleed ? '' : 'p-4 sm:p-6 lg:p-8'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
