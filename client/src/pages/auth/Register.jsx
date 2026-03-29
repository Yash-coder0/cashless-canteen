// src/pages/auth/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name:'', email:'', password:'', collegeId:'', phone:'' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Please verify your email.')
      setSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <button onClick={() => navigate('/login')} className="w-fit text-gray-500 hover:text-gray-800 transition flex items-center gap-1.5 text-sm font-semibold mb-6">
          <ArrowLeft size={16} /> Back to Login
        </button>
        
        <div className="text-center mb-8">
          <img src="/rit-logo.png" alt="RIT Logo" className="h-20 w-auto object-contain mx-auto mb-4 drop-shadow-md rounded-2xl" onError={(e) => { e.target.style.display='none' }} />
          <h1 className="font-display font-700 text-3xl text-gray-900">RIT Canteen</h1>
          <p className="text-gray-500 mt-1 text-sm">Join the cashless canteen experience.</p>
        </div>

        {success ? (
          <div className="card p-8 text-center animate-slide-up bg-white">
            <div className="w-16 h-16 bg-orange-100 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} />
            </div>
            <h2 className="font-display font-600 text-xl text-gray-900 mb-2">Check your college email</h2>
            <p className="text-gray-600 mb-6 font-medium text-sm leading-relaxed">
              We sent a verification link to <strong className="text-gray-900">{form.email}</strong>.<br/>
              You must verify your email address before logging in.
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">
              Back to Login
            </button>
          </div>
        ) : (
          <div className="card p-8">
            <h2 className="font-display font-600 text-xl text-gray-900 mb-6">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input className="input" placeholder="Arjun Sharma" required value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">College Email</label>
              <input className="input" type="email" placeholder="prn@gmail.com" required value={form.email} onChange={set('email')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">College ID</label>
                <input className="input" placeholder="CS21B001" required value={form.collegeId} onChange={set('collegeId')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (opt.)</label>
                <input className="input" placeholder="98xxxxxxxx" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input className="input pr-11" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" required
                  value={form.password} onChange={set('password')} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 font-medium hover:text-brand-600">Sign in</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
