import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../api/axios'
import toast from 'react-hot-toast'
import { User, Mail, Hash, Phone, Shield, LogOut } from 'lucide-react'

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

export default function KitchenProfile() {
  const { user, logout } = useAuth()
  const [showEdit, setShowEdit] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' })
  const [saving, setSaving] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (pwForm.newPassword) {
        if (pwForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters.'); return }
        const api = (await import('../../api/axios')).default
        await api.patch('/auth/change-password', pwForm)
        toast.success('Profile updated. Please log in again.')
        logout(false)
      } else {
        toast.success('Profile updated successfully.')
        setShowEdit(false)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.')
    } finally { setSaving(false) }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-xl mx-auto animate-fade-in space-y-4">
      {/* Avatar */}
      <div className="card p-6 flex items-center gap-4 border border-gray-100 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-display font-700 text-2xl shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="font-display font-700 text-xl text-gray-900">{user?.name}</h1>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block">Kitchen Staff</span>
        </div>
      </div>

      {/* Account info */}
      <div className="card p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 px-1">Staff Details</h3>
          <button onClick={() => setShowEdit(v => !v)} className="text-brand-500 text-xs font-semibold hover:text-brand-600 transition-colors px-2 py-2 min-h-[44px] flex items-center justify-center">
            {showEdit ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
        
        {!showEdit ? (
          <>
            <InfoRow icon={User}   label="Name"       value={user?.name} />
            <InfoRow icon={Mail}   label="Email"      value={user?.email} />
            <InfoRow icon={Phone}  label="Phone"      value={user?.phone || 'Not provided'} />
            <InfoRow icon={Shield} label="Role"       value="Kitchen" />
          </>
        ) : (
          <form onSubmit={handleUpdate} className="mt-2 space-y-3 animate-slide-up bg-gray-50 p-4 rounded-xl border border-gray-100">
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
            <button type="submit" disabled={saving} className="btn-primary w-full mt-2 min-h-[44px]">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>

      {/* Logout */}
      <button onClick={() => logout()}
        className="w-full card p-4 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors border border-gray-100 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
          <LogOut size={15} className="text-red-400" />
        </div>
        <span className="font-semibold text-sm">Sign Out System</span>
      </button>
    </div>
  )
}
