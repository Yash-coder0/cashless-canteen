// src/pages/user/VerifyEmail.jsx
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing verification token.')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/verify-email?token=${token}`);
        const data = await res.json();
        
        if (data.success) {
          setStatus('success')
          setMessage(data.message)
        } else {
          setStatus('error')
          setMessage(data.message || 'Verification failed')
        }
      } catch (err) {
        setStatus('error')
        setMessage('Server error during verification. Please try again.')
      }
    }

    verify()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center animate-slide-up bg-white shadow-xl rounded-2xl">
        {status === 'loading' && (
          <div className="py-8">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="font-display font-600 text-xl text-gray-900 mb-2">Verifying Email...</h2>
            <p className="text-gray-500">Please wait while we securely process your token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8">
            <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" />
            <h2 className="font-display font-600 text-2xl text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-8 font-medium">{message}</p>
            <Link to="/login" className="btn-primary inline-flex w-full justify-center">
              Continue to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8">
            <XCircle size={64} className="text-red-500 mx-auto mb-6" />
            <h2 className="font-display font-600 text-2xl text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-8 font-medium">{message}</p>
            <Link to="/login" className="btn-outline inline-flex w-full justify-center">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
