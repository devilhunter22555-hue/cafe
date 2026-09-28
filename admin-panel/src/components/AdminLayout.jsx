import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Store,
  User,
  Users,
  X,
} from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { getRestaurants } from '../api/adminApi.js'
import { StatusBadge } from './ui/AdminUI.jsx'

function AdminLayout() {
  const { admin, logout } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [tenants, setTenants] = useState([])

  useEffect(() => {
    let active = true
    getRestaurants()
      .then((res) => {
        if (active) setTenants(res.data || [])
      })
      .catch(() => null)
    return () => {
      active = false
    }
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    window.location.assign('/login')
  }

  const navSections = [
    {
      section: 'Super Admin',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: 'Café Management',
          path: '/dashboard/cafes',
          icon: Store,
          exact: false,
          matchAlso: ['/dashboard/restaurants/'],
        },
        {
          name: 'Admins',
          path: '/dashboard/admins',
          icon: Users,
          exact: false,
        },
        {
          name: 'Reports',
          path: '/dashboard/reports',
          icon: BarChart3,
          exact: false,
        },
      ],
    },
    {
      section: 'Finance & System',
      items: [
        {
          name: 'Subscription Plans',
          path: '/dashboard/plans',
          icon: CreditCard,
          exact: false,
        },
        {
          name: 'Settings',
          path: '/dashboard/settings',
          icon: Settings,
          exact: false,
        },
      ],
    },
  ]

  const getPageBreadcrumb = () => {
    if (location.pathname === '/dashboard/cafes') {
      return { section: 'Super Admin', title: 'Café Management' }
    }
    if (
      location.pathname.startsWith('/dashboard/cafes/') ||
      location.pathname.startsWith('/dashboard/restaurants/')
    ) {
      return { section: 'Café Management', title: 'Café Account Details' }
    }
    if (location.pathname === '/dashboard/admins') {
      return { section: 'Super Admin', title: 'Café Administrators' }
    }
    if (location.pathname === '/dashboard/reports') {
      return { section: 'Super Admin', title: 'Performance Reports & Audit Logs' }
    }
    if (location.pathname === '/dashboard/plans') {
      return { section: 'Finance & System', title: 'Subscription Plans' }
    }
    if (location.pathname === '/dashboard/settings') {
      return { section: 'Finance & System', title: 'Settings & Preferences' }
    }
    return { section: 'Super Admin', title: 'Dashboard' }
  }

  const breadcrumb = getPageBreadcrumb()

  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase()
    if (!q) return []
    return tenants
      .filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.ownerName?.toLowerCase().includes(q) ||
          t.owner?.name?.toLowerCase().includes(q) ||
          t.owner?.email?.toLowerCase().includes(q) ||
          t.city?.toLowerCase().includes(q)
      )
      .slice(0, 5)
  }, [globalSearch, tenants])

  const suspendedTenants = useMemo(
    () => tenants.filter((t) => !t.isActive),
    [tenants]
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F5F2] text-[#241B15]">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#241B15]/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#E8E1DA] bg-white transition-all duration-200 ease-out lg:static lg:translate-x-0 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Top Brand Header */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-[#E8E1DA] ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          }`}
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-3 min-w-0"
            title="Super Admin Console"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6F4E37] text-white shadow-xs">
              <Coffee size={20} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold tracking-tight text-[#241B15]">
                  Café Platform
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#6F4E37]">
                  <ShieldCheck size={11} />
                  <span>Super Admin</span>
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Button (Desktop) */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8E1DA] bg-[#F7F5F2] text-[#81766D] hover:bg-[#6F4E37] hover:text-white hover:border-[#6F4E37] transition-colors ${
              isCollapsed ? 'absolute -right-3.5 top-5 z-20 shadow-xs bg-white' : ''
            }`}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Close Button (Mobile) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-[#81766D] hover:bg-[#F7F5F2] lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {navSections.map((group) => (
            <div key={group.section}>
              {!isCollapsed && (
                <span className="block px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#81766D]">
                  {group.section}
                </span>
              )}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const extraMatch = (item.matchAlso || []).some((prefix) =>
                    location.pathname.startsWith(prefix)
                  )
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path) || extraMatch

                  return (
                    <div key={item.path} className="relative group">
                      <NavLink
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                          isCollapsed ? 'justify-center px-0' : ''
                        } ${
                          isActive
                            ? 'bg-[#6F4E37]/10 text-[#6F4E37] font-bold'
                            : 'text-[#81766D] hover:bg-[#F7F5F2] hover:text-[#241B15]'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#6F4E37]" />
                        )}
                        <Icon
                          size={18}
                          className={`shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                            isActive
                              ? 'text-[#6F4E37]'
                              : 'text-[#81766D] group-hover:text-[#241B15]'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </NavLink>

                      {/* Tooltip when collapsed */}
                      {isCollapsed && (
                        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#2B2118] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          {item.name}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>
          ))}

          {/* Quick Tenant Jump List in Sidebar (when expanded) */}
          {!isCollapsed && tenants.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#81766D]">
                  Cafés ({tenants.length})
                </span>
                <Link
                  to="/dashboard/cafes"
                  className="text-[10px] font-bold text-[#6F4E37] hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {tenants.slice(0, 6).map((t) => {
                  const isCurrentTenant =
                    location.pathname === `/dashboard/cafes/${t._id}` ||
                    location.pathname === `/dashboard/restaurants/${t._id}`
                  return (
                    <Link
                      key={t._id}
                      to={`/dashboard/cafes/${t._id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        isCurrentTenant
                          ? 'bg-[#6F4E37] text-white font-semibold shadow-2xs'
                          : 'text-[#81766D] hover:bg-[#F7F5F2] hover:text-[#241B15]'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Store size={14} className="shrink-0" />
                        <span className="truncate">{t.name}</span>
                      </span>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          t.isActive ? 'bg-[#4F8A5A]' : 'bg-[#C75C5C]'
                        }`}
                        title={t.isActive ? 'ACTIVE' : 'INACTIVE'}
                      />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Admin Profile & Logout */}
        <div className="border-t border-[#E8E1DA] p-3.5">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? 'justify-center' : 'mb-3 px-1.5'
            }`}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6F4E37]/12 text-xs font-extrabold text-[#6F4E37]"
              title={admin?.name || 'Super Admin'}
            >
              {admin?.name?.slice(0, 2).toUpperCase() || 'SA'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#241B15]">
                  {admin?.name || 'Super Admin'}
                </p>
                <p className="truncate text-[11px] text-[#81766D]">
                  {admin?.email || 'admin@platform.com'}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/70 py-2 text-xs font-semibold text-[#81766D] transition-all hover:border-[#C75C5C]/30 hover:bg-[#C75C5C]/10 hover:text-[#C75C5C] ${
              isCollapsed ? 'mt-2 px-0' : ''
            }`}
          >
            <LogOut size={14} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#E8E1DA] bg-white px-4 sm:px-6 lg:px-8">
          {/* Left: Hamburger + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-[#E8E1DA] p-2 text-[#81766D] hover:bg-[#F7F5F2] hover:text-[#241B15] lg:hidden"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#81766D]">
                <span>{breadcrumb.section}</span>
                <ChevronRight size={13} className="text-[#81766D]/60" />
                <span className="font-bold text-[#241B15] truncate">
                  {breadcrumb.title}
                </span>
              </div>
              <h1 className="truncate text-base font-bold text-[#241B15] sm:hidden">
                {breadcrumb.title}
              </h1>
            </div>
          </div>

          {/* Center / Right: Global Search + Notifications + Profile Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Global Search */}
            <div className="relative hidden md:block w-64 lg:w-72">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
              />
              <input
                type="text"
                value={globalSearch}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 180)}
                onChange={(e) => {
                  setGlobalSearch(e.target.value)
                  setSearchOpen(true)
                }}
                placeholder="Quick search café, owner, city..."
                className="w-full rounded-xl border border-[#E8E1DA] bg-[#F7F5F2] py-1.5 pl-9 pr-3 text-xs text-[#241B15] placeholder:text-[#81766D]/70 transition-all focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/15"
              />

              {/* Global Search Dropdown */}
              {searchOpen && globalSearch.trim() && (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-[#E8E1DA] bg-white p-2 shadow-xl">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#81766D]">
                    Café Accounts
                  </p>
                  {searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          onMouseDown={() => {
                            navigate(`/dashboard/cafes/${item._id}`)
                            setGlobalSearch('')
                            setSearchOpen(false)
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs hover:bg-[#F7F5F2]"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-[#241B15] truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-[#81766D] truncate">
                              {item.email || item.owner?.email || 'No email'}
                            </p>
                          </div>
                          <StatusBadge
                            status={item.isActive ? 'active' : 'inactive'}
                            label={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-2.5 py-3 text-xs text-[#81766D]">
                      No matching café accounts found.
                    </p>
                  )}
                  <div className="mt-1 border-t border-[#F7F5F2] pt-1">
                    <button
                      type="button"
                      onMouseDown={() => {
                        navigate('/dashboard/cafes')
                        setGlobalSearch('')
                        setSearchOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-[#6F4E37] hover:bg-[#F7F5F2]"
                    >
                      <Store size={13} />
                      <span>Go to Café Management</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev)
                  setUserDropdownOpen(false)
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/70 text-[#241B15] transition-colors hover:bg-white hover:border-[#6F4E37]/40"
                title="Notifications"
              >
                <Bell size={16} />
                {suspendedTenants.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C98A5B]" />
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl border border-[#E8E1DA] bg-white p-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#F7F5F2] pb-2.5 px-1">
                      <span className="text-xs font-bold text-[#241B15]">
                        Platform Activity
                      </span>
                      <span className="badge-coffee text-[10px]">
                        {tenants.length} Cafés
                      </span>
                    </div>

                    <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto">
                      <div className="flex items-start gap-2.5 rounded-xl bg-[#F7F5F2]/60 p-2.5 text-xs">
                        <CheckCircle2
                          size={15}
                          className="mt-0.5 shrink-0 text-[#4F8A5A]"
                        />
                        <div>
                          <p className="font-semibold text-[#241B15]">
                            {tenants.filter((t) => t.isActive).length} Active Café Accounts
                          </p>
                          <p className="text-[11px] text-[#81766D]">
                            All active tenant workspaces are operational.
                          </p>
                        </div>
                      </div>

                      {suspendedTenants.map((st) => (
                        <button
                          key={st._id}
                          type="button"
                          onClick={() => {
                            navigate(`/dashboard/cafes/${st._id}`)
                            setNotifOpen(false)
                          }}
                          className="flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left text-xs hover:bg-[#F7F5F2]"
                        >
                          <Building2
                            size={15}
                            className="mt-0.5 shrink-0 text-[#C75C5C]"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#241B15] truncate">
                              {st.name} is inactive
                            </p>
                            <p className="text-[11px] text-[#81766D]">
                              Click to review café status
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen((prev) => !prev)
                  setNotifOpen(false)
                }}
                className="flex items-center gap-2.5 rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/70 px-3 py-1.5 text-xs font-semibold text-[#241B15] transition-all hover:bg-white hover:border-[#6F4E37]/40"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#6F4E37] text-[10px] font-bold text-white">
                  {admin?.name?.slice(0, 2).toUpperCase() || 'SA'}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {admin?.name || 'Super Admin'}
                </span>
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl border border-[#E8E1DA] bg-white p-1.5 shadow-xl">
                    <div className="px-3 py-2.5 border-b border-[#F7F5F2]">
                      <p className="text-xs font-bold text-[#241B15]">
                        {admin?.name || 'Super Admin'}
                      </p>
                      <p className="text-[11px] text-[#81766D] truncate">
                        {admin?.email || 'admin@platform.com'}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/dashboard/cafes"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#241B15] hover:bg-[#F7F5F2]"
                      >
                        <Store size={14} className="text-[#6F4E37]" />
                        <span>Café Management</span>
                      </Link>
                      <Link
                        to="/dashboard/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#241B15] hover:bg-[#F7F5F2]"
                      >
                        <Settings size={14} className="text-[#C98A5B]" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-[#F7F5F2] pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#C75C5C] hover:bg-[#C75C5C]/10 transition-colors"
                      >
                        <LogOut size={14} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
