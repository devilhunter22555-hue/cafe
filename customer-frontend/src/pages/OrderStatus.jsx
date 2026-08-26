import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getOrderStatus } from '../api/customerApi.js'
import socket, { joinBranch } from '../socket.js'
import { useCustomer } from '../context/CustomerContext.jsx'

const statusStyles = {
  pending: 'bg-warning/10 text-warning',
  preparing: 'bg-primary/10 text-primary',
  ready: 'bg-success/10 text-success',
  served: 'bg-gray-100 text-gray-500'
}

const statusLabels = {
  pending: 'Order Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served'
}

function idOf(value) {
  return String(value?._id || value)
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
      .finally(() => { if (active) setLoaded(true) })

    joinBranch(branchId)

    const handleItemStatusUpdate = ({ orderId, itemId, newStatus }) => {
      setOrder((currentOrder) => {
        if (!currentOrder || idOf(currentOrder._id) !== idOf(orderId)) return currentOrder
        return { ...currentOrder, items: currentOrder.items.map((item) => idOf(item._id) === idOf(itemId) ? { ...item, status: newStatus } : item) }
      })
    }

    const handleNewKot = ({ orderId, newItems, order: updatedOrder }) => {
      setOrder((currentOrder) => {
        if (!currentOrder || idOf(currentOrder._id) !== idOf(orderId)) return currentOrder
        if (updatedOrder?.items) return { ...currentOrder, ...updatedOrder }
        const existingIds = new Set(currentOrder.items.map((item) => idOf(item._id)))
        return { ...currentOrder, items: [...currentOrder.items, ...(newItems || []).filter((item) => !existingIds.has(idOf(item._id)))] }
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
  if (!loaded) return <main className="min-h-screen bg-gray-50 p-4 text-gray-500">Loading your order...</main>
  if (!order) return <main className="min-h-screen bg-gray-50 p-4"><h1 className="mb-6 text-2xl font-bold text-secondary">Your Order</h1>{error && <p className="mb-4 text-sm text-danger">{error}</p>}<div className="flex min-h-[60vh] flex-col items-center justify-center"><p className="mb-4 text-gray-500">No active order</p><button className="rounded-lg bg-primary px-4 py-3 font-semibold text-white" onClick={() => navigate(`/t/${qrToken}/menu`)} type="button">Back to Menu</button></div></main>

  const activeItems = order.items.filter((item) => item.status !== 'cancelled')

  return <main className="min-h-screen bg-gray-50 p-4 pb-28">
    <header><h1 className="mb-1 text-2xl font-bold text-secondary">Your Order</h1><p className="mb-6 text-sm text-gray-500">Table {table?.tableNumber || '—'}</p></header>
    <section>{activeItems.map((item) => <article className="mb-3 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm" key={item._id}><div><p className="font-semibold text-secondary">{item.name}</p><p className="text-sm text-gray-400">Qty: {item.qty}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[item.status] || statusStyles.pending}`}>{statusLabels[item.status] || 'Order Placed'}</span></article>)}</section>
    <footer className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg"><div className="mx-auto max-w-xl"><p className="mb-3 text-lg font-bold text-secondary">Total: {'\u20B9'}{Number(order.total).toFixed(2)}</p><button className="w-full rounded-lg bg-primary py-3 font-semibold text-white" onClick={() => navigate(`/t/${qrToken}/menu`)} type="button">Add More Items</button></div></footer>
  </main>
}

export default OrderStatus
