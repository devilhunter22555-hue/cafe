import { useEffect, useMemo, useState } from 'react'
import { Banknote, CreditCard, Gift, Smartphone, UserRound } from 'lucide-react'
import { validateCoupon } from '../api/couponApi.js'
import { lookupCustomerByPhone } from '../api/customerCrmApi.js'
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
  const [paymentMode, setPaymentMode] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerInfo, setCustomerInfo] = useState(null)
  const [customerLookupMessage, setCustomerLookupMessage] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponInfo, setCouponInfo] = useState(null)
  const [redeemPoints, setRedeemPoints] = useState('0')
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
    setCustomerPhone(order.customerPhone || '')
    setCustomerInfo(null)
    setCustomerLookupMessage('')
    setCouponCode('')
    setCouponInfo(null)
    setRedeemPoints('0')
    setPaymentMode('')
    setError('')
  }

  const lookupCustomer = async () => {
    const phone = customerPhone.trim()
    if (!phone) {
      setCustomerInfo(null)
      setCustomerLookupMessage('')
      return
    }

    try {
      setError('')
      const response = await lookupCustomerByPhone(phone)
      const customer = response.data?.data
      if (!customer) {
        setCustomerInfo(null)
        setCustomerLookupMessage('No customer record found for this phone number.')
        return
      }
      const points = Number(customer.loyaltyPoints || 0)
      setCustomerInfo(customer)
      setCustomerLookupMessage(`This customer has ${points} points`)
      setRedeemPoints(String(Math.min(Number(redeemPoints) || 0, points)))
    } catch (requestError) {
      setCustomerInfo(null)
      setCustomerLookupMessage(requestError.response?.data?.message || 'Unable to look up customer.')
    }
  }

  const validateCurrentCoupon = async () => {
    const rawCode = couponCode.trim()
    if (!rawCode) {
      setError('Enter a coupon code to validate it.')
      return
    }

    try {
      setError('')
      const orderSubtotal = Number(selectedOrder?.subtotal || 0) + Number(selectedOrder?.cgst || 0) + Number(selectedOrder?.sgst || 0)
      const response = await validateCoupon(rawCode, orderSubtotal)
      const discountAmount = Number(response.data?.data?.discountAmount || 0)
      setCouponInfo(response.data?.data || null)
      setDiscount(String(discountAmount))
    } catch (requestError) {
      setCouponInfo(null)
      setDiscount('0')
      setError(requestError.response?.data?.message || 'Unable to validate coupon.')
    }
  }

  const createBill = async () => {
    try {
      const currentRedeem = Math.min(Number(redeemPoints) || 0, Number(customerInfo?.loyaltyPoints || 0))
      const response = await generateBill(selectedOrder._id, Number(discount) || 0, paymentMode, {
        customerPhone: customerPhone.trim() || undefined,
        redeemPoints: currentRedeem,
      })
      const order = { ...response.data.data.order, tableId: selectedOrder.tableId }
      setOrders((currentOrders) => currentOrders.filter((currentOrder) => currentOrder._id !== selectedOrder._id))
      setBilledOrder({ order, bill: response.data.data.bill })
      setSelectedOrder(null)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate bill')
    }
  }

  if (billedOrder) return <main className="mx-auto max-w-5xl p-6">
    <section className="card mx-auto max-w-md" id="printable-bill">
      <header className="mb-4 border-b pb-3 text-center"><h1 className="text-lg font-bold">Restaurant POS</h1><p className="mt-1 text-lg font-bold text-primary">Invoice: {billedOrder.bill.billNumber}</p><p className="mt-1 text-sm text-gray-500">{new Date().toLocaleString()}</p></header>
      <h2 className="mb-2 text-xl font-bold text-secondary">{orderLabel(billedOrder.order)}</h2>
      <BillItems order={billedOrder.order} />
      <Totals discount={billedOrder.order.discount} order={billedOrder.order} />
      <p className="mt-4 border-t pt-3 text-sm text-gray-600">Payment Mode: <span className="font-semibold uppercase">{billedOrder.bill.paymentMode}</span></p>
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

      <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-secondary"><UserRound size={16} /> Customer Phone (optional)</div>
        <input className="input-field" onBlur={lookupCustomer} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Enter customer phone number" type="text" value={customerPhone} />
        {customerLookupMessage && <p className="text-xs text-gray-500">{customerLookupMessage}</p>}
        {customerInfo && <div className="rounded-lg border border-primary/20 bg-white p-2 text-xs text-gray-600"><div className="font-medium text-secondary">{customerInfo.name || 'Customer'}</div><div className="mt-1">Loyalty points: <span className="font-semibold text-primary">{Number(customerInfo.loyaltyPoints || 0)}</span></div></div>}
      </div>

      <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-secondary"><Gift size={16} /> Coupon Code</div>
        <div className="flex gap-2">
          <input className="input-field flex-1 uppercase" onChange={(event) => setCouponCode(event.target.value)} placeholder="Coupon code" type="text" value={couponCode} />
          <button className="btn-secondary px-3" onClick={validateCurrentCoupon} type="button">Apply</button>
        </div>
        {couponInfo && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">Coupon applied: {couponInfo.coupon?.code} • Discount {money(couponInfo.discountAmount)}</div>}
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-gray-600">Manual discount<input className="input-field mt-1 text-right" min="0" onChange={(event) => setDiscount(event.target.value)} step="0.01" type="number" value={discount} /></label>
          <label className="text-sm text-gray-600">Redeem points<input className="input-field mt-1 text-right" max={Number(customerInfo?.loyaltyPoints || 0)} min="0" onChange={(event) => setRedeemPoints(event.target.value)} step="1" type="number" value={redeemPoints} /></label>
        </div>
      </div>

      <div className="mt-4"><p className="mb-2 text-sm text-gray-600">Payment Mode</p><div className="flex gap-2">{[['cash', 'Cash', Banknote], ['card', 'Card', CreditCard], ['upi', 'UPI', Smartphone]].map(([value, label, Icon]) => <button className={`flex-1 rounded-lg border py-2 text-sm font-medium ${paymentMode === value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 bg-white text-gray-600'}`} key={value} onClick={() => setPaymentMode(value)} type="button"><Icon className="mx-auto mb-1" size={18} />{label}</button>)}</div></div>
      <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold text-secondary"><span>Total</span><span>{money(totalFor(selectedOrder, discount))}</span></div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex gap-2"><button className="btn-primary flex-1" disabled={!paymentMode} onClick={createBill} type="button">Generate Bill</button><button className="btn-secondary" onClick={() => { setSelectedOrder(null); setError('') }} type="button">Cancel</button></div>
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
