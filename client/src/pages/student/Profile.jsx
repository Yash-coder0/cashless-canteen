// src/pages/student/Profile.jsx
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../api/axios'
import toast from 'react-hot-toast'
import { User, Mail, Hash, Phone, Lock, LogOut, ChevronRight, Shield } from 'lucide-react'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, logout } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' })
  const [saving, setSaving] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters.'); return }
    setSaving(true)
    try {
      await authAPI.logout() // reuse axios instance
      const api = (await import('../../api/axios')).default
      await api.patch('/auth/change-password', pwForm)
      toast.success('Password changed. Please log in again.')
      logout(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.')
    } finally { setSaving(false) }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8 animate-fade-in space-y-4">
      {/* Avatar */}
      <div className="card p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-display font-700 text-2xl shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="font-display font-700 text-xl text-gray-900">{user?.name}</h1>
          <span className="badge-orange badge mt-1">Student</span>
        </div>
      </div>

      {/* Account info */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-semibold text-gray-900">Account Details</h3>
          <button onClick={() => setShowPw(v => !v)} className="text-brand-500 text-xs font-semibold hover:text-brand-600">
            {showPw ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
        
        {!showPw ? (
          <>
            <InfoRow icon={User}   label="Name"       value={user?.name} />
            <InfoRow icon={Mail}   label="Email"      value={user?.email} />
            <InfoRow icon={Hash}   label="College ID" value={user?.collegeId} />
            <InfoRow icon={Phone}  label="Phone"      value={user?.phone} />
            <InfoRow icon={Shield} label="Role"       value="Student" />
          </>
        ) : (
          <form onSubmit={handlePasswordChange} className="mt-2 space-y-3 animate-slide-up bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Name</label>
              <input className="input" type="text" defaultValue={user?.name} placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Current Password (required to save)</label>
              <input className="input" type="password" placeholder="••••••••" required
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">New Password (optional)</label>
              <input className="input" type="password" placeholder="New password (min. 8 chars)"
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>



      {/* Logout */}
      <button onClick={() => logout()}
        className="w-full card p-4 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors">
        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
          <LogOut size={15} className="text-red-400" />
        </div>
        <span className="font-semibold text-sm">Sign Out</span>
      </button>

      <p className="text-center text-xs text-gray-400 pb-2">RIT Canteen Panel</p>
    </div>
  )
}
