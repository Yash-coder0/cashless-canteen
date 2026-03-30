// src/pages/student/Wallet.jsx
import { useState, useEffect } from 'react'
import { walletAPI } from '../../api/axios'
import toast from 'react-hot-toast'
import { Wallet as WalletIcon, TrendingUp, TrendingDown, Plus, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = RAZORPAY_SCRIPT
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function Wallet() {
  const [wallet, setWallet]           = useState(null)
  const [transactions, setTxns]       = useState([])
  const [analytics, setAnalytics]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topping, setTopping]         = useState(false)
  const [period, setPeriod]           = useState('monthly')

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { fetchAnalytics() }, [period])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [w, t] = await Promise.all([walletAPI.get(), walletAPI.transactions({ limit: 15 })])
      setWallet(w.data.data)
      setTxns(t.data.data)
    } finally { setLoading(false) }
  }

  const fetchAnalytics = async () => {
    try {
      const r = await walletAPI.analytics({ period })
      setAnalytics(r.data.data)
    } catch { /* silent */ }
  }

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount)
    if (!amount || amount < 10) { toast.error('Minimum top-up is ₹10.'); return }
    if (amount > 5000) { toast.error('Maximum top-up is ₹5000.'); return }

    const loaded = await loadRazorpay()
    if (!loaded) { toast.error('Payment gateway failed to load.'); return }

    setTopping(true)
    try {
      const res = await walletAPI.initiateTopUp({ amount })
      const { razorpayOrderId, razorpayKeyId, transactionId, prefill } = res.data.data

      const options = {
        key: razorpayKeyId,
        amount: amount * 100,
        currency: 'INR',
        name: 'CanteenPay',
        description: `Wallet Top-up ₹${amount}`,
        order_id: razorpayOrderId,
        prefill: { name: prefill.name, email: prefill.email },
        theme: { color: '#f97316' },
        handler: async (response) => {
          try {
            await walletAPI.verifyTopUp({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              transactionId,
            })
            toast.success(`₹${amount} added to wallet!`, { duration: 4000 })
            setTopUpAmount('')
            await fetchAll()
          } catch { toast.error('Verification failed. Contact support.') }
        },
        modal: { ondismiss: () => setTopping(false) },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Top-up failed.')
      setTopping(false)
    }
  }

  const txIcon = (type) => {
    if (type === 'credit') return <ArrowDownLeft size={16} className="text-emerald-500" />
    if (type === 'refund')  return <RotateCcw size={16} className="text-blue-500" />
    return <ArrowUpRight size={16} className="text-red-400" />
  }

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-6 animate-fade-in space-y-4">
      {/* Balance card */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-orange-400 p-6 text-white shadow-lg shadow-brand-200">
        <div className="flex items-center gap-2 mb-1 opacity-80">
          <WalletIcon size={16} />
          <span className="text-sm font-medium">Wallet Balance</span>
        </div>
        <p className="font-display font-700 text-4xl mb-4">₹{wallet?.balance?.toFixed(2)}</p>
        <div className="flex gap-4 text-sm opacity-80">
          <span className="flex items-center gap-1"><TrendingUp size={14} />₹{wallet?.totalCredited?.toFixed(2)} in</span>
          <span className="flex items-center gap-1"><TrendingDown size={14} />₹{wallet?.totalDebited?.toFixed(2)} out</span>
        </div>
      </div>

      {/* Top-up */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Add Money</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {[50,100,200,500].map(amt => (
            <button key={amt} onClick={() => setTopUpAmount(String(amt))}
              className={`flex-1 py-2 min-h-[44px] flex items-center justify-center text-sm font-medium rounded-xl border transition-all
                          ${topUpAmount === String(amt) ? 'bg-brand-50 border-brand-400 text-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              ₹{amt}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input flex-1 h-11" type="number" placeholder="Custom amount (₹10 – ₹5000)"
            value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} min={10} max={5000} />
          <button onClick={handleTopUp} disabled={topping || !topUpAmount}
            className="btn-primary flex items-center justify-center gap-1.5 shrink-0 min-h-[44px] px-6">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Spending chart */}
      {analytics.length > 0 && (
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h3 className="font-semibold text-gray-900">Spending</h3>
            <div className="flex overflow-x-auto scrollbar-hide gap-1 w-full sm:w-auto pb-1 sm:pb-0">
              {['weekly','monthly','yearly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`shrink-0 px-3 py-2 min-h-[44px] text-sm whitespace-nowrap flex items-center justify-center rounded-lg font-medium transition-all
                              ${period === p ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={d => d.slice(-5)} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={v => [`₹${v}`, 'Spent']} contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #f3f4f6' }} />
              <Area type="monotone" dataKey="totalSpent" stroke="#f97316" strokeWidth={2}
                fill="url(#spend)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx._id} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                                 ${tx.type === 'credit' ? 'bg-emerald-50' : tx.type === 'refund' ? 'bg-blue-50' : 'bg-red-50'}`}>
                  {txIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">{format(new Date(tx.createdAt), 'dd MMM, hh:mm a')}</p>
                </div>
                <span className={`font-bold text-sm shrink-0
                                  ${tx.type === 'debit' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {tx.type === 'debit' ? '-' : '+'}₹{tx.amount?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
