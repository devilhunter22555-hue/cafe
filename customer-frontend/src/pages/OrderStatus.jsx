import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Clock,
  Coffee,
  Flame,
  Plus,
  Receipt,
  Sparkles,
  Utensils
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getOrderStatus } from '../api/customerApi.js'
import socket, { joinBranch } from '../socket.js'
import { useCustomer } from '../context/CustomerContext.jsx'

const money = (value) => `₹${Number(value || 0).toFixed(2)}`

function idOf(value) {
  return String(value?._id || value)
}

function itemStatusInfo(status) {
  switch (status) {
    case 'preparing':
      return {
        label: 'Kitchen Preparing',
        icon: Flame,
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
        dotClass: 'bg-amber-500 animate-pulse'
      }
    case 'ready':
      return {
        label: 'Ready to Serve',
        icon: CheckCircle2,
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        dotClass: 'bg-emerald-500'
      }
    case 'served':
      return {
        label: 'Served at Table',
        icon: Utensils,
        badgeClass: 'border-stone-200 bg-stone-100 text-stone-600',
        dotClass: 'bg-stone-400'
      }
    default:
      return {
        label: 'Order Placed',
        icon: Clock,
        badgeClass: 'border-[#6F4E37]/20 bg-[#6F4E37]/10 text-[#6F4E37]',
        dotClass: 'bg-[#6F4E37]'
      }
  }
}

function OrderStatus() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const { isVerified, table, token } = useCustomer()
  const [order, setOrder] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const branchId = table?.branchId

  useEffect(() => {
    if (!isVerified || !token) return
    let active = true

    getOrderStatus()
      .then((response) => {
        if (active) setOrder(response.data.data)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load your order.')
      })
      .finally(() => {
        if (active) setLoaded(true)
      })

    if (branchId) {
      joinBranch(branchId)
    }

    const handleItemStatusUpdate = ({ orderId, itemId, newStatus }) => {
      setOrder((currentOrder) => {
        if (!currentOrder || idOf(currentOrder._id) !== idOf(orderId)) return currentOrder
        return {
          ...currentOrder,
          items: currentOrder.items.map((item) =>
            idOf(item._id) === idOf(itemId) ? { ...item, status: newStatus } : item
          )
        }
      })
    }

    const handleNewKot = ({ orderId, newItems, order: updatedOrder }) => {
      setOrder((currentOrder) => {
        if (!currentOrder || idOf(currentOrder._id) !== idOf(orderId)) return currentOrder
        if (updatedOrder?.items) return { ...currentOrder, ...updatedOrder }
        const existingIds = new Set(currentOrder.items.map((item) => idOf(item._id)))
        return {
          ...currentOrder,
          items: [
            ...currentOrder.items,
            ...(newItems || []).filter((item) => !existingIds.has(idOf(item._id)))
          ]
        }
      })
    }

    socket.on('item-status-update', handleItemStatusUpdate)
    socket.on('new-kot', handleNewKot)

    return () => {
      active = false
      socket.off('item-status-update', handleItemStatusUpdate)
      socket.off('new-kot', handleNewKot)
    }
  }, [branchId, isVerified, token])

  if (!isVerified || !token) return <Navigate to={`/t/${qrToken}`} replace />

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F5F2] text-sm text-[#7A7068]">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 animate-spin text-[#6F4E37]" />
          Connecting to kitchen status...
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F2] p-6 text-center">
        <div className="w-full max-w-sm rounded-3xl border border-[#EBE7DF] bg-white p-8 shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F5F2] text-[#7A7068]">
            <Receipt size={26} />
          </div>
          <h2 className="text-lg font-bold text-[#2B2118]">No Active Order Found</h2>
          <p className="mt-1 text-xs text-[#7A7068] mb-6">
            You don't have any items currently in progress for Table {table?.tableNumber || '—'}
          </p>
          <button
            type="button"
            onClick={() => navigate(`/t/${qrToken}/menu`)}
            className="w-full rounded-xl bg-[#6F4E37] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#2B2118]"
          >
            Explore Café Menu
          </button>
        </div>
      </main>
    )
  }

  const activeItems = (order.items || []).filter((item) => item.status !== 'cancelled')

  return (
    <main className="min-h-screen bg-[#F7F5F2] pb-32">
      {/* Top Bar */}
      <header className="border-b border-[#EBE7DF] bg-white px-4 py-4 shadow-xs">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6F4E37] text-white">
              <Coffee size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#2B2118]">Live Dining Ticket</h1>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7A7068]">
                Table {table?.tableNumber || '—'}
              </span>
            </div>
          </div>

          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
            Live Kitchen Sync
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-[#C75C5C]">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Status Tracker Card Banner */}
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7068]">
                Current Progress
              </span>
              <h2 className="text-lg font-bold text-[#2B2118] mt-0.5">
                Kitchen is preparing your order
              </h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <ChefHat size={22} />
            </div>
          </div>

          <p className="mt-2 text-xs text-[#7A7068]">
            Your items update automatically in real-time as chefs finish preparing them.
          </p>
        </div>

        {/* Ordered Dishes List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A7068] px-1">
            Ordered Dishes ({activeItems.length})
          </h3>

          {activeItems.map((item) => {
            const status = itemStatusInfo(item.status)
            const StatusIcon = status.icon

            return (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-2xl border border-[#EBE7DF] bg-white p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#2B2118] text-sm">{item.name}</h4>
                    <span className="rounded-md bg-[#F7F5F2] px-1.5 py-0.5 text-xs font-semibold text-[#7A7068]">
                      ×{item.qty}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="mt-0.5 text-xs italic text-amber-700">"{item.notes}"</p>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.badgeClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                  <span>{status.label}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Fixed Bottom Checkout / Add More Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-[#EBE7DF] bg-white/95 backdrop-blur-md p-4 shadow-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#7A7068]">Order Subtotal</span>
            <p className="text-lg font-extrabold text-[#6F4E37]">{money(order.total || order.subtotal)}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/t/${qrToken}/menu`)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6F4E37] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#2B2118] transition-all"
          >
            <Plus size={16} />
            <span>Add More Items</span>
          </button>
        </div>
      </footer>
    </main>
  )
}

export default OrderStatus
