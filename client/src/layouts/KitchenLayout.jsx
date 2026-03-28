import { Outlet as KOutlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut as KLogOut, ChefHat, User } from 'lucide-react'

export function KitchenLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/rit-logo.png" alt="RIT" className="h-11 w-auto object-contain rounded-md shadow-sm border border-gray-100" onError={(e) => { e.target.style.display='none' }} />
          <div>
            <span className="font-display font-600 text-gray-900">Kitchen Panel</span>
            <span className="ml-2 text-xs text-gray-400">RIT Canteen</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/kitchen" className="text-sm font-medium text-gray-600 hover:text-brand-500">Dashboard</Link>
          <Link to="/kitchen/profile" className="btn-ghost text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100">
            <User size={15} /> {user?.name?.split(' ')[0] || 'Profile'}
          </Link>
          <button onClick={logout} className="text-red-500 hover:bg-red-50 text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100">
            <KLogOut size={14} /> Logout
          </button>
        </div>
      </header>
      <main className="p-6">
        <KOutlet />
      </main>
    </div>
  )
}

export default KitchenLayout
