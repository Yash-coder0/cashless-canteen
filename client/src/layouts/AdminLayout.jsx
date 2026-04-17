// src/layouts/AdminLayout.jsx
import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, UserCog, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import MobileNavDrawer from '../components/MobileNavDrawer'

const nav = [
  { to: '/admin',        icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/menu',   icon: UtensilsCrossed, label: 'Menu' },
  { to: '/admin/users',  icon: Users,           label: 'Students' },
  { to: '/admin/staff',  icon: UserCog,         label: 'Staff' },
]

export default function AdminLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const { logout, user } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <img src="/rit-logo.png" alt="RIT Logo" className="h-8 w-auto object-contain rounded border border-gray-100 shadow-sm" onError={(e) => { e.target.style.display='none' }} />
          <span className="font-display font-700 text-lg">
            RIT Canteen
          </span>
          <span className="ml-1 text-[10px] font-semibold bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-md">ADMIN</span>
        </div>
        <button 
          onClick={() => setIsMobileNavOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-900 rounded-lg transition-colors hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 gap-2">
          <img src="/rit-logo.png" alt="RIT Logo" className="h-8 w-auto object-contain rounded border border-gray-100 shadow-sm" onError={(e) => { e.target.style.display='none' }} />
          <span className="font-display font-700 text-lg">
            RIT Canteen
          </span>
          <span className="ml-1 text-[10px] font-semibold bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-md">ADMIN</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all
               ${isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`
            }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout}
          className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 border-t border-gray-100 transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Mobile Nav Drawer */}
      <MobileNavDrawer 
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        navItems={nav}
        userRole={user?.role || 'Admin'}
        logout={logout}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto lg:pt-0 pt-16 w-full" data-lenis-prevent>
        <Outlet />
      </div>
    </div>
  )
}

