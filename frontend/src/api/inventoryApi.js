import axiosInstance from './axiosInstance.js'

export const getInventoryItems = () => axiosInstance.get('/inventory')
export const createInventoryItem = (data) => axiosInstance.post('/inventory', data)
export const updateInventoryItem = (id, data) => axiosInstance.patch(`/inventory/${id}`, data)
export const adjustStock = (id, data) => axiosInstance.patch(`/inventory/${id}/adjust-stock`, data)
export const getStockLogs = (id) => axiosInstance.get(`/inventory/${id}/logs`)
export const deleteInventoryItem = (id) => axiosInstance.delete(`/inventory/${id}`)
