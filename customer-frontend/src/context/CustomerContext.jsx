import { createContext, useContext, useState } from 'react'

const CustomerContext = createContext(null)

function storedSession() {
  const token = localStorage.getItem('customerToken')
  if (!token) return { token: null, customer: null, table: null, isVerified: false }
  try {
    return { token, customer: JSON.parse(localStorage.getItem('customer') || 'null'), table: JSON.parse(localStorage.getItem('customerTable') || 'null'), isVerified: true }
  } catch {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customer')
    localStorage.removeItem('customerTable')
    return { token: null, customer: null, table: null, isVerified: false }
  }
}

export function CustomerProvider({ children }) {
  const [session, setSessionState] = useState(storedSession)
  const setSession = (token, customer, table) => {
    localStorage.setItem('customerToken', token)
    localStorage.setItem('customer', JSON.stringify(customer))
    localStorage.setItem('customerTable', JSON.stringify(table))
    setSessionState({ token, customer, table, isVerified: true })
  }
  const clearSession = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customer')
    localStorage.removeItem('customerTable')
    setSessionState({ token: null, customer: null, table: null, isVerified: false })
  }
  return <CustomerContext.Provider value={{ ...session, setSession, clearSession }}>{children}</CustomerContext.Provider>
}

export function useCustomer() {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomer must be used within CustomerProvider')
  return context
}
