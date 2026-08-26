import axiosInstance from './axiosInstance.js'

export const createOrder = (data) => axiosInstance.post('/orders', data)
export const getOrders = (status) => axiosInstance.get('/orders', { params: status ? { status } : undefined })
export const getOrderById = (id) => axiosInstance.get(`/orders/${id}`)
export const getKitchenOrders = () => axiosInstance.get('/kitchen/orders')
export const addItemsToOrder = (orderId, items) => axiosInstance.patch(`/orders/${orderId}/items`, { items })
export const updateItemStatus = (orderId, itemId, status) => axiosInstance.patch(`/orders/${orderId}/items/${itemId}/status`, { status })
export const cancelItem = (orderId, itemId) => axiosInstance.patch(`/orders/${orderId}/items/${itemId}/cancel`)
export const generateBill = (orderId, discount) => axiosInstance.patch(`/orders/${orderId}/bill`, { discount })
