import axios from 'axios'

const CUSTOMER_TOKEN_KEY = 'customerToken'
const CUSTOMER_TOKEN_EXPIRY_KEY = 'customerTokenExpiry'
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

const clearExpiredCustomerSession = () => {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY)
  localStorage.removeItem(CUSTOMER_TOKEN_EXPIRY_KEY)
}

const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  const expiresAt = Number(localStorage.getItem(CUSTOMER_TOKEN_EXPIRY_KEY) || 0)

  if (!token || (expiresAt && Date.now() > expiresAt)) {
    clearExpiredCustomerSession()
    return config
  }

  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default axiosInstance
