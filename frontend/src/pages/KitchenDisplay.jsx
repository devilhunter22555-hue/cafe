import { useEffect, useState } from 'react'
import { ChefHat } from 'lucide-react'
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
        if (active) setOrders(response.data.data)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load kitchen orders')
      })

    joinBranch(branchId)

    const handleNewOrder = (order) => {
      const nextOrder = kitchenOrder(order)
      if (!nextOrder.items.length) return
      setOrders((currentOrders) => currentOrders.some((currentOrder) => idOf(currentOrder._id) === idOf(nextOrder._id))
        ? currentOrders
        : [...currentOrders, nextOrder])
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
        return currentOrders.map((currentOrder) => idOf(currentOrder._id) === idOf(orderId)
          ? (() => {
            const nextItems = [...currentOrder.items, ...activeItems.filter((item) => !existingItemIds.has(idOf(item._id)))]
            return { ...currentOrder, items: nextItems, kotNumbers: [...new Set(nextItems.map((item) => item.kotNumber).filter(Boolean))] }
          })()
          : currentOrder)
      })
    }

    const handleItemStatusUpdate = ({ orderId, itemId, newStatus }) => {
      setOrders((currentOrders) => withActiveItems(currentOrders, orderId, (items) => items.map((item) => (
        idOf(item._id) === idOf(itemId) ? { ...item, status: newStatus } : item
      ))))
    }

    const handleItemCancelled = ({ orderId, itemId }) => {
      setOrders((currentOrders) => withActiveItems(currentOrders, orderId, (items) => (
        items.filter((item) => idOf(item._id) !== idOf(itemId))
      )))
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
      setOrders((currentOrders) => withActiveItems(currentOrders, orderId, (items) => items.map((item) => (
        idOf(item._id) === idOf(itemId) ? { ...item, status } : item
      ))))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update item status')
    }
  }

  return <div className="min-h-full bg-canvas p-8">
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-3xl font-bold text-secondary">Kitchen Display</h1>
      <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success" /><span className="text-sm text-gray-500">Live</span></div>
    </header>

    {error && <p className="mb-4 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}

    {orders.length ? <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => <article className="card" key={order._id}>
        <header className="mb-3 border-b border-gray-200 pb-3"><h2 className="text-xl font-bold text-secondary">{order.orderType === 'takeaway' ? 'Takeaway' : `Table ${order.tableNumber || '—'}`}</h2>{order.kotNumbers?.length > 0 && <p className="mt-1 text-sm font-semibold text-primary">KOT {order.kotNumbers.join(', ')}</p>}</header>
        <div>{order.items.map((item) => <div className={`border-b border-gray-100 py-2 pl-3 last:border-0 ${item.status === 'pending' ? 'border-l-4 border-l-warning' : 'border-l-4 border-l-primary'}`} key={item._id}>
          <p className="text-lg font-semibold text-secondary">{item.name}<span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700">×{item.qty}</span></p>
          {item.notes && <p className="mt-1 text-sm italic text-gray-500">{item.notes}</p>}
          <button className={item.status === 'pending' ? 'mt-2 w-full rounded-lg bg-warning/10 py-2 text-warning' : 'mt-2 w-full rounded-lg bg-success/10 py-2 text-success'} onClick={() => changeItemStatus(order._id, item._id, item.status === 'pending' ? 'preparing' : 'ready')} type="button">{item.status === 'pending' ? 'Start Preparing' : 'Mark Ready'}</button>
        </div>)}</div>
      </article>)}
    </section> : <div className="flex min-h-[60vh] flex-col items-center justify-center"><ChefHat className="text-gray-300" size={48} /><p className="text-lg text-gray-400">No active orders right now</p></div>}
  </div>
}

export default KitchenDisplay
