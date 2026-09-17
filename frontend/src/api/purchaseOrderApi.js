import axiosInstance from './axiosInstance.js'

export const getPurchaseOrders = (status) => axiosInstance.get('/purchase-orders', {
  params: status ? { status } : undefined
})

export const createPurchaseOrder = (data) => axiosInstance.post('/purchase-orders', data)
export const getPurchaseOrderById = (id) => axiosInstance.get(`/purchase-orders/${id}`)
export const markAsReceived = (id) => axiosInstance.patch(`/purchase-orders/${id}/receive`)
export const cancelPurchaseOrder = (id) => axiosInstance.patch(`/purchase-orders/${id}/cancel`)
