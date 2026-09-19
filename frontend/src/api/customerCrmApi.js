import axiosInstance from './axiosInstance.js'

export const getCustomers = (search = '') => axiosInstance.get('/customers', {
  params: { search, limit: 50 },
})
export const getCustomerById = (id) => axiosInstance.get(`/customers/${id}`)
export const lookupCustomerByPhone = (phone) => axiosInstance.get('/customers/lookup', { params: { phone } })
