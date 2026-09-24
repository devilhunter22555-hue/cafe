import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChevronRight,
  Coffee,
  CreditCard,
  LayoutGrid,
  LogOut,
  Menu,
  Shield,
  ShieldCheck,
  Store,
  User,
  X
} from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

function AdminLayout() {
  const { admin, logout } = useAdminAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.assign('/login')
  }

  const navLinks = [
    {
      name: 'Café Accounts',
      path: '/dashboard',
      icon: Store,
      exact: true
    },
    {
      name: 'Subscription Plans',
      path: '/dashboard/plans',
      icon: CreditCard,
      exact: false
    }
  ]

  const getPageTitle = () => {
    if (location.pathname === '/dashboard/plans') return 'Subscription Plans'
    if (location.pathname.startsWith('/dashboard/restaurants/')) return 'Café Account Details'
    return 'Café Accounts & Tenants'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F5F2]">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#EBE7DF] bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-[#F7F5F2] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6F4E37] text-white shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-[#2B2118]">
                Café Platform
              </h2>
              <span className="inline-block rounded-full bg-[#6F4E37]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6F4E37]">
                Super Admin
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <span className="block px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              SaaS Management
            </span>
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path)

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#6F4E37]/10 text-[#6F4E37] shadow-2xs font-bold'
                        : 'text-[#7A7068] hover:bg-[#F7F5F2] hover:text-[#2B2118]'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#6F4E37]' : 'text-gray-400'} />
                    <span>{item.name}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="border-t border-[#F7F5F2] p-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6F4E37]/10 text-[#6F4E37] font-bold text-xs">
              {admin?.name?.slice(0, 2).toUpperCase() || 'SA'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#2B2118]">
                {admin?.name || 'Super Admin'}
              </p>
              <p className="truncate text-[11px] text-[#7A7068]">{admin?.email || 'admin@platform.com'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#EBE7DF] bg-white py-2 text-xs font-semibold text-[#7A7068] hover:border-rose-300 hover:bg-rose-50 hover:text-[#C75C5C] transition-all"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#EBE7DF] bg-white px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb & Title */}
            <div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#7A7068]">
                <span>SaaS Console</span>
                <ChevronRight size={12} />
                <span className="font-semibold text-[#2B2118]">{getPageTitle()}</span>
              </div>
              <h1 className="text-lg font-bold text-[#2B2118] sm:hidden">{getPageTitle()}</h1>
            </div>
          </div>

          {/* Right Header Status Pill */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              SaaS Multi-tenant Cloud Active
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3 py-1.5 text-xs font-semibold text-[#2B2118] hover:bg-white transition-all"
              >
                <User size={14} />
                <span>{admin?.name || 'Admin'}</span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-[#EBE7DF] bg-white p-1.5 shadow-lg animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#F7F5F2]">
                    <p className="text-xs font-bold text-[#2B2118]">{admin?.name}</p>
                    <p className="text-[11px] text-[#7A7068] truncate">{admin?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#C75C5C] hover:bg-rose-50 transition-colors mt-1"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Child Route Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
