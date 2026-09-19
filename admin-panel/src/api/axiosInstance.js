import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token
}

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true
})

axiosInstance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAccessToken(null)
      window.location.assign('/login')
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
