import { useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { placeOrder } from '../api/customerApi.js'

const money = (value) => `\u20B9${Number(value).toFixed(2)}`

function CartDrawer({ cartItems, onClose, onUpdate }) {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0)

  const placeCustomerOrder = async () => {
    setLoading(true)
    setError('')
    try {
      await placeOrder(cartItems.map((item) => ({ menuItemId: item.menuItemId, qty: item.qty })))
      navigate(`/t/${qrToken}/order-status`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to place your order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex items-end bg-black/40" role="dialog" aria-modal="true" aria-label="Your order">
    <section className="flex max-h-[80vh] w-full flex-col rounded-t-2xl bg-white">
      <header className="flex items-center justify-between border-b px-4 py-3"><h2 className="text-lg font-bold text-secondary">Your Order</h2><button aria-label="Close cart" className="text-gray-500" onClick={onClose} type="button"><X size={22} /></button></header>
      <div className="flex-1 overflow-y-auto px-4">{cartItems.map((item) => <div className="flex items-center justify-between border-b py-3" key={item.menuItemId}>
        <div><p className="font-medium text-secondary">{item.name}</p><p className="text-sm text-primary">{money(item.price)}</p></div>
        <div className="flex items-center gap-3"><button aria-label={`Decrease ${item.name}`} className="text-lg text-primary" onClick={() => onUpdate(item.menuItemId, -1)} type="button">-</button><span>{item.qty}</span><button aria-label={`Increase ${item.name}`} className="text-lg text-primary" onClick={() => onUpdate(item.menuItemId, 1)} type="button">+</button></div>
      </div>)}</div>
      <footer className="border-t p-4"><div className="mb-3 flex justify-between font-semibold text-secondary"><span>Subtotal</span><span>{money(subtotal)}</span></div>{error && <p className="mb-3 text-sm text-danger">{error}</p>}<button className="w-full rounded-lg bg-primary py-3 font-semibold text-white disabled:opacity-60" disabled={loading || !cartItems.length} onClick={placeCustomerOrder} type="button">{loading ? 'Placing Order...' : 'Place Order'}</button></footer>
    </section>
  </div>
}

export default CartDrawer
