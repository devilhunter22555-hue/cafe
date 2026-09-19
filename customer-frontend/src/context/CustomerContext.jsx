import { createContext, useContext, useState } from 'react'

const CUSTOMER_TOKEN_KEY = 'customerToken'
const CUSTOMER_TOKEN_EXPIRY_KEY = 'customerTokenExpiry'
const CUSTOMER_SESSION_KEY = 'customer'
const CUSTOMER_TABLE_KEY = 'customerTable'
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

const CustomerContext = createContext(null)

function clearCustomerStorage() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY)
  localStorage.removeItem(CUSTOMER_TOKEN_EXPIRY_KEY)
  localStorage.removeItem(CUSTOMER_SESSION_KEY)
  localStorage.removeItem(CUSTOMER_TABLE_KEY)
}

function storedSession() {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  const expiresAt = Number(localStorage.getItem(CUSTOMER_TOKEN_EXPIRY_KEY) || 0)

  if (!token) return { token: null, customer: null, table: null, isVerified: false }

  if (expiresAt && Date.now() > expiresAt) {
    clearCustomerStorage()
    return { token: null, customer: null, table: null, isVerified: false }
  }

  try {
    return {
      token,
      customer: JSON.parse(localStorage.getItem(CUSTOMER_SESSION_KEY) || 'null'),
      table: JSON.parse(localStorage.getItem(CUSTOMER_TABLE_KEY) || 'null'),
      isVerified: true
    }
  } catch {
    clearCustomerStorage()
    return { token: null, customer: null, table: null, isVerified: false }
  }
}

export function CustomerProvider({ children }) {
  const [session, setSessionState] = useState(storedSession)

  const setSession = (token, customer, table) => {
    const expiresAt = Date.now() + FOUR_HOURS_MS
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token)
    localStorage.setItem(CUSTOMER_TOKEN_EXPIRY_KEY, String(expiresAt))
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer))
    localStorage.setItem(CUSTOMER_TABLE_KEY, JSON.stringify(table))
    setSessionState({ token, customer, table, isVerified: true })
  }

  const clearSession = () => {
    clearCustomerStorage()
    setSessionState({ token: null, customer: null, table: null, isVerified: false })
  }

  return <CustomerContext.Provider value={{ ...session, setSession, clearSession }}>{children}</CustomerContext.Provider>
}

export function useCustomer() {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomer must be used within CustomerProvider')
  return context
}
