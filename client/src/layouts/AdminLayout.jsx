// src/layouts/AdminLayout.jsx
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, UserCog, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/admin',        icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/menu',   icon: UtensilsCrossed, label: 'Menu' },
  { to: '/admin/users',  icon: Users,           label: 'Students' },
  { to: '/admin/staff',  icon: UserCog,         label: 'Staff' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
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
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`
            }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout}
          className="flex items-center gap-3 px-6 py-4 text-sm text-gray-400 hover:text-red-500 border-t border-gray-100 transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}

