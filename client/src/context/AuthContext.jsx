// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Re-hydrate from localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem('canteen_token')
    const saved  = localStorage.getItem('canteen_user')
    if (token && saved) {
      setUser(JSON.parse(saved))
      // Verify token is still valid
      authAPI.me()
        .then(res => setUser(res.data.user))
        .catch(() => logout(false))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token, user } = res.data
    localStorage.setItem('canteen_token', token)
    localStorage.setItem('canteen_user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const register = async (data) => {
    const res = await authAPI.register(data)
    // Email verification required — do NOT auto-login user
    return res.data
  }

  const logout = (showToast = true) => {
    localStorage.removeItem('canteen_token')
    localStorage.removeItem('canteen_user')
    setUser(null)
    if (showToast) toast.success('Logged out successfully.')
  }

  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('canteen_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
