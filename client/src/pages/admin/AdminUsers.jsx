// src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/axios'
import toast from 'react-hot-toast'
import { Search, UserCheck, UserX, X } from 'lucide-react'
import { format } from 'date-fns'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)

  const fetch = async (p = 1, q = search) => {
    setLoading(true)
    try {
      const r = await adminAPI.users({ role: 'student', page: p, limit: 20, search: q || undefined })
      setUsers(r.data.data)
      setTotal(r.data.total)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { const t = setTimeout(() => fetch(1), 400); return () => clearTimeout(t) }, [search])

  const handleToggle = async (user) => {
    await adminAPI.toggleUser(user._id)
    toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}.`)
    fetch(page)
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl text-gray-900">Students</h1>
          <p className="text-sm text-gray-400">{total} registered students</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-10" placeholder="Search name, email, college ID…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="card p-4 space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ResponsiveTable 
            columns={[
              { header: 'Name', cell: user => (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 font-bold text-xs shrink-0">
                      {user.name?.slice(0,2).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                )
              },
              { header: 'Email', cell: user => <span className="text-gray-500">{user.email}</span> },
              { header: 'College ID', cell: user => <span className="font-mono text-xs text-gray-600">{user.collegeId}</span> },
              { header: 'Phone', cell: user => <span className="text-gray-500">{user.phone || '—'}</span> },
              { header: 'Joined', cell: user => <span className="text-gray-400 text-xs">{format(new Date(user.createdAt), 'dd MMM yy')}</span> },
              { header: 'Status', cell: user => (
                  <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                )
              },
              { header: 'Action', cell: user => (
                  <button onClick={() => handleToggle(user)}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 min-h-[36px] rounded-lg transition-all
                                ${user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                    {user.isActive ? <><UserX size={13} />Deactivate</> : <><UserCheck size={13} />Activate</>}
                  </button>
                )
              }
            ]}
            data={users}
            renderMobileCard={(user) => (
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 font-bold text-sm shrink-0">
                      {user.name?.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="font-mono text-xs text-gray-500">{user.collegeId}</p>
                    </div>
                  </div>
                  <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{user.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user.phone || 'No phone'}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1">
                  <span className="text-xs text-gray-400">Joined {format(new Date(user.createdAt), 'dd MMM yyyy')}</span>
                  <button onClick={() => handleToggle(user)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 min-h-[44px] rounded-lg transition-all border
                                ${user.isActive ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}>
                    {user.isActive ? <><UserX size={14} /> Deactivate</> : <><UserCheck size={14} /> Activate</>}
                  </button>
                </div>
              </div>
            )}
          />
          {total > 20 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 bg-white md:bg-gray-50/50">
              <p className="text-xs text-gray-400">{total} students</p>
              <div className="flex gap-2">
                <button disabled={page===1} onClick={() => fetch(page-1)} className="btn-outline px-3 py-1 min-h-[36px] text-xs disabled:opacity-40">Prev</button>
                <span className="text-xs text-gray-500 flex items-center">Page {page}</span>
                <button disabled={users.length<20} onClick={() => fetch(page+1)} className="btn-outline px-3 py-1 min-h-[36px] text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ── src/pages/admin/AdminStaff.jsx ────────────────────────────────────────────
// Export this component from a separate file: src/pages/admin/AdminStaff.jsx
export function AdminStaff() {
  const [staff, setStaff]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState({ name:'', email:'', password:'', role:'kitchen', phone:'' })
  const [saving, setSaving]   = useState(false)

  const fetch = async () => {
    setLoading(true)
    const r = await adminAPI.staff()
    setStaff(r.data.data)
    setLoading(false)
  }
  useEffect(() => { fetch() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { authAPI } = await import('../../api/axios')
      await authAPI.createStaff(form)
      toast.success(`${form.role === 'kitchen' ? 'Kitchen staff' : 'Admin'} account created.`)
      setModal(false)
      setForm({ name:'', email:'', password:'', role:'kitchen', phone:'' })
      fetch()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from staff?`)) return
    await adminAPI.removeStaff(id)
    toast.success('Staff account deactivated.')
    fetch()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl text-gray-900">Staff Accounts</h1>
          <p className="text-sm text-gray-400">Kitchen workers and admins</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
          + Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />) :
          staff.map(s => (
            <div key={s._id} className="card p-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0
                                 ${s.role === 'admin' ? 'bg-purple-500' : 'bg-brand-500'}`}>
                  {s.name?.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${s.role === 'admin' ? 'badge-blue' : 'badge-orange'}`}>
                      {s.role === 'admin' ? 'Admin' : 'Kitchen'}
                    </span>
                    <span className={`badge ${s.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleRemove(s._id, s.name)}
                className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <UserX size={15} />
              </button>
            </div>
          ))
        }
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-display font-600 text-lg text-gray-900">Add Staff Member</h2>
              <button onClick={() => setModal(false)} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Full Name *</label>
                <input className="input" required value={form.name} onChange={set('name')} placeholder="Ramesh Kumar" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Email *</label>
                <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="ramesh@college.edu.in" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Role *</label>
                  <select className="input" value={form.role} onChange={set('role')}>
                    <option value="kitchen">Kitchen Worker</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
                  <input className="input" value={form.phone} onChange={set('phone')} placeholder="98xxxxxxxx" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Temporary Password *</label>
                <input className="input" type="password" required minLength={8} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating…' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
