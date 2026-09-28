import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token
}

const axiosInstance = axios.create({ baseURL: apiUrl, withCredentials: true })

axiosInstance.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || ''

    if (
      status === 403 &&
      message.toLowerCase().includes('currently inactive')
    ) {
      setAccessToken(null)
      try {
        sessionStorage.setItem('cafe_auth_notice', message)
      } catch {
        // ignore storage errors
      }
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
      return Promise.reject(error)
    }

    const originalRequest = error.config
    if (status !== 401 || originalRequest?._retry) return Promise.reject(error)
    originalRequest._retry = true
    try {
      const response = await axios.post(`${apiUrl}/auth/refresh`, {}, { withCredentials: true })
      const token = response.data.data.accessToken
      setAccessToken(token)
      originalRequest.headers.Authorization = `Bearer ${token}`
      return axiosInstance(originalRequest)
    } catch (refreshError) {
      const refreshMsg = refreshError.response?.data?.message || ''
      if (refreshMsg.toLowerCase().includes('currently inactive')) {
        try {
          sessionStorage.setItem('cafe_auth_notice', refreshMsg)
        } catch {
          // ignore
        }
      }
      setAccessToken(null)
      window.location.assign('/login')
      return Promise.reject(refreshError)
    }
  },
)

export default axiosInstance
