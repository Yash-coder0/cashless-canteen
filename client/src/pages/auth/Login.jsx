// src/pages/auth/Login.jsx
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Users, ChefHat, Shield, ArrowLeft } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [searchParams] = useSearchParams()
  const roleFromUrl = searchParams.get('role')

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      if (user.role === 'admin')   navigate('/admin')
      else if (user.role === 'kitchen') navigate('/kitchen')
      else navigate('/menu')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.')
    } finally { setLoading(false) }
  }

  if (!roleFromUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl animate-slide-up">
          <button onClick={() => navigate('/')} className="w-fit text-gray-500 hover:text-gray-800 transition flex items-center gap-1.5 text-sm font-semibold mb-8">
            <ArrowLeft size={16} /> Back to Home
          </button>
          <div className="text-center mb-10">
            <img src="/rit-logo.png" alt="RIT" className="h-24 w-auto object-contain mx-auto mb-6 drop-shadow-md rounded-2xl" onError={(e) => { e.target.style.display='none' }} />
            <h1 className="font-display font-800 text-4xl text-gray-900 mb-2">Welcome to RIT Canteen</h1>
            <p className="text-gray-500">Please select your login role to continue</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => navigate('?role=student')} className="card p-8 flex flex-col items-center hover:scale-105 hover:border-brand-500 transition-all text-center group cursor-pointer border-2 border-transparent shadow-card hover:shadow-card-hover">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Users size={32} />
              </div>
              <h3 className="font-display font-700 text-lg text-gray-900 mb-1">Student</h3>
              <p className="text-xs text-gray-400">Order food and view your history</p>
            </button>
            <button onClick={() => navigate('?role=kitchen')} className="card p-8 flex flex-col items-center hover:scale-105 hover:border-orange-500 transition-all text-center group cursor-pointer border-2 border-transparent shadow-card hover:shadow-card-hover">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <ChefHat size={32} />
              </div>
              <h3 className="font-display font-700 text-lg text-gray-900 mb-1">Kitchen</h3>
              <p className="text-xs text-gray-400">Manage incoming live orders</p>
            </button>
            <button onClick={() => navigate('?role=admin')} className="card p-8 flex flex-col items-center hover:scale-105 hover:border-gray-800 transition-all text-center group cursor-pointer border-2 border-transparent shadow-card hover:shadow-card-hover">
              <div className="w-16 h-16 bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-gray-800 group-hover:text-white transition-colors">
                <Shield size={32} />
              </div>
              <h3 className="font-display font-700 text-lg text-gray-900 mb-1">Admin</h3>
              <p className="text-xs text-gray-400">Manage users, menu and staff</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/rit-logo.png" alt="RIT Logo" className="h-20 w-auto object-contain mx-auto mb-4 drop-shadow-md rounded-2xl" onError={(e) => { e.target.style.display='none' }} />
          <h1 className="font-display font-700 text-3xl text-gray-900">
            {roleFromUrl === 'admin' ? 'Admin Login' : roleFromUrl === 'kitchen' ? 'Kitchen Login' : 'Student Login'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Official college canteen, cashless.</p>
        </div>

        <div className="card p-8 relative">
          <button onClick={() => navigate('/login')} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 transition flex items-center gap-1 text-xs font-semibold">
            <ArrowLeft size={14} /> Back
          </button>
          
          <h2 className="font-display font-600 text-xl text-gray-900 mb-6 text-center mt-4 border-b border-gray-100 pb-4">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">College Email</label>
              <input className="input" type="email" placeholder="prn@ritindia.edu" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPw ? 'text' : 'password'} placeholder="••••••••" required
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {roleFromUrl === 'student' && (
            <p className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-50">
              New student?{' '}
              <Link to="/register" className="text-brand-500 font-medium hover:text-brand-600">Create account</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
