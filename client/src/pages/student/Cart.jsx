// src/pages/student/Cart.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { walletAPI, cartAPI, orderAPI } from '../../api/axios'
import toast from 'react-hot-toast'
import { Trash2, Plus, Minus, ShoppingBag, Wallet, ArrowRight, AlertCircle } from 'lucide-react'

export default function Cart() {
  const { cart, updateItem, removeItem, clearCart, fetchCart } = useCart()
  const navigate = useNavigate()
  const [note, setNote]         = useState('')
  const [placing, setPlacing]   = useState(false)
  const [walletBal, setWalletBal] = useState(null)

  const items = cart?.items || []
  const total = cart?.totalAmount || 0

  const loadWallet = async () => {
    if (walletBal !== null) return
    try {
      const r = await walletAPI.get()
      setWalletBal(r.data.data.balance)
    } catch { /* silent */ }
  }

  const handlePlaceOrder = async () => {
    if (items.length === 0) { toast.error('Your cart is empty.'); return }
    setPlacing(true)
    try {
      // Validate cart first
      const validation = await cartAPI.validate()
      if (!validation.data.isValid) {
        toast.error('Some items in your cart have changed. Please review.')
        await fetchCart()
        setPlacing(false)
        return
      }

      // Check wallet
      const walletRes = await walletAPI.get()
      const balance = walletRes.data.data.balance
      if (balance < total) {
        toast.error(`Insufficient balance. Need ₹${(total - balance).toFixed(2)} more.`)
        setPlacing(false)
        return
      }

      const orderRes = await orderAPI.place({ specialNote: note })
      toast.success('Order placed! 🎉')
      navigate(`/orders/${orderRes.data.data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Try again.')
    } finally { setPlacing(false) }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center animate-fade-in">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h2 className="font-display font-600 text-xl text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Add some delicious items from the menu.</p>
        <button onClick={() => navigate('/menu')} className="btn-primary">Browse Menu</button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-700 text-2xl text-gray-900">Your Cart</h1>
        <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
          Clear all
        </button>
      </div>

      {/* Cart items */}
      <div className="space-y-3 mb-4">
        {items.map(item => (
          <div key={item.menuItem?._id || item.menuItem} className="card p-3 flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {item.menuItem?.images?.[0]
                ? <img src={item.menuItem.images[0]} alt={item.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">₹{item.price} each</p>
              {item.menuItem?.isSoldOut && (
                <span className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
                  <AlertCircle size={10} /> Now sold out
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => updateItem(item.menuItem?._id || item.menuItem, item.quantity - 1)}
                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all">
                <Minus size={12} className="text-gray-600" />
              </button>
              <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
              <button onClick={() => updateItem(item.menuItem?._id || item.menuItem, item.quantity + 1)}
                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all">
                <Plus size={12} className="text-gray-600" />
              </button>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(item.menuItem?._id || item.menuItem)}
                className="text-gray-300 hover:text-red-400 transition-colors mt-0.5">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Special note */}
      <div className="card p-4 mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">Add a note for the kitchen (optional)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={200}
          placeholder="e.g. Less spicy, extra sauce…"
          className="input resize-none text-sm" />
      </div>

      {/* Bill summary */}
      <div className="card p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Bill Summary</h3>
        <div className="space-y-2 text-sm">
          {items.map(item => (
            <div key={item.menuItem?._id || item.menuItem} className="flex justify-between text-gray-600">
              <span>{item.name} × {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Wallet balance */}
      <div className="card p-4 mb-4 flex items-center justify-between cursor-pointer" onClick={loadWallet}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Wallet size={16} className="text-brand-500" />
          <span>Pay from Wallet</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {walletBal !== null ? `₹${walletBal.toFixed(2)}` : 'Tap to check'}
        </span>
      </div>

      {/* Place order button */}
      <button onClick={handlePlaceOrder} disabled={placing}
        className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5 mb-6">
        {placing ? 'Placing order…' : (
          <><span>Place Order · ₹{total.toFixed(2)}</span><ArrowRight size={18} /></>
        )}
      </button>
    </div>
  )
}
