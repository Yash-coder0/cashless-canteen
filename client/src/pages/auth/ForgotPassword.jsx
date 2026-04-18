import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, CheckCircle } from 'lucide-react'
import AuthLayout from '../../components/layouts/AuthLayout'
import { authAPI } from '../../api/axios'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authAPI.forgotPassword({ email })
      setSubmitted(true)
    } catch (err) {
      // Show generic error only for network issues or explicit server 500s.
      // authAPI.forgotPassword will usually return 200 even if email not found, 
      // but just in case:
      if (err.response?.status >= 500) {
        setError('Something went wrong. Try again later.')
      } else {
        setSubmitted(true) // Treat bad requests (e.g. invalid email format) same or show error
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md animate-slide-up mx-4 md:mx-0">
        
        <div className="text-center mb-8">
          <h1 className="font-display font-700 text-3xl text-gray-900">
            Forgot Password
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter your email to receive a reset link.
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

          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                Check your email
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                If this email is registered, a reset link has been sent. 
                Check your inbox and spam folder.
              </p>
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-600 text-sm font-medium"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="text-center text-sm text-gray-500 mt-6">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
