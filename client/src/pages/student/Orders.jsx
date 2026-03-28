// src/pages/student/Orders.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderAPI } from '../../api/axios'
import { formatDistanceToNow } from 'date-fns'
import { ChevronRight, Package } from 'lucide-react'

const STATUS_STYLES = {
  placed:    'badge-blue',
  accepted:  'badge-orange',
  cooking:   'badge-orange',
  ready:     'badge-green',
  completed: 'badge-gray',
  rejected:  'badge-red',
  cancelled: 'badge-gray',
}

const STATUS_LABELS = {
  placed: 'Order Placed', accepted: 'Accepted', cooking: 'Cooking…',
  ready: '🎉 Ready for Pickup', completed: 'Completed', rejected: 'Rejected', cancelled: 'Cancelled',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    orderAPI.myOrders({ limit: 20 })
      .then(r => setOrders(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="card p-4 skeleton h-24" />)}
    </div>
  )

  if (orders.length === 0) return (
    <div className="max-w-lg mx-auto px-4 pt-16 text-center">
      <Package size={48} className="mx-auto text-gray-200 mb-4" />
      <h2 className="font-display font-600 text-xl text-gray-900 mb-2">No orders yet</h2>
      <p className="text-gray-500 text-sm mb-6">Your order history will appear here.</p>
      <button onClick={() => navigate('/menu')} className="btn-primary">Order Now</button>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 animate-fade-in">
      <h1 className="font-display font-700 text-2xl text-gray-900 mb-5">Your Orders</h1>
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order._id} onClick={() => navigate(`/orders/${order._id}`)}
            className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-all active:scale-[0.99]">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0">
              <Package size={22} className="text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-900 font-mono">{order.orderNumber}</span>
                <span className={STATUS_STYLES[order.status] + ' badge'}>{STATUS_LABELS[order.status]}</span>
              </div>
              <p className="text-xs text-gray-400 truncate">
                {order.items?.map(i => `${i.name}×${i.quantity}`).join(', ')}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                </span>
                <span className="font-bold text-sm text-gray-900">₹{order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}


// ── OrderDetail page ────────────────────────────────────────────────────────
// src/pages/student/OrderDetail.jsx  (exported separately below)
