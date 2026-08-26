import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, Send, X } from 'lucide-react'
import { getCategories, getMenuItems } from '../api/menuApi.js'
import { addItemsToOrder, createOrder } from '../api/orderApi.js'
import { getTables } from '../api/tableApi.js'
import { joinBranch } from '../socket.js'
import { useAuth } from '../context/AuthContext.jsx'

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

  useEffect(() => {
    joinBranch(branchId)
  }, [branchId])

  useEffect(() => {
    Promise.all([getCategories(), getMenuItems(), getTables()])
      .then(([categoryResponse, itemResponse, tableResponse]) => {
        setCategories(categoryResponse.data.data)
        setItems(itemResponse.data.data)
        setTables(tableResponse.data.data.filter((table) => table.status === 'free'))
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load POS data'))
  }, [])

  const visibleItems = useMemo(() => selectedCategory === 'all'
    ? items
    : items.filter((item) => (item.categoryId?._id || item.categoryId) === selectedCategory), [items, selectedCategory])

  const subtotal = cart.reduce((total, item) => total + (Number(item.price) * item.qty), 0)
  const orderKey = orderType === 'dine-in' ? selectedTable : 'takeaway'

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existing = currentCart.find((cartItem) => cartItem._id === item._id)
      if (existing) return currentCart.map((cartItem) => cartItem._id === item._id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem)
      return [...currentCart, { ...item, qty: 1 }]
    })
  }

  const changeQuantity = (id, amount) => {
    setCart((currentCart) => currentCart.flatMap((item) => {
      if (item._id !== id) return [item]
      const qty = item.qty + amount
      return qty > 0 ? [{ ...item, qty }] : []
    }))
  }

  const sendToKitchen = async () => {
    if (!cart.length || (orderType === 'dine-in' && !selectedTable)) return
    try {
      const itemsToSend = cart.map((item) => ({ menuItemId: item._id, qty: item.qty }))
      if (openOrders[orderKey]) await addItemsToOrder(openOrders[orderKey], itemsToSend)
      else {
        const response = await createOrder({ orderType, tableId: orderType === 'dine-in' ? selectedTable : undefined, items: itemsToSend })
        setOpenOrders((currentOrders) => ({ ...currentOrders, [orderKey]: response.data.data._id }))
      }
      setCart([])
      setError('')
      setSuccessMessage('Order sent to kitchen')
      window.setTimeout(() => setSuccessMessage(''), 2500)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send order to kitchen')
    }
  }

  return <main className="flex h-screen flex-col overflow-hidden bg-gray-50">
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3"><div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1"><button className={`rounded-lg px-4 py-2 text-sm ${orderType === 'dine-in' ? 'bg-white font-medium text-primary shadow-sm' : 'text-gray-500'}`} onClick={() => setOrderType('dine-in')} type="button">Dine In</button><button className={`rounded-lg px-4 py-2 text-sm ${orderType === 'takeaway' ? 'bg-white font-medium text-primary shadow-sm' : 'text-gray-500'}`} onClick={() => setOrderType('takeaway')} type="button">Takeaway</button></div>{orderType === 'dine-in' && <select className="input-field w-40" value={selectedTable} onChange={(event) => setSelectedTable(event.target.value)}><option value="">Select table</option>{tables.map((table) => <option key={table._id} value={table._id}>Table {table.tableNumber}</option>)}</select>}</header>
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="w-48 shrink-0 overflow-y-auto border-r bg-white py-4"><button className={`w-full border-l-4 px-4 py-3 text-left text-sm ${selectedCategory === 'all' ? 'border-l-primary bg-primary/10 font-medium text-primary' : 'border-l-transparent text-gray-500 hover:text-secondary'}`} onClick={() => setSelectedCategory('all')} type="button">All Items</button>{categories.map((category) => <button className={`w-full border-l-4 px-4 py-3 text-left text-sm ${selectedCategory === category._id ? 'border-l-primary bg-primary/10 font-medium text-primary' : 'border-l-transparent text-gray-500 hover:text-secondary'}`} key={category._id} onClick={() => setSelectedCategory(category._id)} type="button">{category.name}</button>)}</aside>
      <section className="min-w-0 flex-1 overflow-y-auto bg-gray-50 p-4">{error && <p className="mb-4 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}{successMessage && <p className="mb-4 rounded-lg border border-success bg-green-50 p-3 text-sm text-success">{successMessage}</p>}<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{visibleItems.map((item) => <button className="card border border-transparent p-3 text-left transition hover:border-primary hover:shadow-md" key={item._id} onClick={() => addToCart(item)} type="button"><span className={`mr-2 inline-block h-3 w-3 rounded-full ${item.isVeg ? 'bg-success' : 'bg-danger'}`} /><span className="font-medium text-secondary">{item.name}</span><p className="mt-2 font-bold text-primary">{Number(item.price).toFixed(2)}</p></button>)}</div></section>
      <aside className="flex w-96 shrink-0 flex-col border-l bg-white"><header className="border-b px-4 py-3 font-semibold text-secondary">Current Order</header><div className="flex-1 overflow-y-auto p-4">{cart.length ? cart.map((item) => <div className="mb-4 flex items-center justify-between gap-2" key={item._id}><div className="min-w-0"><p className="truncate text-sm font-medium text-secondary">{item.name}</p><p className="text-sm text-gray-500">{(Number(item.price) * item.qty).toFixed(2)}</p></div><div className="flex items-center gap-2"><button aria-label={`Decrease ${item.name}`} className="rounded border p-1 text-gray-500 hover:text-primary" onClick={() => changeQuantity(item._id, -1)} type="button"><Minus size={14} /></button><span className="w-5 text-center text-sm">{item.qty}</span><button aria-label={`Increase ${item.name}`} className="rounded border p-1 text-gray-500 hover:text-primary" onClick={() => changeQuantity(item._id, 1)} type="button"><Plus size={14} /></button><button aria-label={`Remove ${item.name}`} className="ml-1 text-gray-400 hover:text-danger" onClick={() => setCart((currentCart) => currentCart.filter((cartItem) => cartItem._id !== item._id))} type="button"><X size={16} /></button></div></div>) : <div className="flex h-full items-center justify-center text-gray-400">No items added yet</div>}</div><div className="border-t p-4"><div className="mb-3 flex justify-between font-semibold text-secondary"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></div><button className="btn-primary flex w-full items-center justify-center gap-2 py-3" disabled={!cart.length || (orderType === 'dine-in' && !selectedTable)} onClick={sendToKitchen} type="button"><Send size={18} /> Send to Kitchen</button></div></aside>
    </div>
  </main>
}

export default POS