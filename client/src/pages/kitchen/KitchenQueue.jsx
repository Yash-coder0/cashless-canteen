// src/pages/kitchen/KitchenQueue.jsx
import { useState, useEffect, useRef } from 'react'
import { orderAPI, menuAPI } from '../../api/axios'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Clock, CheckCircle, ChefHat, Bell, Package, AlertTriangle, XCircle, QrCode } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_FLOW = { placed: 'accepted', accepted: 'cooking', cooking: 'ready' }
const STATUS_COLORS = {
  placed:   'border-l-gray-400 bg-gray-50/50',
  accepted: 'border-l-blue-400 bg-blue-50/50',
  cooking:  'border-l-orange-400 bg-orange-50/50',
  ready:    'border-l-green-400 bg-green-50/50',
}
const STATUS_LABELS = { placed: 'New', accepted: 'Accepted', cooking: 'Cooking', ready: 'Ready' }
const NEXT_LABELS   = { placed: 'Accept', accepted: 'Start Cooking', cooking: 'Mark Ready' }

function OrderCard({ order, onUpdate, onReject }) {
  const [loading, setLoading] = useState(false)
  const nextStatus = STATUS_FLOW[order.status]

  const handleNext = async () => {
    setLoading(true)
    try { await onUpdate(order._id, nextStatus) }
    finally { setLoading(false) }
  }

  const handleReject = async () => {
    const reason = window.prompt('Reason for rejection (shown to student):')
    if (reason === null) return
    setLoading(true)
    try { await onReject(order._id, reason) }
    finally { setLoading(false) }
  }

  return (
    <div className={`bg-white rounded-2xl border-l-4 shadow-card p-4 ${STATUS_COLORS[order.status]} transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-mono font-bold text-sm text-gray-900">{order.orderNumber}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{order.userId?.name}</span>
            {order.userId?.collegeId && (
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{order.userId.collegeId}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
            ${order.status === 'placed' ? 'bg-gray-100 text-gray-700' :
              order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
              order.status === 'cooking'  ? 'bg-orange-100 text-orange-700' :
              'bg-green-100 text-green-700'}`}>
            {STATUS_LABELS[order.status]}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 justify-end">
            <Clock size={11} />
            {order.waitingMinutes > 0 ? `${order.waitingMinutes}m ago` : 'Just now'}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">
              {item.quantity}× {item.name}
            </span>
            {item.specialInstructions && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg max-w-[160px] truncate">
                📝 {item.specialInstructions}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Kitchen note */}
      {order.kitchenNote && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 mb-3 text-xs text-amber-700">
          💬 {order.kitchenNote}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="font-bold text-gray-900">₹{order.totalAmount?.toFixed(2)}</span>
        <div className="flex gap-2">
          {/* Reject — only before cooking */}
          {['placed','accepted'].includes(order.status) && (
            <button onClick={handleReject} disabled={loading}
              className="flex items-center justify-center gap-1.5 px-3 min-h-[44px] rounded-xl border border-red-200 text-red-500
                         hover:bg-red-50 text-xs font-medium transition-all disabled:opacity-50">
              <XCircle size={13} /> Reject
            </button>
          )}
          {nextStatus && (
            <button onClick={handleNext} disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-brand-500 hover:bg-brand-600
                         text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 flex-1">
              {loading ? '…' : NEXT_LABELS[order.status]}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KitchenQueue() {
  const [orders, setOrders]   = useState([])
  const [stats, setStats]     = useState(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('daily')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef(null)
  const socketRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [scannedResult, setScannedResult] = useState(null)
  const [hasNewOrders, setHasNewOrders] = useState(false)

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false)
      scanner.render((decodedText) => {
        setScannedResult(decodedText)
        toast.success(`Scanned Order ID: ${decodedText}`)
        scanner.clear()
        setScanning(false)
      }, (err) => {})
      return () => {
        try { scanner.clear() } catch {}
      }
    }
  }, [scanning])

  const fetchQueue = async () => {
    try {
      const [q, s] = await Promise.all([orderAPI.kitchenQueue(), import('../../api/axios').then(m => m.adminAPI?.overview?.()?.catch(() => null))])
      setOrders(q.data.data)
      if (s?.data?.data) setStats(s.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    import('../../api/axios').then(m => {
      m.adminAPI?.revenue?.({ period: analyticsPeriod })
        .then(res => {
          const totalOrdersDelivered = res.data.data.reduce((sum, item) => sum + item.orders, 0);
          setAnalyticsData(totalOrdersDelivered)
        })
        .catch(() => setAnalyticsData(0))
    })
  }, [analyticsPeriod])

  useEffect(() => {
    fetchQueue()

    const token = localStorage.getItem('canteen_token')
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000', { auth: { token } })
    socketRef.current = socket

    socket.on('new_order', (data) => {
      toast.success(`New order: ${data.orderNumber}`, { icon: '🔔', duration: 5000 })
      setHasNewOrders(true)
      // Play notification sound if supported
      try { new Audio('/notification.mp3').play().catch(() => {}) } catch {}
      fetchQueue()
    })

    socket.on('order_cancelled', (data) => {
      toast.error(`Order ${data.orderNumber} was cancelled.`)
      setOrders(prev => prev.filter(o => o._id !== data.orderId))
    })

    socket.on('menu_updated', (data) => {
      toast(`${data.name}: ${data.isSoldOut ? 'Marked sold out' : 'Back in stock'}`, { icon: '🍽️' })
    })

    return () => socket.disconnect()
  }, [])

  const handleUpdate = async (orderId, status, note = '') => {
    await orderAPI.updateStatus(orderId, { status, note })
    if (status === 'completed') {
      setOrders(prev => prev.filter(o => o._id !== orderId))
      toast.success('Order completed!')
    } else {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o))
    }
  }

  const handleReject = async (orderId, note) => {
    await orderAPI.updateStatus(orderId, { status: 'rejected', note })
    setOrders(prev => prev.filter(o => o._id !== orderId))
    toast.success('Order rejected. Refund issued to student.')
  }

  const columns = {
    placed:   orders.filter(o => o.status === 'placed'),
    accepted: orders.filter(o => o.status === 'accepted'),
    cooking:  orders.filter(o => o.status === 'cooking'),
    ready:    orders.filter(o => o.status === 'ready'),
  }

  const colHeaders = {
    placed:   { label: 'New Orders', color: 'text-gray-600 bg-gray-50',     icon: Bell },
    accepted: { label: 'Accepted',   color: 'text-blue-600 bg-blue-50',     icon: CheckCircle },
    cooking:  { label: 'Cooking',    color: 'text-orange-600 bg-orange-50', icon: ChefHat },
    ready:    { label: 'Ready',      color: 'text-green-600 bg-green-50',   icon: Package },
  }

  return (
    <div className="animate-fade-in relative">
      {hasNewOrders && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-xl mb-4 flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2 font-semibold">
            <Bell className="animate-bounce" size={18} /> New Orders Arrived!
          </span>
          <button onClick={() => setHasNewOrders(false)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-xs font-bold transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {/* QR Scanner UI */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-2">
          <h3 className="font-display font-600 text-gray-900 flex items-center gap-2">
            <QrCode size={18} className="text-brand-500" /> Order Scanner
          </h3>
          <button 
            onClick={() => setScanning(!scanning)}
            className={`px-4 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${scanning ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-brand-50 text-brand-600 hover:bg-brand-100'}`}
          >
            {scanning ? 'Stop Scanner' : 'Start Scanner'}
          </button>
        </div>
        {scanning && (
          <div className="w-full max-w-sm mt-4 overflow-hidden rounded-xl border border-gray-100">
            <div id="qr-reader" className="w-full"></div>
          </div>
        )}
        {scannedResult && !scanning && (
          <div className="mt-4 flex flex-col items-center gap-3 w-full border-t border-gray-100 pt-4">
            <div className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
              Scanned QR Code: <span className="font-mono font-bold text-green-900">{scannedResult}</span>
            </div>
            <button 
              onClick={() => {
                const order = orders.find(o => o.orderNumber === scannedResult)
                if (order) {
                  handleUpdate(order._id, 'completed')
                  setScannedResult(null)
                } else {
                  toast.error(`Order ${scannedResult} not found in the active queue!`)
                }
              }}
              className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <CheckCircle size={18} /> Mark Order as Completed
            </button>
            <button 
              onClick={() => setScannedResult(null)}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear scan
            </button>
          </div>
        )}
      </div>

      {/* Analytics Window */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <h3 className="font-display font-600 text-gray-900 text-sm">Orders Delivered</h3>
            <div className="flex items-baseline gap-2">
              <p className="font-display font-800 text-2xl text-gray-900">{analyticsData !== null ? analyticsData : '...'}</p>
              <span className="text-xs text-gray-400 capitalize">this {analyticsPeriod === 'daily' ? 'today' : analyticsPeriod === 'weekly' ? 'week' : analyticsPeriod === 'monthly' ? 'month' : 'year'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap bg-gray-50 p-1 rounded-xl w-full md:w-auto">
          {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
            <button key={p} onClick={() => setAnalyticsPeriod(p)}
              className={`flex-1 sm:flex-none px-4 py-2 min-h-[40px] rounded-lg text-xs font-semibold capitalize transition-all ${analyticsPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Object.entries(columns).map(([status, items]) => {
          const { label, color, icon: Icon } = colHeaders[status]
          return (
            <div key={status} className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color} mb-2`}>
                <Icon size={16} />
              </div>
              <p className="font-display font-700 text-2xl text-gray-900">{items.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              {[...Array(2)].map((_, j) => <div key={j} className="skeleton h-40 rounded-2xl" />)}
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <ChefHat size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-display font-600 text-xl text-gray-900 mb-1">All clear!</h3>
          <p className="text-gray-400 text-sm">No active orders right now. New orders will appear here automatically.</p>
        </div>
      ) : (
        /* Kanban columns */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {Object.entries(columns).map(([status, items]) => {
            const { label, color } = colHeaders[status]
            return (
              <div key={status}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl mb-3 text-xs font-semibold w-fit ${color}`}>
                  {label}
                  {items.length > 0 && (
                    <span className="bg-white bg-opacity-70 text-current px-1.5 py-0.5 rounded-lg font-bold">
                      {items.length}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 text-center">
                      <p className="text-xs text-gray-300">Empty</p>
                    </div>
                  ) : (
                    items.map(order => (
                      <OrderCard key={order._id} order={order}
                        onUpdate={handleUpdate} onReject={handleReject} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
