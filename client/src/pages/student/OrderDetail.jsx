// src/pages/student/OrderDetail.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orderAPI } from '../../api/axios'
import { io } from 'socket.io-client'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, X } from 'lucide-react'
import { format } from 'date-fns'

const STEPS = ['placed','accepted','cooking','ready','completed']
const STEP_LABELS = { placed:'Placed', accepted:'Accepted', cooking:'Cooking', ready:'Ready', completed:'Done' }
const STEP_ICONS  = { placed:'📋', accepted:'✅', cooking:'👨‍🍳', ready:'🎉', completed:'✔️' }

const STATUS_STYLES = {
  placed:'bg-blue-50 text-blue-700', accepted:'bg-orange-50 text-orange-700',
  cooking:'bg-amber-50 text-amber-700', ready:'bg-emerald-50 text-emerald-700',
  completed:'bg-gray-100 text-gray-600', rejected:'bg-red-50 text-red-600', cancelled:'bg-gray-100 text-gray-500',
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef(null)

  useEffect(() => {
    orderAPI.getById(id).then(r => setOrder(r.data.data)).finally(() => setLoading(false))

    // Connect socket for live updates
    const token = localStorage.getItem('canteen_token')
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000', {
      auth: { token }
    })
    socketRef.current = socket

    socket.on('order_status_update', (data) => {
      if (data.orderId === id) {
        setOrder(prev => prev ? { ...prev, status: data.status, estimatedTime: data.estimatedTime } : prev)
        if (data.status === 'ready')     toast.success('Your order is ready! 🎉', { duration: 6000 })
        if (data.status === 'accepted')  toast.success('Order accepted by kitchen!')
        if (data.status === 'rejected')  toast.error('Your order was rejected. Refund issued.')
      }
    })
    return () => socket.disconnect()
  }, [id])

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order? Amount will be refunded.')) return
    try {
      const res = await orderAPI.cancel(id)
      setOrder(prev => ({ ...prev, status: 'cancelled' }))
      toast.success(res.data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel now.') }
  }

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )
  if (!order) return <div className="text-center pt-20 text-gray-400">Order not found.</div>

  const currentStep = STEPS.indexOf(order.status)
  const isTerminal = ['completed','rejected','cancelled'].includes(order.status)
  const isRejected = ['rejected','cancelled'].includes(order.status)

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/orders')} className="btn-ghost p-2 -ml-2">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display font-700 text-lg text-gray-900">{order.orderNumber}</h1>
          <p className="text-xs text-gray-400">{format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
        </div>
        <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[order.status]}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Status tracker */}
      {!isRejected && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-100" />
            <div className="absolute top-5 left-[10%] h-0.5 bg-brand-400 transition-all duration-700"
              style={{ width: `${Math.max(0, currentStep / (STEPS.length-1)) * 80}%` }} />
            {STEPS.filter(s => s !== 'completed' || order.status === 'completed').slice(0,5).map((step, i) => {
              const done = currentStep >= i
              return (
                <div key={step} className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-300
                                   ${done ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-200'}`}>
                    {done ? STEP_ICONS[step] : <span className="w-2 h-2 rounded-full bg-gray-200" />}
                  </div>
                  <span className={`text-[10px] font-medium ${done ? 'text-brand-600' : 'text-gray-400'}`}>
                    {STEP_LABELS[step]}
                  </span>
                </div>
              )
            })}
          </div>
          {order.estimatedTime && order.status !== 'completed' && (
            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
              <Clock size={12} /> Est. {order.estimatedTime} min
            </p>
          )}
        </div>
      )}

      {/* QR Code — show when ready */}
      {order.status === 'ready' && (
        <div className="card p-6 mb-4 text-center animate-slide-up">
          <p className="text-emerald-600 font-semibold mb-1">🎉 Your order is ready!</p>
          <p className="text-xs text-gray-400 mb-4">Show this QR at the counter to collect your order.</p>
          <div className="flex justify-center">
            <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <QRCodeSVG value={order.qrCode} size={180} level="M"
                fgColor="#1a1a1a" bgColor="#ffffff" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-mono">{order.qrCode}</p>
        </div>
      )}

      {/* Rejection reason */}
      {order.status === 'rejected' && order.rejectionReason && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
          <p className="text-sm font-medium text-red-700 mb-1">Order Rejected</p>
          <p className="text-sm text-red-500">{order.rejectionReason}</p>
          <p className="text-xs text-red-400 mt-1">₹{order.totalAmount?.toFixed(2)} has been refunded to your wallet.</p>
        </div>
      )}

      {/* Items */}
      <div className="card p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Items Ordered</h3>
        <div className="space-y-2">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
              <span className="font-medium text-gray-900">₹{item.subtotal?.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span><span>₹{order.totalAmount?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Cancel button */}
      {order.status === 'placed' && (
        <button onClick={handleCancel}
          className="w-full border border-red-200 text-red-500 hover:bg-red-50 font-medium py-3 rounded-xl
                     flex items-center justify-center gap-2 text-sm transition-all">
          <X size={16} /> Cancel Order
        </button>
      )}
    </div>
  )
}
