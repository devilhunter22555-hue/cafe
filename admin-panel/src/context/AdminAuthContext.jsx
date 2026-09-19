import { createContext, useContext, useState } from 'react'
import axiosInstance, { setAccessToken } from '../api/axiosInstance.js'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    token: null,
    admin: null,
    isAuthenticated: false
  })

  const login = async (email, password) => {
    const response = await axiosInstance.post('/super-admin/login', { email, password })
    const token = response.data.data.token
    const admin = response.data.data.superAdmin

    setAccessToken(token)
    setAuthState({ token, admin, isAuthenticated: true })
    return admin
  }

  const logout = () => {
    setAccessToken(null)
    setAuthState({ token: null, admin: null, isAuthenticated: false })
  }

  return (
    <AdminAuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
