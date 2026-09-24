import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Coffee,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  X
} from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { getMenu } from '../api/customerApi.js'
import CartDrawer from '../components/CartDrawer.jsx'
import { useCustomer } from '../context/CustomerContext.jsx'

const money = (value) => `₹${Number(value).toFixed(2)}`

function Menu() {
  const { qrToken } = useParams()
  const { isVerified, table, token } = useCustomer()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [cart, setCart] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isVerified || !token) return
    getMenu()
      .then((response) => {
        setCategories(response.data.data.categories || [])
        setItems(response.data.data.items || [])
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || 'Unable to load the café menu.')
      )
  }, [isVerified, token])

  const visibleItems = useMemo(() => {
    let filtered =
      activeCategory === 'all'
        ? items
        : items.filter(
            (item) => String(item.categoryId?._id || item.categoryId) === activeCategory
          )

    if (search.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
      )
    }

    return filtered
  }, [activeCategory, items, search])

  const itemCount = cart.reduce((count, item) => count + item.qty, 0)
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0)

  const updateCart = (menuItemId, quantityChange, menuItem) => {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.menuItemId === menuItemId)
      if (!existing && quantityChange > 0) {
        return [
          ...currentCart,
          { menuItemId, name: menuItem.name, price: menuItem.price, qty: quantityChange }
        ]
      }
      if (!existing) return currentCart
      const qty = existing.qty + quantityChange
      return qty > 0
        ? currentCart.map((item) =>
            item.menuItemId === menuItemId ? { ...item, qty } : item
          )
        : currentCart.filter((item) => item.menuItemId !== menuItemId)
    })
  }

  if (!isVerified || !token) return <Navigate to={`/t/${qrToken}`} replace />

  return (
    <main className="min-h-screen bg-[#F7F5F2] pb-28">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-20 border-b border-[#EBE7DF] bg-white/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6F4E37] text-white">
              <Coffee size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#2B2118]">Café Bistro</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Table {table?.tableNumber || '—'}
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Open Cart"
            onClick={() => setDrawerOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] text-[#2B2118] hover:bg-white transition-all"
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#6F4E37] text-[10px] font-bold text-white shadow-xs">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-3 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coffee, bakery, bites..."
            className="w-full rounded-2xl border border-[#EBE7DF] bg-white py-2 pl-9 pr-8 text-xs text-[#2B2118] focus:border-[#6F4E37] focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <nav className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-[#6F4E37] text-white shadow-xs'
                : 'border border-[#EBE7DF] bg-white text-[#7A7068] hover:text-[#2B2118]'
            }`}
          >
            All Items ({items.length})
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => setActiveCategory(category._id)}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeCategory === category._id
                  ? 'bg-[#6F4E37] text-white shadow-xs'
                  : 'border border-[#EBE7DF] bg-white text-[#7A7068] hover:text-[#2B2118]'
              }`}
            >
              {category.name}
            </button>
          ))}
        </nav>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-[#C75C5C]">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Menu Items List */}
        <section className="space-y-3 pt-1">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => {
              const cartItem = cart.find((cartEntry) => cartEntry.menuItemId === item._id)

              return (
                <article
                  key={item._id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#EBE7DF] bg-white p-4 shadow-xs transition-all hover:border-[#6F4E37]/30"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-3.5 w-3.5 items-center justify-center rounded-xs border ${
                          item.isVeg ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </span>
                      <h3 className="truncate text-sm font-bold text-[#2B2118]">
                        {item.name}
                      </h3>
                    </div>

                    <p className="mt-1 text-sm font-extrabold text-[#6F4E37]">
                      {money(item.price)}
                    </p>

                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-[#7A7068]">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Add / Stepper CTA */}
                  <div className="shrink-0">
                    {cartItem ? (
                      <div className="flex items-center rounded-xl border border-[#6F4E37] bg-[#F7F5F2] p-0.5">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name}`}
                          onClick={() => updateCart(item._id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6F4E37] hover:bg-white transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#2B2118]">
                          {cartItem.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name}`}
                          onClick={() => updateCart(item._id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6F4E37] hover:bg-white transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateCart(item._id, 1, item)}
                        className="rounded-xl border border-[#6F4E37] bg-white px-4 py-1.5 text-xs font-bold text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white transition-all shadow-2xs active:scale-95"
                      >
                        Add +
                      </button>
                    )}
                  </div>
                </article>
              )
            })
          ) : (
            <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-8 text-center">
              <UtensilsCrossed className="text-gray-300 mb-2" size={32} />
              <p className="text-xs font-semibold text-[#7A7068]">No dishes in this section</p>
            </div>
          )}
        </section>
      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-lg">
          <div className="flex items-center justify-between rounded-2xl bg-[#2B2118] px-5 py-3.5 text-white shadow-xl">
            <div>
              <span className="text-xs font-medium text-stone-300">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
              </span>
              <p className="text-base font-extrabold text-[#C98A52]">{money(total)}</p>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#6F4E37] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#8B654C] transition-all"
            >
              <ShoppingCart size={15} />
              <span>Review Order</span>
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Cart Drawer */}
      {drawerOpen && (
        <CartDrawer
          cartItems={cart}
          onClose={() => setDrawerOpen(false)}
          onUpdate={(menuItemId, quantityChange) => updateCart(menuItemId, quantityChange)}
        />
      )}
    </main>
  )
}

export default Menu
