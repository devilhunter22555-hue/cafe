import { ChefHat, ClipboardList, FileText, LayoutGrid, LogOut, Package, Receipt, ShoppingCart, Store, TrendingUp, Truck, Users, UtensilsCrossed } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navigationCards = [
    { title: 'Manage Menu', description: 'Organize dishes and categories.', path: '/dashboard/menu', icon: UtensilsCrossed },
    { title: 'Manage Tables', description: 'Track tables and reservations.', path: '/dashboard/tables', icon: LayoutGrid },
    { title: 'New Order', description: 'Start a new customer order.', path: '/dashboard/pos', icon: ShoppingCart },
    { title: 'Kitchen Display', description: 'Keep up with active orders.', path: '/dashboard/kitchen', icon: ChefHat },
    { title: 'Billing', description: 'Review payments and invoices.', path: '/dashboard/billing', icon: Receipt },
    { title: 'Bill History', description: 'Browse completed bills and payment totals.', path: '/dashboard/bills', icon: FileText },
    ...(user?.role === 'owner' || user?.role === 'manager' ? [{ title: 'Staff Management', description: 'Manage restaurant staff and access.', path: '/dashboard/staff', icon: Users }] : []),
    ...(user?.role === 'owner' || user?.role === 'manager' ? [{ title: 'Suppliers', description: 'Manage supplier records and contacts.', path: '/dashboard/suppliers', icon: Truck }] : []),
    ...(user?.role === 'owner' || user?.role === 'manager' ? [{ title: 'Purchase Orders', description: 'Track stock purchases and deliveries.', path: '/dashboard/purchase-orders', icon: ClipboardList }] : []),
    ...(user?.role === 'owner' || user?.role === 'manager' ? [{ title: 'Analytics', description: 'Track revenue, trends, and top sellers.', path: '/dashboard/analytics', icon: TrendingUp }] : []),
    ...(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'cashier' ? [{ title: 'Inventory', description: 'Track stock levels and adjustments.', path: '/dashboard/inventory', icon: Package }] : []),
  ]

  return <main className="min-h-screen bg-gray-50">
    <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm"><div className="flex items-center gap-3"><Store className="text-primary" /><span className="text-xl font-bold text-secondary">Restaurant POS</span></div><div className="flex items-center gap-4"><span className="text-sm text-gray-600">Welcome, {user?.name || 'there'}</span><button className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm" onClick={logout} type="button"><LogOut size={16} /> Logout</button></div></header>
    <section className="p-6 md:p-8"><h1 className="mb-2 text-2xl font-bold text-secondary">Welcome back!</h1><p className="mb-8 text-gray-500">Here's what's happening today</p><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{navigationCards.map(({ title, description, path, icon: Icon }) => <button className="card cursor-pointer text-left transition-all hover:-translate-y-0.5 hover:shadow-lg" key={path} onClick={() => navigate(path)} type="button"><span className="flex w-fit rounded-full bg-primary/10 p-3"><Icon className="text-primary" size={24} /></span><span className="mt-3 block font-semibold text-secondary">{title}</span><span className="mt-1 block text-sm text-gray-500">{description}</span></button>)}</div></section>
  </main>
}

export default Dashboard
