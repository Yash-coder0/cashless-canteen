// src/pages/admin/AdminOrders.jsx
import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/axios'
import { format } from 'date-fns'
import { Download, Search, Filter } from 'lucide-react'
import ResponsiveTable from '../../components/ResponsiveTable'

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

  const columns = [
    { header: 'Order #', cell: row => <span className="font-mono text-xs font-semibold text-gray-700">{row.orderNumber}</span> },
    { header: 'Student', cell: row => (
        <>
          <p className="font-medium text-gray-800">{row.userId?.name}</p>
          <p className="text-xs text-gray-400">{row.userId?.collegeId}</p>
        </>
      )
    },
    { header: 'Items', cell: row => <span className="text-gray-500 line-clamp-2 md:max-w-[200px]">{row.items?.map(i => `${i.name}×${i.quantity}`).join(', ')}</span> },
    { header: 'Total', cell: row => <span className="font-bold text-gray-900">₹{row.totalAmount?.toFixed(2)}</span> },
    { header: 'Status', cell: row => (
        <span className={`badge ${STATUS_BADGE[row.status]}`}>
          {row.status}
        </span>
      )
    },
    { header: 'Date', cell: row => <span className="text-gray-400 text-xs">{format(new Date(row.createdAt), 'dd MMM yy, hh:mm a')}</span> }
  ]

  const renderMobileCard = (row) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-mono text-xs font-bold text-gray-700 block mb-1">#{row.orderNumber}</span>
          <p className="font-medium text-gray-900 text-sm">{row.userId?.name}</p>
          <p className="text-xs text-gray-500">{row.userId?.collegeId}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900 mb-1">₹{row.totalAmount?.toFixed(2)}</p>
          <span className={`badge ${STATUS_BADGE[row.status]}`}>{row.status}</span>
        </div>
      </div>
      <div className="bg-gray-50 p-2 rounded-lg mt-1">
        <p className="text-xs text-gray-600 line-clamp-2">{row.items?.map(i => `${i.name}×${i.quantity}`).join(', ')}</p>
      </div>
      <div className="text-right mt-1">
        <span className="text-xs text-gray-400">{format(new Date(row.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 animate-fade-in w-full max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl text-gray-900">Orders</h1>
          <p className="text-sm text-gray-400">{total} total orders</p>
        </div>
        <button onClick={handleExport} className="btn-outline text-sm flex items-center gap-1.5 h-11 px-4">
          <Download size={14} /> <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-col md:flex-row md:items-end gap-3 w-full">
        <div className="w-full md:w-auto">
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="input w-full md:w-36 py-2 h-11 text-sm">
            <option value="">All</option>
            {['placed','accepted','cooking','ready','completed','rejected','cancelled'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <label className="text-xs text-gray-500 block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)} className="input py-2 h-11 text-sm w-full md:w-36" />
        </div>
        <div className="w-full md:w-auto">
          <label className="text-xs text-gray-500 block mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setTo(e.target.value)} className="input py-2 h-11 text-sm w-full md:w-36" />
        </div>
        <button onClick={() => { setStatus(''); setFrom(''); setTo('') }}
          className="btn-ghost text-sm py-2 h-11 w-full md:w-auto border border-gray-200 md:border-transparent">Clear</button>
      </div>

      {/* Table & Pagination */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        ) : (
          <ResponsiveTable 
            columns={columns} 
            data={orders} 
            renderMobileCard={renderMobileCard} 
          />
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white md:bg-gray-50/50">
            <p className="text-xs text-gray-400">{total} orders total</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => fetch(page - 1)} className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
              <span className="flex flex-col justify-center items-center text-xs text-gray-500">Page {page}</span>
              <button disabled={orders.length < 20} onClick={() => fetch(page + 1)} className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
