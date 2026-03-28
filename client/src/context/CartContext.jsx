// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { cartAPI } from '../api/axios'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cart, setCart]       = useState({ items: [], totalAmount: 0, itemCount: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'student') fetchCart()
    else setCart({ items: [], totalAmount: 0, itemCount: 0 })
  }, [user])

  const fetchCart = async () => {
    try {
      const res = await cartAPI.get()
      setCart(res.data.data)
    } catch { /* silent */ }
  }

  const addToCart = async (menuItemId, quantity = 1, specialInstructions = '') => {
    setLoading(true)
    try {
      const res = await cartAPI.add({ menuItemId, quantity, specialInstructions })
      setCart(res.data.data)
      return res.data
    } finally { setLoading(false) }
  }

  const updateItem = async (menuItemId, quantity) => {
    const res = await cartAPI.update({ menuItemId, quantity })
    setCart(res.data.data)
  }

  const removeItem = async (menuItemId) => {
    const res = await cartAPI.remove(menuItemId)
    setCart(res.data.data)
  }

  const clearCart = async () => {
    const res = await cartAPI.clear()
    setCart(res.data.data)
  }

  const itemCount = cart.items?.reduce((s, i) => s + i.quantity, 0) || 0

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
