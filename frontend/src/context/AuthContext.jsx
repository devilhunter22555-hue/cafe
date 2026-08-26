import { createContext, useContext, useEffect, useReducer } from 'react'
import axios from 'axios'
import axiosInstance, { setAccessToken } from '../api/axiosInstance.js'

const AuthContext = createContext(null)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const initialState = { user: null, accessToken: null, restaurantId: null, branchId: null, role: null, isAuthenticated: false, loading: false, error: null, initializing: true }

function reducer(state, action) {
  switch (action.type) {
    case 'AUTH_START': return { ...state, loading: true, error: null }
    case 'AUTH_SUCCESS': return { ...state, ...action.payload, isAuthenticated: true, loading: false, error: null, initializing: false }
    case 'AUTH_FAIL': return { ...initialState, loading: false, initializing: false, error: action.payload }
    case 'LOGOUT': setAccessToken(null); return { ...initialState, initializing: false }
    default: return state
  }
}

function authPayload(data) {
  const user = data.user
  return { user, accessToken: data.accessToken, restaurantId: user.restaurantId, branchId: user.branchId, role: user.role }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    let active = true
    axios.post(`${apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        if (!active) return
        setAccessToken(data.data.accessToken)
        dispatch({ type: 'AUTH_SUCCESS', payload: authPayload(data.data) })
      })
      .catch(() => { if (active) dispatch({ type: 'AUTH_FAIL', payload: null }) })
    return () => { active = false }
  }, [])

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await axiosInstance.post('/auth/login', { email, password })
      console.log('[AuthContext] login response:', response)
      const { data } = response
      setAccessToken(data.data.accessToken)
      dispatch({ type: 'AUTH_SUCCESS', payload: authPayload(data.data) })
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL', payload: error.response?.data?.message || 'Unable to sign in' })
      throw error
    }
  }

  const register = async (formData) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const { data } = await axiosInstance.post('/auth/register', formData)
      setAccessToken(data.data.accessToken)
      dispatch({ type: 'AUTH_SUCCESS', payload: authPayload(data.data) })
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL', payload: error.response?.data?.message || 'Unable to register' })
      throw error
    }
  }

  const logout = async () => dispatch({ type: 'LOGOUT' })
  return <AuthContext.Provider value={{ ...state, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
