import axiosInstance from './axiosInstance.js'

export const getCustomers = (params = {}) => {
  const search = typeof params === 'string' ? params : params.search || ''
  const limit = Number(params.limit || 50)

  return axiosInstance.get('/customers', {
    params: { search, limit },
  })
}

export const getCustomerById = (id) => axiosInstance.get(`/customers/${id}`)
export const lookupCustomerByPhone = (phone) => axiosInstance.get('/customers/lookup', { params: { phone } })
