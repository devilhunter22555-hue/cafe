import axiosInstance from './axiosInstance.js'

export const getTables = () => axiosInstance.get('/tables')
export const createTable = (data) => axiosInstance.post('/tables', data)
export const updateTable = (id, data) => axiosInstance.patch(`/tables/${id}`, data)
export const updateTableStatus = (id, status) => axiosInstance.patch(`/tables/${id}/status`, { status })
export const deleteTable = (id) => axiosInstance.delete(`/tables/${id}`)
export const getQrCodeUrl = (id) => axiosInstance.get(`/tables/${id}/qr-code`)