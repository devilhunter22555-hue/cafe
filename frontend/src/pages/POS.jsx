import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Coffee,
  Loader2,
  Minus,
  Plus,
  Search,
  Send,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Utensils,
  UtensilsCrossed,
  X
} from 'lucide-react'
import { getCategories, getMenuItems } from '../api/menuApi.js'
import { addItemsToOrder, createOrder } from '../api/orderApi.js'
import { getTables } from '../api/tableApi.js'
import { joinBranch } from '../socket.js'
import { useAuth } from '../context/AuthContext.jsx'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function money(amount) {
  return currency.format(Number(amount) || 0)
}

function POS() {
  const { branchId } = useAuth()
  const [orderType, setOrderType] = useState('dine-in')
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [tables, setTables] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTable, setSelectedTable] = useState('')
  const [cart, setCart] = useState([])
  const [openOrders, setOpenOrders] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [recentlyAdded, setRecentlyAdded] = useState(null)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (branchId) {
      joinBranch(branchId)
    }
  }, [branchId])

  useEffect(() => {
    Promise.all([getCategories(), getMenuItems(), getTables()])
      .then(([categoryResponse, itemResponse, tableResponse]) => {
        setCategories(categoryResponse.data.data || [])
        setItems(itemResponse.data.data || [])
        setTables((tableResponse.data.data || []).filter((table) => table.status === 'free'))
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load POS data'))
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleItems = useMemo(() => {
    const categoryItems = selectedCategory === 'all'
      ? items
      : items.filter((item) => (item.categoryId?._id || item.categoryId) === selectedCategory)
    return categoryItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
  }, [items, search, selectedCategory])

  const subtotal = cart.reduce((total, item) => total + (Number(item.price) * item.qty), 0)
  const totalItemCount = cart.reduce((total, item) => total + item.qty, 0)
  const orderKey = orderType === 'dine-in' ? selectedTable : 'takeaway'

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existing = currentCart.find((cartItem) => cartItem._id === item._id)
      if (existing) {
        return currentCart.map((cartItem) =>
          cartItem._id === item._id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem
        )
      }
      return [...currentCart, { ...item, qty: 1 }]
    })
    setRecentlyAdded(item._id)
    window.setTimeout(() => setRecentlyAdded(null), 200)
  }

  const changeQuantity = (id, amount) => {
    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        if (item._id !== id) return [item]
        const qty = item.qty + amount
        return qty > 0 ? [{ ...item, qty }] : []
      })
    )
  }

  const clearCart = () => {
    if (cart.length && window.confirm('Clear all items from this order?')) {
      setCart([])
    }
  }

  const sendToKitchen = async () => {
    if (!cart.length) return
    if (orderType === 'dine-in' && !selectedTable) {
      setError('Please select a dining table first')
      setToast({ message: 'Please select a dining table', type: 'error' })
      return
    }

    setSending(true)
    setError('')
    try {
      const itemsToSend = cart.map((item) => ({ menuItemId: item._id, qty: item.qty }))
      if (openOrders[orderKey]) {
        await addItemsToOrder(openOrders[orderKey], itemsToSend)
      } else {
        const response = await createOrder({
          orderType,
          tableId: orderType === 'dine-in' ? selectedTable : undefined,
          items: itemsToSend
        })
        const newOrderId = response.data.data?._id || response.data.data?.order?._id
        if (newOrderId) {
          setOpenOrders((currentOrders) => ({ ...currentOrders, [orderKey]: newOrderId }))
        }
      }
      setCart([])
      setError('')
      setSuccessMessage('Order sent to kitchen successfully')
      setToast({ message: 'Order sent to kitchen!', type: 'success' })
      window.setTimeout(() => setSuccessMessage(''), 3000)
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to send order to kitchen'
      setError(message)
      setToast({ message, type: 'error' })
    } finally {
      setSending(false)
    }
  }

  const selectedTableObj = tables.find((t) => t._id === selectedTable)

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#F7F5F2]">
      {/* Top Header / Control Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EBE7DF] bg-white px-6 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Order Type Pill Selector */}
          <div className="flex rounded-xl bg-[#F7F5F2] p-1 border border-[#EBE7DF]">
            <button
              type="button"
              onClick={() => setOrderType('dine-in')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                orderType === 'dine-in'
                  ? 'bg-white text-[#6F4E37] shadow-xs'
                  : 'text-[#7A7068] hover:text-[#2B2118]'
              }`}
            >
              <Utensils size={16} />
              <span>Dine-In</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType('takeaway')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                orderType === 'takeaway'
                  ? 'bg-white text-[#6F4E37] shadow-xs'
                  : 'text-[#7A7068] hover:text-[#2B2118]'
              }`}
            >
              <ShoppingBag size={16} />
              <span>Takeaway</span>
            </button>
          </div>

          {/* Table Selector (Dine-in only) */}
          {orderType === 'dine-in' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20 ${
                  selectedTable
                    ? 'border-[#6F4E37] bg-white text-[#2B2118]'
                    : 'border-dashed border-amber-400 bg-amber-50/50 text-[#7A7068]'
                }`}
              >
                <option value="">Choose Table...</option>
                {tables.map((table) => (
                  <option key={table._id} value={table._id}>
                    Table {table.tableNumber} ({table.capacity} seats)
                  </option>
                ))}
              </select>
              {selectedTableObj && (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Available
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7068]" size={16} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu dishes..."
            className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-2 pl-9 pr-8 text-sm text-[#2B2118] placeholder:text-[#7A7068]/60 focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Side: Categories & Menu Grid */}
        <section className="flex flex-1 flex-col overflow-hidden">
          {/* Category Tabs Bar */}
          <div className="flex items-center gap-2 border-b border-[#EBE7DF] bg-white px-6 py-2.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#6F4E37] text-white shadow-xs'
                  : 'bg-[#F7F5F2] text-[#7A7068] hover:bg-[#EBE7DF] hover:text-[#2B2118]'
              }`}
            >
              All Items ({items.length})
            </button>
            {categories.map((category) => {
              const count = items.filter((i) => (i.categoryId?._id || i.categoryId) === category._id).length
              return (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => setSelectedCategory(category._id)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                    selectedCategory === category._id
                      ? 'bg-[#6F4E37] text-white shadow-xs'
                      : 'bg-[#F7F5F2] text-[#7A7068] hover:bg-[#EBE7DF] hover:text-[#2B2118]'
                  }`}
                >
                  {category.name} ({count})
                </button>
              )
            })}
          </div>

          {/* Dishes Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-[#C75C5C]">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-[#4F8A5A]">
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {visibleItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {visibleItems.map((item) => {
                  const cartItem = cart.find((c) => c._id === item._id)
                  const isRecentlyClicked = recentlyAdded === item._id

                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => addToCart(item)}
                      className={`group relative flex flex-col justify-between rounded-2xl border border-[#EBE7DF] bg-white p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#6F4E37]/40 hover:shadow-md active:scale-[0.98] ${
                        cartItem ? 'ring-2 ring-[#6F4E37]/30 bg-amber-50/20' : ''
                      } ${isRecentlyClicked ? 'scale-[0.97]' : ''}`}
                    >
                      {/* Top Row: Veg indicator & In-Cart Badge */}
                      <div className="mb-3 flex items-center justify-between">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                            item.isVeg ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
                          }`}
                          title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>

                        {cartItem && (
                          <span className="rounded-full bg-[#6F4E37] px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                            {cartItem.qty} in order
                          </span>
                        )}
                      </div>

                      {/* Item Details */}
                      <div>
                        <h3 className="line-clamp-2 text-sm font-semibold text-[#2B2118] group-hover:text-[#6F4E37] transition-colors">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-[#7A7068]">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Bottom Row: Price & Add Button */}
                      <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#F7F5F2]">
                        <span className="text-base font-bold text-[#6F4E37]">
                          {money(item.price)}
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F7F5F2] text-[#6F4E37] group-hover:bg-[#6F4E37] group-hover:text-white transition-all shadow-2xs">
                          <Plus size={16} />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EBE7DF]/50 text-[#7A7068] mb-3">
                  <Coffee size={28} />
                </div>
                <h4 className="font-semibold text-[#2B2118]">No dishes found</h4>
                <p className="mt-1 text-sm text-[#7A7068]">
                  {search ? `No items matching "${search}"` : 'No items available in this category'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Current Ticket / Order Panel */}
        <aside className="flex w-96 shrink-0 flex-col border-l border-[#EBE7DF] bg-white shadow-sm">
          {/* Ticket Header */}
          <div className="border-b border-[#EBE7DF] px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Current Order
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-lg font-bold text-[#2B2118]">
                    {orderType === 'dine-in'
                      ? selectedTableObj
                        ? `Table ${selectedTableObj.tableNumber}`
                        : 'Select Table'
                      : 'Takeaway Order'}
                  </h2>
                  <span className="rounded-full bg-[#6F4E37]/10 px-2 py-0.5 text-xs font-medium text-[#6F4E37]">
                    {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  title="Clear order"
                  className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-[#C75C5C] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Ticket Items List */}
          <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-[#F7F5F2]">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item._id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2B2118]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#7A7068]">
                          {money(item.price)} each
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-bold text-[#2B2118] shrink-0">
                      {money(Number(item.price) * item.qty)}
                    </span>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] p-0.5">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item._id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7A7068] hover:bg-white hover:text-[#2B2118] transition-all"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#2B2118]">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item._id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7A7068] hover:bg-white hover:text-[#2B2118] transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCart((currentCart) => currentCart.filter((c) => c._id !== item._id))
                      }
                      className="text-xs font-medium text-gray-400 hover:text-[#C75C5C] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-[#7A7068]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F7F5F2] text-[#7A7068]/60 mb-3">
                  <ShoppingCart size={28} />
                </div>
                <h4 className="font-semibold text-[#2B2118]">Order is empty</h4>
                <p className="mt-1 text-xs text-[#7A7068] max-w-[200px]">
                  Click on dishes from the menu to build the order ticket
                </p>
              </div>
            )}
          </div>

          {/* Ticket Summary & Action Buttons */}
          <div className="border-t border-[#EBE7DF] bg-[#F7F5F2]/50 p-5 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#7A7068]">
                <span>Items Subtotal</span>
                <span className="font-medium text-[#2B2118]">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#7A7068]">
                <span>Taxes &amp; Surcharges</span>
                <span>Calculated at Billing</span>
              </div>
              <div className="flex justify-between border-t border-[#EBE7DF] pt-2 text-base font-bold text-[#2B2118]">
                <span>Estimated Total</span>
                <span className="text-xl text-[#6F4E37]">{money(subtotal)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={
                sending ||
                cart.length === 0 ||
                (orderType === 'dine-in' && !selectedTable)
              }
              onClick={sendToKitchen}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] ${
                cart.length === 0 || (orderType === 'dine-in' && !selectedTable)
                  ? 'cursor-not-allowed bg-stone-300'
                  : 'bg-[#6F4E37] hover:bg-[#2B2118]'
              }`}
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Sending to Kitchen...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send to Kitchen (KOT)</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-xl ${
            toast.type === 'error' ? 'bg-[#C75C5C]' : 'bg-[#2B2118]'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default POS
