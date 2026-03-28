// src/pages/admin/AdminOrders.jsx
import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/axios'
import { format } from 'date-fns'
import { Download, Search, Filter } from 'lucide-react'

const STATUS_BADGE = {
  placed:    'badge-blue',   accepted: 'badge-orange', cooking: 'badge-orange',
  ready:     'badge-green',  completed: 'badge-gray',  rejected: 'badge-red',
  cancelled: 'badge-gray',
}

export default function AdminOrders() {
  const [orders, setOrders]   = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [status, setStatus]   = useState('')
  const [dateFrom, setFrom]   = useState('')
  const [dateTo, setTo]       = useState('')

  const fetch = async (p = 1) => {
    setLoading(true)
    try {
      const r = await adminAPI.orders({ page: p, limit: 20, status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      setOrders(r.data.data)
      setTotal(r.data.total)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch(1) }, [status, dateFrom, dateTo])

  const handleExport = async () => {
    try {
      const res = await adminAPI.exportOrders({ status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = `orders-${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl text-gray-900">Orders</h1>
          <p className="text-sm text-gray-400">{total} total orders</p>
        </div>
        <button onClick={handleExport} className="btn-outline text-sm flex items-center gap-1.5">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="input w-36 py-2 text-sm">
            <option value="">All</option>
            {['placed','accepted','cooking','ready','completed','rejected','cancelled'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)} className="input py-2 text-sm w-36" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setTo(e.target.value)} className="input py-2 text-sm w-36" />
        </div>
        <button onClick={() => { setStatus(''); setFrom(''); setTo('') }}
          className="btn-ghost text-sm py-2">Clear</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order #','Student','Items','Total','Status','Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td></tr>
              )) : orders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{order.userId?.name}</p>
                    <p className="text-xs text-gray-400">{order.userId?.collegeId}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                    {order.items?.map(i => `${i.name}×${i.quantity}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">₹{order.totalAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_BADGE[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {format(new Date(order.createdAt), 'dd MMM yy, hh:mm a')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">{total} orders total</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => fetch(page - 1)} className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
              <span className="flex items-center text-xs text-gray-500">Page {page}</span>
              <button disabled={orders.length < 20} onClick={() => fetch(page + 1)} className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
