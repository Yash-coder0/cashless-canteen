// src/pages/auth/Login.jsx
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Users, ChefHat, Shield, ArrowLeft, Home } from 'lucide-react'
import AuthLayout from '../../components/layouts/AuthLayout'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [searchParams] = useSearchParams()
  const roleFromUrl = searchParams.get('role')

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(form.email, form.password, roleFromUrl)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      if (user.role === 'admin')   navigate('/admin')
      else if (user.role === 'kitchen') navigate('/kitchen')
      else navigate('/menu')
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError(err.response?.data?.message || 'Login failed.')
      } else {
        toast.error(err.response?.data?.message || 'Login failed.')
      }
    } finally { setLoading(false) }
  }

  if (!roleFromUrl) {
    return (
      <AuthLayout>
        <div className="w-full max-w-2xl animate-slide-up mx-4 md:mx-0">
          <div className="text-center mb-10">
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
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md animate-slide-up mx-4 md:mx-0">
        <div className="text-center mb-8">
          <h1 className="font-display font-700 text-3xl text-gray-900">
            {roleFromUrl === 'admin' ? 'Admin Login' : roleFromUrl === 'kitchen' ? 'Kitchen Login' : 'Student Login'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Official college canteen, cashless.</p>
        </div>

        <div className="card p-8 relative">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors"
            >
              <Home size={16} />
              Home
            </Link>
          </div>
          
          <h2 className="font-display font-600 text-xl text-gray-900 mb-6 text-center mt-4 border-b border-gray-100 pb-4">Sign in</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input className="input" type="email" placeholder="you@gmail.com" required
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
            <div className="text-right mb-4 -mt-2">
              <Link 
                to="/forgot-password"
                className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Forgot password?
              </Link>
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
    </AuthLayout>
  )
}
