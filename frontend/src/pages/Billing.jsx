import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Gift,
  Printer,
  Receipt,
  Search,
  Smartphone,
  Tag,
  UserRound,
  UtensilsCrossed
} from 'lucide-react'
import { validateCoupon } from '../api/couponApi.js'
import { lookupCustomerByPhone } from '../api/customerCrmApi.js'
import { generateBill, getOrderById, getOrders } from '../api/orderApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function money(value) {
  return currency.format(Number(value) || 0)
}

function orderLabel(order) {
  return order.orderType === 'takeaway' ? 'Takeaway Order' : `Table ${order.tableId?.tableNumber || order.tableNumber || 'Unknown'}`
}

function totalFor(order, discount) {
  return Math.max(0, Number(order.subtotal) + Number(order.cgst) + Number(order.sgst) - (Number(discount) || 0))
}

function BillItems({ order }) {
  return (
    <div className="divide-y divide-[#F7F5F2]">
      {order.items
        .filter((item) => item.status !== 'cancelled')
        .map((item) => (
          <div className="flex items-center justify-between py-2.5 text-sm" key={item._id}>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2B2118]">{item.name}</span>
              <span className="rounded-md bg-[#F7F5F2] px-1.5 py-0.5 text-xs font-semibold text-[#7A7068]">
                ×{item.qty}
              </span>
            </div>
            <span className="font-semibold text-[#2B2118]">
              {money(Number(item.price) * Number(item.qty))}
            </span>
          </div>
        ))}
    </div>
  )
}

function Totals({ order, discount }) {
  const discountValue = Number(discount) || 0
  const total = totalFor(order, discount)
  return (
    <div className="my-3 space-y-1.5 border-t border-[#EBE7DF] pt-3 text-sm">
      <div className="flex justify-between text-[#7A7068]">
        <span>Subtotal</span>
        <span className="font-medium text-[#2B2118]">{money(order.subtotal)}</span>
      </div>
      <div className="flex justify-between text-[#7A7068]">
        <span>CGST (2.5%)</span>
        <span className="font-medium text-[#2B2118]">{money(order.cgst)}</span>
      </div>
      <div className="flex justify-between text-[#7A7068]">
        <span>SGST (2.5%)</span>
        <span className="font-medium text-[#2B2118]">{money(order.sgst)}</span>
      </div>
      {discountValue > 0 && (
        <div className="flex justify-between text-[#4F8A5A] font-medium">
          <span>Discount Applied</span>
          <span>-{money(discountValue)}</span>
        </div>
      )}
      <div className="mt-2 flex justify-between border-t border-[#EBE7DF] pt-2 text-lg font-extrabold text-[#2B2118]">
        <span>Total Payable</span>
        <span className="text-xl text-[#6F4E37]">{money(total)}</span>
      </div>
    </div>
  )
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
  const [loading, setLoading] = useState(true)

  const loadOpenOrders = () => {
    setLoading(true)
    getOrders('open')
      .then(({ data }) => Promise.all((data.data || []).map((order) => getOrderById(order._id))))
      .then((responses) => {
        setOrders(responses.map((response) => response.data.data))
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Unable to load open orders')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOpenOrders()
  }, [branchId])

  const itemCount = useMemo(
    () =>
      selectedOrder?.items
        .filter((item) => item.status !== 'cancelled')
        .reduce((count, item) => count + Number(item.qty), 0) || 0,
    [selectedOrder]
  )

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
        setCustomerLookupMessage('No customer record found for this number.')
        return
      }
      const points = Number(customer.loyaltyPoints || 0)
      setCustomerInfo(customer)
      setCustomerLookupMessage(`Found member "${customer.name || 'Guest'}" with ${points} loyalty points`)
      setRedeemPoints(String(Math.min(Number(redeemPoints) || 0, points)))
    } catch (requestError) {
      setCustomerInfo(null)
      setCustomerLookupMessage(requestError.response?.data?.message || 'Unable to look up customer.')
    }
  }

  const validateCurrentCoupon = async () => {
    const rawCode = couponCode.trim()
    if (!rawCode) {
      setError('Enter a coupon code to apply.')
      return
    }

    try {
      setError('')
      const orderSubtotal =
        Number(selectedOrder?.subtotal || 0) +
        Number(selectedOrder?.cgst || 0) +
        Number(selectedOrder?.sgst || 0)
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
    if (!paymentMode) {
      setError('Please select a payment method.')
      return
    }

    try {
      const currentRedeem = Math.min(Number(redeemPoints) || 0, Number(customerInfo?.loyaltyPoints || 0))
      const response = await generateBill(selectedOrder._id, Number(discount) || 0, paymentMode, {
        customerPhone: customerPhone.trim() || undefined,
        redeemPoints: currentRedeem
      })
      const order = { ...response.data.data.order, tableId: selectedOrder.tableId }
      setOrders((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder._id !== selectedOrder._id)
      )
      setBilledOrder({ order, bill: response.data.data.bill })
      setSelectedOrder(null)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate bill')
    }
  }

  // Invoice / Receipt View
  if (billedOrder) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setBilledOrder(null)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#EBE7DF] bg-white px-4 py-2 text-sm font-semibold text-[#7A7068] hover:bg-gray-50 transition-all print:hidden"
          >
            <ArrowLeft size={16} />
            <span>Back to Active Orders</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6F4E37] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#2B2118] transition-all print:hidden"
          >
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
        </div>

        {/* Printable Card */}
        <div
          id="printable-bill"
          className="rounded-3xl border border-[#EBE7DF] bg-white p-8 shadow-md"
        >
          {/* Cafe Header */}
          <div className="border-b border-dashed border-[#EBE7DF] pb-5 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-[#2B2118]">
              Café POS &amp; Bistro
            </h2>
            <p className="mt-1 text-xs text-[#7A7068]">Tax Invoice / Cash Receipt</p>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-[#7A7068]">
              <span>Bill #{billedOrder.bill.billNumber}</span>
              <span>•</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Table / Order Info */}
          <div className="my-4 flex items-center justify-between border-b border-[#F7F5F2] pb-3">
            <span className="text-sm font-bold text-[#2B2118]">
              {orderLabel(billedOrder.order)}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase text-emerald-700 border border-emerald-200">
              Paid via {billedOrder.bill.paymentMode}
            </span>
          </div>

          {/* Items */}
          <BillItems order={billedOrder.order} />

          {/* Totals */}
          <Totals discount={billedOrder.order.discount} order={billedOrder.order} />

          {/* Footer Note */}
          <div className="mt-6 border-t border-dashed border-[#EBE7DF] pt-4 text-center text-xs text-[#7A7068]">
            <p className="font-semibold text-[#2B2118]">Thank you for dining with us!</p>
            <p className="mt-1">Please visit again soon.</p>
          </div>
        </div>
      </div>
    )
  }

  // Selected Order Checkout View
  if (selectedOrder) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <button
          type="button"
          onClick={() => {
            setSelectedOrder(null)
            setError('')
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-[#EBE7DF] bg-white px-4 py-2 text-sm font-semibold text-[#7A7068] hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Back to Open Orders</span>
        </button>

        <div className="rounded-3xl border border-[#EBE7DF] bg-white p-6 shadow-sm space-y-5">
          {/* Order Header */}
          <div className="flex items-center justify-between border-b border-[#F7F5F2] pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                Settling Order
              </span>
              <h2 className="text-xl font-bold text-[#2B2118]">
                {orderLabel(selectedOrder)}
              </h2>
            </div>
            <span className="rounded-full bg-[#6F4E37]/10 px-3 py-1 text-xs font-bold text-[#6F4E37]">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Items List */}
          <BillItems order={selectedOrder} />

          {/* Customer CRM Lookup Section */}
          <div className="rounded-2xl border border-[#EBE7DF] bg-[#F7F5F2]/50 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7A7068]">
              <UserRound size={15} />
              <span>Customer Loyalty &amp; CRM</span>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onBlur={lookupCustomer}
                placeholder="Customer mobile number"
                className="flex-1 rounded-xl border border-[#EBE7DF] bg-white px-3.5 py-2 text-sm text-[#2B2118] focus:border-[#6F4E37] focus:outline-none"
              />
              <button
                type="button"
                onClick={lookupCustomer}
                className="rounded-xl border border-[#EBE7DF] bg-white px-4 py-2 text-xs font-bold text-[#6F4E37] hover:bg-gray-50"
              >
                Lookup
              </button>
            </div>
            {customerLookupMessage && (
              <p className="text-xs text-[#7A7068]">{customerLookupMessage}</p>
            )}
            {customerInfo && (
              <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-[#EBE7DF] text-xs">
                <div>
                  <span className="font-bold text-[#2B2118]">{customerInfo.name || 'Member'}</span>
                  <span className="ml-2 text-gray-500">Total Spent: {money(customerInfo.totalSpend)}</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                  {Number(customerInfo.loyaltyPoints || 0)} Points
                </span>
              </div>
            )}
          </div>

          {/* Coupon & Points Redemption */}
          <div className="rounded-2xl border border-[#EBE7DF] bg-[#F7F5F2]/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7A7068]">
              <Tag size={15} />
              <span>Discounts &amp; Rewards</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter promo coupon code"
                className="flex-1 rounded-xl border border-[#EBE7DF] bg-white px-3.5 py-2 text-sm uppercase text-[#2B2118] font-mono focus:border-[#6F4E37] focus:outline-none"
              />
              <button
                type="button"
                onClick={validateCurrentCoupon}
                className="rounded-xl bg-[#6F4E37] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#2B2118]"
              >
                Apply
              </button>
            </div>
            {couponInfo && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700 flex items-center justify-between">
                <span>Coupon {couponInfo.coupon?.code} applied</span>
                <span>-{money(couponInfo.discountAmount)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7068]">
                  Manual Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBE7DF] bg-white px-3 py-2 text-sm text-right font-medium focus:border-[#6F4E37] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A7068]">
                  Redeem Loyalty Points
                </label>
                <input
                  type="number"
                  min="0"
                  max={Number(customerInfo?.loyaltyPoints || 0)}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EBE7DF] bg-white px-3 py-2 text-sm text-right font-medium focus:border-[#6F4E37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7A7068] mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                ['cash', 'Cash', Banknote],
                ['card', 'Card', CreditCard],
                ['upi', 'UPI / QR', Smartphone]
              ].map(([mode, label, Icon]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                    paymentMode === mode
                      ? 'border-[#6F4E37] bg-[#6F4E37] text-white shadow-sm ring-2 ring-[#6F4E37]/20'
                      : 'border-[#EBE7DF] bg-white text-[#7A7068] hover:border-[#6F4E37]/30 hover:text-[#2B2118]'
                  }`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary Breakdown */}
          <Totals discount={discount} order={selectedOrder} />

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-[#C75C5C]">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Generate Bill CTA */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedOrder(null)
                setError('')
              }}
              className="flex-1 rounded-xl border border-[#EBE7DF] py-3 text-sm font-semibold text-[#7A7068] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!paymentMode}
              onClick={createBill}
              className={`flex-[2] rounded-xl py-3 text-sm font-semibold text-white shadow-sm transition-all ${
                !paymentMode
                  ? 'cursor-not-allowed bg-stone-300'
                  : 'bg-[#6F4E37] hover:bg-[#2B2118] active:scale-[0.98]'
              }`}
            >
              Generate Bill &amp; Receipt
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Orders Ready for Billing List
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">Billing &amp; Settlement</h1>
        <p className="mt-1 text-sm text-[#7A7068]">
          Review active orders, apply coupons or discounts, and complete payment settlement
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[#7A7068]">Loading open orders...</div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const activeItems = order.items.filter((i) => i.status !== 'cancelled')
            const totalCount = activeItems.reduce((sum, i) => sum + Number(i.qty), 0)

            return (
              <div
                key={order._id}
                className="group flex flex-col justify-between rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs transition-all hover:border-[#6F4E37]/30 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                        Order
                      </span>
                      <h3 className="text-lg font-bold text-[#2B2118]">
                        {orderLabel(order)}
                      </h3>
                    </div>
                    <span className="rounded-full bg-[#6F4E37]/10 px-2.5 py-0.5 text-xs font-bold text-[#6F4E37]">
                      {totalCount} items
                    </span>
                  </div>

                  {/* Top Items Summary */}
                  <div className="mt-3 space-y-1 text-xs text-[#7A7068]">
                    {activeItems.slice(0, 3).map((item) => (
                      <div key={item._id} className="flex justify-between">
                        <span className="truncate">{item.name} ×{item.qty}</span>
                        <span>{money(Number(item.price) * item.qty)}</span>
                      </div>
                    ))}
                    {activeItems.length > 3 && (
                      <div className="italic text-gray-400">
                        +{activeItems.length - 3} more items...
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#F7F5F2] pt-4">
                  <div>
                    <span className="text-xs text-[#7A7068]">Total</span>
                    <p className="text-lg font-extrabold text-[#6F4E37]">
                      {money(order.total || order.subtotal)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectOrder(order)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#6F4E37] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#2B2118] transition-all"
                  >
                    <Receipt size={15} />
                    <span>View &amp; Bill</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex min-h-[35vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-8 text-center">
          <Receipt className="text-gray-300 mb-3" size={40} />
          <h3 className="font-bold text-[#2B2118]">No open orders to bill</h3>
          <p className="mt-1 text-sm text-[#7A7068]">
            Orders placed via the POS terminal or customer QR codes will appear here for settlement
          </p>
        </div>
      )}
    </div>
  )
}

export default Billing
