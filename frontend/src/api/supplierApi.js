import axiosInstance from './axiosInstance.js'

export const getSuppliers = () => axiosInstance.get('/suppliers')
export const createSupplier = (data) => axiosInstance.post('/suppliers', data)
export const updateSupplier = (id, data) => axiosInstance.patch(`/suppliers/${id}`, data)
export const deleteSupplier = (id) => axiosInstance.delete(`/suppliers/${id}`)
