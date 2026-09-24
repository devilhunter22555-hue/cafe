import { useEffect, useState } from 'react'
import { AlertCircle, ChefHat, CheckCircle2, Clock, Flame, UtensilsCrossed } from 'lucide-react'
import { getKitchenOrders, updateItemStatus } from '../api/orderApi.js'
import socket, { joinBranch } from '../socket.js'
import { useAuth } from '../context/AuthContext.jsx'

const activeStatuses = new Set(['pending', 'preparing'])

function idOf(value) {
  return String(value?._id || value)
}

function kitchenOrder(order) {
  const items = (order.items || []).filter((item) => activeStatuses.has(item.status))
  return {
    _id: order._id,
    tableNumber: order.tableNumber || order.tableId?.tableNumber || null,
    orderType: order.orderType,
    items,
    kotNumbers: [...new Set(items.map((item) => item.kotNumber).filter(Boolean))]
  }
}

function withActiveItems(orders, orderId, updateItems) {
  return orders.flatMap((order) => {
    if (idOf(order._id) !== idOf(orderId)) return [order]
    const items = updateItems(order.items).filter((item) => activeStatuses.has(item.status))
    return items.length ? [{ ...order, items }] : []
  })
}

function KitchenDisplay() {
  const { branchId } = useAuth()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getKitchenOrders()
      .then((response) => {
        if (active) setOrders(response.data.data || [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load kitchen orders')
      })

    if (branchId) {
      joinBranch(branchId)
    }

    const handleNewOrder = (order) => {
      const nextOrder = kitchenOrder(order)
      if (!nextOrder.items.length) return
      setOrders((currentOrders) =>
        currentOrders.some((currentOrder) => idOf(currentOrder._id) === idOf(nextOrder._id))
          ? currentOrders
          : [...currentOrders, nextOrder]
      )
    }

    const handleNewKot = ({ orderId, newItems, order }) => {
      const activeItems = (newItems || []).filter((item) => activeStatuses.has(item.status))
      if (!activeItems.length) return
      setOrders((currentOrders) => {
        const existing = currentOrders.find((currentOrder) => idOf(currentOrder._id) === idOf(orderId))
        if (!existing) {
          const nextOrder = kitchenOrder(order || { _id: orderId, items: activeItems })
          return nextOrder.items.length ? [...currentOrders, nextOrder] : currentOrders
        }
        const existingItemIds = new Set(existing.items.map((item) => idOf(item._id)))
        return currentOrders.map((currentOrder) =>
          idOf(currentOrder._id) === idOf(orderId)
            ? (() => {
                const nextItems = [
                  ...currentOrder.items,
                  ...activeItems.filter((item) => !existingItemIds.has(idOf(item._id)))
                ]
                return {
                  ...currentOrder,
                  items: nextItems,
                  kotNumbers: [...new Set(nextItems.map((item) => item.kotNumber).filter(Boolean))]
                }
              })()
            : currentOrder
        )
      })
    }

    const handleItemStatusUpdate = ({ orderId, itemId, newStatus }) => {
      setOrders((currentOrders) =>
        withActiveItems(currentOrders, orderId, (items) =>
          items.map((item) => (idOf(item._id) === idOf(itemId) ? { ...item, status: newStatus } : item))
        )
      )
    }

    const handleItemCancelled = ({ orderId, itemId }) => {
      setOrders((currentOrders) =>
        withActiveItems(currentOrders, orderId, (items) =>
          items.filter((item) => idOf(item._id) !== idOf(itemId))
        )
      )
    }

    socket.on('new-order', handleNewOrder)
    socket.on('new-kot', handleNewKot)
    socket.on('item-status-update', handleItemStatusUpdate)
    socket.on('item-cancelled', handleItemCancelled)

    return () => {
      active = false
      socket.off('new-order', handleNewOrder)
      socket.off('new-kot', handleNewKot)
      socket.off('item-status-update', handleItemStatusUpdate)
      socket.off('item-cancelled', handleItemCancelled)
    }
  }, [branchId])

  const changeItemStatus = async (orderId, itemId, status) => {
    try {
      await updateItemStatus(orderId, itemId, status)
      setError('')
      setOrders((currentOrders) =>
        withActiveItems(currentOrders, orderId, (items) =>
          items.map((item) => (idOf(item._id) === idOf(itemId) ? { ...item, status } : item))
        )
      )
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update item status')
    }
  }

  const totalKitchenItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#2B2118] text-[#F7F5F2]">
      {/* KDS Header Bar */}
      <header className="flex flex-wrap items-center justify-between border-b border-[#3D3025] bg-[#221A13] px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6F4E37] text-white">
            <ChefHat size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black uppercase tracking-wider text-white">
                Kitchen Display (KDS)
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-[#A89F91]">
              Real-time kitchen order tickets &amp; prep queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="rounded-xl bg-[#3D3025] px-3.5 py-2 text-[#C98A52] border border-[#4D3E31]">
            Active Orders: <strong className="text-white">{orders.length}</strong>
          </span>
          <span className="rounded-xl bg-[#3D3025] px-3.5 py-2 text-[#C98A52] border border-[#4D3E31]">
            Dishes in Prep: <strong className="text-white">{totalKitchenItems}</strong>
          </span>
        </div>
      </header>

      {error && (
        <div className="m-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {orders.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {orders.map((order) => (
              <div
                key={order._id}
                className="flex flex-col justify-between rounded-2xl border border-[#4D3E31] bg-[#1E1712] p-5 shadow-lg"
              >
                <div>
                  {/* Card Header: Table / Takeaway & KOT badge */}
                  <div className="flex items-start justify-between border-b border-[#3D3025] pb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#A89F91]">
                        {order.orderType === 'takeaway' ? 'Takeaway' : 'Dine-In Table'}
                      </span>
                      <h3 className="text-2xl font-black text-white">
                        {order.orderType === 'takeaway'
                          ? 'Takeaway'
                          : `Table ${order.tableNumber || '—'}`}
                      </h3>
                    </div>

                    {order.kotNumbers?.length > 0 && (
                      <span className="rounded-lg bg-[#6F4E37] px-2 py-1 text-xs font-mono font-bold text-white shadow-2xs">
                        KOT #{order.kotNumbers.join(', #')}
                      </span>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="mt-3 space-y-3">
                    {order.items.map((item) => {
                      const isPending = item.status === 'pending'

                      return (
                        <div
                          key={item._id}
                          className={`rounded-xl border p-3 transition-all ${
                            isPending
                              ? 'border-amber-500/40 bg-amber-500/10'
                              : 'border-[#C98A52]/40 bg-[#C98A52]/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-base font-bold text-white">
                                {item.name}
                              </p>
                              {item.notes && (
                                <p className="mt-1 text-xs italic text-amber-200/80">
                                  "{item.notes}"
                                </p>
                              )}
                            </div>

                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2B2118] text-sm font-black text-[#C98A52] border border-[#4D3E31]">
                              ×{item.qty}
                            </span>
                          </div>

                          {/* Action Button */}
                          <button
                            type="button"
                            onClick={() =>
                              changeItemStatus(
                                order._id,
                                item._id,
                                isPending ? 'preparing' : 'ready'
                              )
                            }
                            className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] ${
                              isPending
                                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                : 'bg-[#4F8A5A] hover:bg-emerald-600 text-white'
                            }`}
                          >
                            {isPending ? (
                              <>
                                <Flame size={14} />
                                <span>Start Preparing</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={14} />
                                <span>Mark Ready</span>
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#3D3025] text-[#A89F91] mb-4">
              <ChefHat size={36} />
            </div>
            <h3 className="text-xl font-bold text-white">All Kitchen Orders Clear!</h3>
            <p className="mt-1 text-sm text-[#A89F91] max-w-sm">
              New dining or takeaway tickets placed by waitstaff or customers will immediately alert here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default KitchenDisplay
