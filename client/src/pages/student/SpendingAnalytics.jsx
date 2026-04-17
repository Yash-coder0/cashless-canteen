import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { IndianRupee, ShoppingBag, TrendingUp, Calendar, ChevronRight } from 'lucide-react';

const COLORS = ['#16a34a', '#3b82f6', '#f97316', '#eab308', '#8b5cf6'];

export default function SpendingAnalytics() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/student', { params: { period } });
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="font-display font-700 text-xl text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-screen-md mx-auto px-4 pt-6 pb-12 animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-700 text-2xl text-gray-900">My Spending Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Track your canteen spending habits</p>
      </div>

      {/* Period Selector */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
        {['week', 'month', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              period === p 
                ? 'bg-brand-50 text-brand-600 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            This {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard 
                title="Total Spent" 
                value={`₹${data.totalSpent}`} 
                icon={IndianRupee} 
                colorClass="bg-red-50 text-red-500" 
              />
              <MetricCard 
                title="Total Orders" 
                value={data.totalOrders} 
                icon={ShoppingBag} 
                colorClass="bg-blue-50 text-blue-500" 
              />
              <MetricCard 
                title="Avg Order Value" 
                value={`₹${data.avgOrderValue}`} 
                icon={TrendingUp} 
                colorClass="bg-emerald-50 text-emerald-500" 
              />
            </div>

            {/* Trend Chart */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-display font-700 text-lg text-gray-900 mb-6 flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                Spending Trend
              </h3>
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  {period === 'month' ? (
                    <LineChart data={data.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} />
                      <YAxis tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} tickFormatter={v => `₹${v}`} width={50} />
                      <Tooltip 
                        formatter={(val) => [`₹${val}`, 'Spent']}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        cursor={{stroke: '#e5e7eb', strokeWidth: 2}}
                      />
                      <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    </LineChart>
                  ) : (
                    <BarChart data={data.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} />
                      <YAxis tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} tickFormatter={v => `₹${v}`} width={50} />
                      <Tooltip 
                        formatter={(val) => [`₹${val}`, 'Spent']}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f3f4f6'}}
                      />
                      <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={period === 'week' ? 40 : 20} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie & Top Items Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                <h3 className="font-display font-700 text-lg text-gray-900 mb-2 w-full">Spend by Category</h3>
                {data.categoryBreakdown.length > 0 ? (
                  <div className="w-full h-64 flex flex-col justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categoryBreakdown}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {data.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => `₹${val}`} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-10">No category data</div>
                )}
              </div>

              {/* Top Items */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <h3 className="font-display font-700 text-lg text-gray-900 mb-4">Top Ordered Items</h3>
                <div className="space-y-4 flex-1">
                  {data.topItems.length > 0 ? (
                    data.topItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">🍽️</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">Ordered {item.count} times</p>
                        </div>
                        <div className="font-bold text-sm text-gray-900">₹{item.totalSpent}</div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm py-10">No items ordered</div>
                  )}
                </div>
              </div>

            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <h3 className="font-display font-700 text-lg text-gray-900 mb-4">Recent Transactions</h3>
              {data.recentTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="font-medium pb-3 pr-4">Date</th>
                        <th className="font-medium pb-3 pr-4">Order ID</th>
                        <th className="font-medium pb-3 pr-4">Items</th>
                        <th className="font-medium pb-3 text-right">Amount</th>
                        <th className="pb-3 pl-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.recentTransactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 pr-4 text-gray-500">
                            {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-gray-600">
                            #{tx.orderId}
                          </td>
                          <td className="py-3 pr-4 text-gray-900 max-w-[200px] truncate">
                            {tx.items}
                          </td>
                          <td className="py-3 font-semibold text-gray-900 text-right">
                            ₹{tx.amount}
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <Link to={`/orders`} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors">
                              <ChevronRight size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400 text-sm py-10">No recent transactions</div>
              )}
            </div>

          </>
        )
      )}
    </div>
  );
}
