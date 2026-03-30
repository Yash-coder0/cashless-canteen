import { useState } from 'react'
import { Outlet as KOutlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut as KLogOut, User, LayoutDashboard, Menu } from 'lucide-react'
import MobileNavDrawer from '../components/MobileNavDrawer'

const kitchenNav = [
  { to: '/kitchen',         icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/kitchen/profile', icon: User,            label: 'Profile' }
]

export function KitchenLayout() {
  const { user, logout } = useAuth()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 md:px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/rit-logo.png" alt="RIT" className="h-10 md:h-11 w-auto object-contain rounded-md shadow-sm border border-gray-100" onError={(e) => { e.target.style.display='none' }} />
          <div>
            <span className="font-display font-600 text-gray-900 hidden sm:inline">Kitchen Panel</span>
            <span className="font-display font-600 text-gray-900 sm:hidden">Kitchen</span>
            <span className="ml-2 text-xs text-gray-400 hidden sm:inline">RIT Canteen</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/kitchen" className="text-sm font-medium text-gray-600 hover:text-brand-500">Dashboard</Link>
          <Link to="/kitchen/profile" className="btn-ghost text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100">
            <User size={15} /> {user?.name?.split(' ')[0] || 'Profile'}
          </Link>
          <button onClick={logout} className="text-red-500 hover:bg-red-50 text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100">
            <KLogOut size={14} /> Logout
          </button>
        </div>

        {/* Mobile Nav Toggle */}
        <button 
          onClick={() => setIsMobileNavOpen(true)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-900 rounded-lg transition-colors hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      <MobileNavDrawer 
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        navItems={kitchenNav}
        userRole={user?.role || 'Kitchen'}
        logout={logout}
      />

      <main className="p-4 md:p-6 flex-1 w-full max-w-screen-xl mx-auto">
        <KOutlet />
      </main>
    </div>
  )
}

export default KitchenLayout
