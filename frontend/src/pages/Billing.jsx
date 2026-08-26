import { useEffect, useMemo, useState } from 'react'
import { generateBill, getOrderById, getOrders } from '../api/orderApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function money(value) {
  return currency.format(Number(value) || 0)
}

function orderLabel(order) {
  return order.orderType === 'takeaway' ? 'Takeaway' : `Table ${order.tableId?.tableNumber || 'Unknown'}`
}

function totalFor(order, discount) {
  return Number(order.subtotal) + Number(order.cgst) + Number(order.sgst) - (Number(discount) || 0)
}

function BillItems({ order }) {
  return <div>{order.items.filter((item) => item.status !== 'cancelled').map((item) => <div className="flex justify-between py-1.5 text-sm" key={item._id}>
    <span>{item.name} x {item.qty}</span><span>{money(Number(item.price) * Number(item.qty))}</span>
  </div>)}</div>
}

function Totals({ order, discount }) {
  const discountValue = Number(discount) || 0
  const total = totalFor(order, discount)
  return <>
    <div className="my-3 border-t" />
    <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
    <div className="flex justify-between text-sm text-gray-600"><span>CGST</span><span>{money(order.cgst)}</span></div>
    <div className="flex justify-between text-sm text-gray-600"><span>SGST</span><span>{money(order.sgst)}</span></div>
    {discountValue > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Discount</span><span>-{money(discountValue)}</span></div>}
    <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold text-secondary"><span>Total</span><span>{money(total)}</span></div>
  </>
}

function Billing() {
  const { branchId } = useAuth()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [billedOrder, setBilledOrder] = useState(null)
  const [discount, setDiscount] = useState('0')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getOrders('open')
      .then(({ data }) => Promise.all(data.data.map((order) => getOrderById(order._id))))
      .then((responses) => {
        if (active) setOrders(responses.map((response) => response.data.data))
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load open orders')
      })
    return () => { active = false }
  }, [branchId])

  const itemCount = useMemo(() => selectedOrder?.items.filter((item) => item.status !== 'cancelled').reduce((count, item) => count + Number(item.qty), 0) || 0, [selectedOrder])

  const selectOrder = (order) => {
    setSelectedOrder(order)
    setDiscount(String(order.discount || 0))
    setError('')
  }

  const createBill = async () => {
    try {
      const response = await generateBill(selectedOrder._id, Number(discount) || 0)
      const order = { ...response.data.data.order, tableId: selectedOrder.tableId }
      setOrders((currentOrders) => currentOrders.filter((currentOrder) => currentOrder._id !== selectedOrder._id))
      setBilledOrder(order)
      setSelectedOrder(null)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate bill')
    }
  }

  if (billedOrder) return <main className="mx-auto max-w-5xl p-6">
    <section className="card mx-auto max-w-md" id="printable-bill">
      <header className="mb-4 border-b pb-3 text-center"><h1 className="text-lg font-bold">Restaurant POS</h1><p className="mt-1 text-sm text-gray-500">{new Date().toLocaleString()}</p></header>
      <h2 className="mb-2 text-xl font-bold text-secondary">{orderLabel(billedOrder)}</h2>
      <BillItems order={billedOrder} />
      <Totals discount={billedOrder.discount} order={billedOrder} />
      <div className="mt-4 flex gap-2 print:hidden"><button className="btn-primary flex-1" onClick={() => window.print()} type="button">Print Bill</button><button className="btn-secondary" onClick={() => setBilledOrder(null)} type="button">Back to Orders</button></div>
    </section>
  </main>

  if (selectedOrder) return <main className="mx-auto max-w-5xl p-6">
    <section className="card mx-auto max-w-md">
      <header className="mb-4 border-b pb-3"><h1 className="text-xl font-bold text-secondary">{orderLabel(selectedOrder)}</h1><p className="mt-1 text-sm text-gray-500">{itemCount} item{itemCount === 1 ? '' : 's'}</p></header>
      <BillItems order={selectedOrder} />
      <div className="my-3 border-t" />
      <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{money(selectedOrder.subtotal)}</span></div>
      <div className="flex justify-between text-sm text-gray-600"><span>CGST</span><span>{money(selectedOrder.cgst)}</span></div>
      <div className="flex justify-between text-sm text-gray-600"><span>SGST</span><span>{money(selectedOrder.sgst)}</span></div>
      <label className="mt-3 flex items-center justify-between text-sm text-gray-600">Discount<input className="input-field w-20 text-right" min="0" onChange={(event) => setDiscount(event.target.value)} step="0.01" type="number" value={discount} /></label>
      <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold text-secondary"><span>Total</span><span>{money(totalFor(selectedOrder, discount))}</span></div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex gap-2"><button className="btn-primary flex-1" onClick={createBill} type="button">Generate Bill</button><button className="btn-secondary" onClick={() => { setSelectedOrder(null); setError('') }} type="button">Cancel</button></div>
    </section>
  </main>

  return <main className="mx-auto max-w-5xl p-6">
    <h1 className="mb-6 text-2xl font-bold text-secondary">Billing</h1>
    {error && <p className="mb-4 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}
    <section className="space-y-3">{orders.map((order) => <article className="card flex items-center justify-between p-4" key={order._id}>
      <div><p className="font-semibold text-secondary">{orderLabel(order)}</p><p className="text-sm text-gray-500">{order.items.filter((item) => item.status !== 'cancelled').reduce((count, item) => count + Number(item.qty), 0)} items</p></div>
      <div className="flex items-center gap-4"><span className="text-lg font-bold text-primary">{money(order.total)}</span><button className="btn-primary px-3 py-1.5 text-sm" onClick={() => selectOrder(order)} type="button">View &amp; Bill</button></div>
    </article>)}</section>
    {!orders.length && !error && <p className="text-center text-gray-400">No open orders to bill.</p>}
  </main>
}

export default Billing
