// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/axios'
import { Users, ShoppingBag, TrendingUp, IndianRupee, Star, Clock, Download } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:   'bg-brand-50 text-brand-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    blue:    'bg-blue-50 text-blue-500',
    purple:  'bg-purple-50 text-purple-500',
  }
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="font-display font-700 text-2xl text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-gray-900">₹{payload[0]?.value?.toFixed(2)}</p>
      {payload[1] && <p className="text-gray-500">{payload[1].value} orders</p>}
    </div>
  )
}

export default function Dashboard() {
  const [overview, setOverview]   = useState(null)
  const [revenue, setRevenue]     = useState([])
  const [items, setItems]         = useState(null)
  const [period, setPeriod]       = useState('monthly')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([adminAPI.overview(), adminAPI.itemAnalytics()])
      .then(([o, i]) => { setOverview(o.data.data); setItems(i.data) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    adminAPI.revenue({ period }).then(r => setRevenue(r.data.data))
  }, [period])

  const handleExport = async (type) => {
    try {
      const res = type === 'orders' ? await adminAPI.exportOrders() : await adminAPI.exportRevenue()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* toast from axios interceptor */ }
  }

  if (loading) return (
    <div className="p-6 grid grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Canteen overview and analytics</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => handleExport('revenue')}
            className="flex-1 sm:flex-none min-h-[44px] px-4 btn-outline text-sm flex items-center justify-center gap-1.5">
            <Download size={14} /> Revenue CSV
          </button>
          <button onClick={() => handleExport('orders')}
            className="flex-1 sm:flex-none min-h-[44px] px-4 btn-outline text-sm flex items-center justify-center gap-1.5">
            <Download size={14} /> Orders CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Total Revenue"     color="brand"
          value={`₹${overview?.totalRevenue?.toFixed(0) || 0}`}
          sub="All time completed orders" />
        <StatCard icon={ShoppingBag} label="Completed Orders"  color="emerald"
          value={overview?.totalCompletedOrders || 0}
          sub={`${overview?.todayOrders || 0} today`} />
        <StatCard icon={Users}       label="Active Students"   color="blue"
          value={overview?.totalStudents || 0} />
        <StatCard icon={Clock}       label="Today's Orders"    color="purple"
          value={overview?.todayOrders || 0} />
      </div>

      {/* Revenue chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-600 text-lg text-gray-900">Revenue</h2>
          <div className="flex overflow-x-auto scrollbar-hide gap-1 bg-gray-50 p-1 rounded-xl max-w-full">
            {['daily','weekly','monthly','yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`shrink-0 px-3 py-2 min-h-[44px] text-xs font-medium transition-all whitespace-nowrap rounded-lg
                            ${period === p ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenue} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={d => d?.slice(-5) || d} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={v => `₹${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2}
              fill="url(#rev)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top items */}
        <div className="card p-5 min-w-0 h-full">
          <h2 className="font-display font-600 text-base text-gray-900 mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> Most Popular Items
          </h2>
          <div className="space-y-3">
            {items?.mostPopular?.map((item, i) => (
              <div key={item._id} className="flex items-center gap-2 flex-wrap">
                <span className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.totalOrders} orders</p>
                </div>
                <span className="text-sm font-bold text-emerald-600 ml-auto shrink-0">₹{item.totalRevenue?.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slow movers */}
        <div className="card p-5 min-w-0 h-full">
          <h2 className="font-display font-600 text-base text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-300" /> Slow Moving Items
          </h2>
          <div className="space-y-3">
            {items?.slowMoving?.map((item, i) => (
              <div key={item._id} className="flex items-center gap-2 flex-wrap">
                <span className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-xs font-bold text-red-300 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.totalOrders} orders</p>
                </div>
                <span className="text-sm font-bold text-gray-400 ml-auto shrink-0">₹{item.totalRevenue?.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak hours */}
        {overview?.peakHours?.length > 0 && (
          <div className="card p-5 md:col-span-2">
            <h2 className="font-display font-600 text-base text-gray-900 mb-4">Peak Hours</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {overview.peakHours.map(h => (
                <div key={h.hour} className="flex-1 min-w-[120px] shrink-0 bg-brand-50 rounded-2xl p-4 text-center">
                  <p className="font-display font-700 text-2xl text-brand-500">{h.hour}</p>
                  <p className="text-sm text-gray-500 mt-1">{h.orders} orders</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
