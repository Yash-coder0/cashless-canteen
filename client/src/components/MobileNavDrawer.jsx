import { NavLink } from 'react-router-dom'
import { X, LogOut } from 'lucide-react'

// src/components/MobileNavDrawer.jsx
export default function MobileNavDrawer({ isOpen, onClose, navItems, userRole, logout }) {
  if (!isOpen) return null

  return (
    <div className="md:hidden">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src="/rit-logo.png" alt="RIT Logo" className="h-8 w-auto object-contain rounded border border-gray-100 shadow-sm" onError={(e) => { e.target.style.display='none' }} />
            <span className="font-display font-700 text-lg">
              RIT Canteen
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink 
              key={to} 
              to={to} 
              end={end} 
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all
                 ${isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs uppercase">
              {userRole?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-900 uppercase">{userRole}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              onClose()
              if (logout) logout()
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </div>
  )
}
