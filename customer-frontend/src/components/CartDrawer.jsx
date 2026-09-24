import { useState } from 'react'
import { AlertCircle, ArrowRight, Loader2, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { placeOrder } from '../api/customerApi.js'

const money = (value) => `₹${Number(value).toFixed(2)}`

function CartDrawer({ cartItems, onClose, onUpdate }) {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.qty, 0)
  const totalCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  const placeCustomerOrder = async () => {
    setLoading(true)
    setError('')
    try {
      await placeOrder(cartItems.map((item) => ({ menuItemId: item.menuItemId, qty: item.qty })))
      navigate(`/t/${qrToken}/order-status`)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Unable to place your order. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Your dining order"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <section className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-[#EBE7DF] bg-white shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Drawer Pull Bar & Header */}
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-stone-300" />

        <header className="flex items-center justify-between border-b border-[#F7F5F2] px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#6F4E37]" />
            <h2 className="text-lg font-bold text-[#2B2118]">Review Your Order</h2>
            <span className="rounded-full bg-[#6F4E37]/10 px-2 py-0.5 text-xs font-bold text-[#6F4E37]">
              {totalCount} {totalCount === 1 ? 'dish' : 'dishes'}
            </span>
          </div>

          <button
            type="button"
            aria-label="Close cart"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#F7F5F2]">
          {cartItems.map((item) => (
            <div key={item.menuItemId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0 pr-3">
                <p className="font-semibold text-[#2B2118] text-sm truncate">{item.name}</p>
                <p className="text-xs text-[#7A7068] mt-0.5">{money(item.price)} each</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] p-0.5">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name}`}
                    onClick={() => onUpdate(item.menuItemId, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7A7068] hover:bg-white transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-[#2B2118]">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${item.name}`}
                    onClick={() => onUpdate(item.menuItemId, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7A7068] hover:bg-white transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <span className="w-16 text-right text-sm font-bold text-[#2B2118]">
                  {money(Number(item.price) * item.qty)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Summary & Place Order */}
        <footer className="border-t border-[#EBE7DF] bg-[#F7F5F2]/50 p-6 space-y-4">
          <div className="space-y-1.5 text-xs text-[#7A7068]">
            <div className="flex justify-between">
              <span>Item Total</span>
              <span className="font-semibold text-[#2B2118]">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Taxes &amp; GST</span>
              <span>Calculated at counter</span>
            </div>
            <div className="flex justify-between border-t border-[#EBE7DF] pt-2 text-base font-extrabold text-[#2B2118]">
              <span>Estimated Payable</span>
              <span className="text-xl text-[#6F4E37]">{money(subtotal)}</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-[#C75C5C]">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={loading || !cartItems.length}
            onClick={placeCustomerOrder}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6F4E37] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#2B2118] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Sending Order to Kitchen...</span>
              </>
            ) : (
              <>
                <span>Place Dining Order</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  )
}

export default CartDrawer
