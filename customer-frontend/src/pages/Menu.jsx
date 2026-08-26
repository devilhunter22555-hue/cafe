import { useEffect, useMemo, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { getMenu } from '../api/customerApi.js'
import CartDrawer from '../components/CartDrawer.jsx'
import { useCustomer } from '../context/CustomerContext.jsx'

const money = (value) => `\u20B9${Number(value).toFixed(2)}`

function Menu() {
  const { qrToken } = useParams()
  const { isVerified, table, token } = useCustomer()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isVerified || !token) return
    getMenu()
      .then((response) => {
        setCategories(response.data.data.categories)
        setItems(response.data.data.items)
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load the menu.'))
  }, [isVerified, token])

  const visibleItems = useMemo(() => activeCategory === 'all' ? items : items.filter((item) => String(item.categoryId?._id || item.categoryId) === activeCategory), [activeCategory, items])
  const itemCount = cart.reduce((count, item) => count + item.qty, 0)
  const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0)

  const updateCart = (menuItemId, quantityChange, menuItem) => {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.menuItemId === menuItemId)
      if (!existing && quantityChange > 0) return [...currentCart, { menuItemId, name: menuItem.name, price: menuItem.price, qty: quantityChange }]
      if (!existing) return currentCart
      const qty = existing.qty + quantityChange
      return qty > 0 ? currentCart.map((item) => item.menuItemId === menuItemId ? { ...item, qty } : item) : currentCart.filter((item) => item.menuItemId !== menuItemId)
    })
  }

  if (!isVerified || !token) return <Navigate to={`/t/${qrToken}`} replace />

  return <main className="min-h-screen bg-gray-100 pb-24">
    <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm"><h1 className="text-lg font-bold text-secondary">Table {table?.tableNumber || '—'}</h1><button aria-label="Open cart" className="relative text-secondary" onClick={() => setDrawerOpen(true)} type="button"><ShoppingCart size={24} />{itemCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">{itemCount}</span>}</button></header>
    <nav className="flex gap-2 overflow-x-auto px-4 py-3"><button className={`shrink-0 rounded-full px-4 py-2 text-sm ${activeCategory === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`} onClick={() => setActiveCategory('all')} type="button">All</button>{categories.map((category) => <button className={`shrink-0 rounded-full px-4 py-2 text-sm ${activeCategory === category._id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`} key={category._id} onClick={() => setActiveCategory(category._id)} type="button">{category.name}</button>)}</nav>
    {error && <p className="mx-4 mb-3 rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</p>}
    <section className="space-y-3 px-4 pb-24">{visibleItems.map((item) => {
      const cartItem = cart.find((cartEntry) => cartEntry.menuItemId === item._id)
      return <article className="flex justify-between rounded-xl bg-white p-4 shadow-sm" key={item._id}><div className="pr-3"><p className="font-semibold text-secondary"><span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${item.isVeg ? 'bg-success' : 'bg-danger'}`} />{item.name}</p><p className="mt-1 font-bold text-primary">{money(item.price)}</p>{item.description && <p className="mt-1 text-xs text-gray-400">{item.description}</p>}</div>{cartItem ? <div className="flex items-center gap-3 self-center rounded-lg border border-primary px-3 py-1.5"><button aria-label={`Decrease ${item.name}`} className="text-primary" onClick={() => updateCart(item._id, -1)} type="button">-</button><span className="text-sm font-medium">{cartItem.qty}</span><button aria-label={`Increase ${item.name}`} className="text-primary" onClick={() => updateCart(item._id, 1)} type="button">+</button></div> : <button className="self-center rounded-lg border border-primary px-4 py-1.5 text-sm text-primary" onClick={() => updateCart(item._id, 1, item)} type="button">Add</button>}</article>
    })}</section>
    {cart.length > 0 && <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between bg-primary px-4 py-3 text-white shadow-lg"><span>{itemCount} items | {money(total)}</span><button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary" onClick={() => setDrawerOpen(true)} type="button">View Cart</button></div>}
    {drawerOpen && <CartDrawer cartItems={cart} onClose={() => setDrawerOpen(false)} onUpdate={(menuItemId, quantityChange) => updateCart(menuItemId, quantityChange)} />}
  </main>
}

export default Menu
