import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Home, CheckCircle, Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../../components/layouts/AuthLayout'
import { authAPI } from '../../api/axios'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { token } = useParams()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      await authAPI.resetPassword(token, { password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Link is invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md animate-slide-up mx-4 md:mx-0">
        
        <div className="text-center mb-8">
          <h1 className="font-display font-700 text-3xl text-gray-900">
            Reset Password
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter your new password below.
          </p>
        </div>

        <div className="card p-8">
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

          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                Password Reset Successful
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Your password has been updated. You can now sign in 
                with your new password.
              </p>
              <Link
                to="/login"
                className="btn-primary w-full text-center block py-3 rounded-xl"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center mb-4">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="input pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
