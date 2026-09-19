import axiosInstance from './axiosInstance.js'

export const getCustomers = (params = {}) => axiosInstance.get('/customers', { params })
export const getCustomerById = (id) => axiosInstance.get(`/customers/${id}`)
export const lookupCustomerByPhone = (phone) => axiosInstance.get('/customers/lookup', { params: { phone } })
