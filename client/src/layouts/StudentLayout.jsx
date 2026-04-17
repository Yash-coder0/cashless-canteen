// src/layouts/StudentLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingBag, ClipboardList, Wallet, User, UtensilsCrossed, BarChart2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import Footer from '../components/Footer'

const nav = [
  { to: '/menu',    icon: UtensilsCrossed, label: 'Menu' },
  { to: '/orders',  icon: ClipboardList,   label: 'Orders' },
  { to: '/spending-analytics', icon: BarChart2, label: 'Spending' },
  { to: '/cart',    icon: ShoppingBag,     label: 'Cart' },
  { to: '/wallet',  icon: Wallet,          label: 'Wallet' },
  { to: '/profile', icon: User,            label: 'Profile' },
]

export default function StudentLayout() {
  const { itemCount } = useCart()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/rit-logo.png" alt="RIT Logo" className="h-10 w-auto object-contain rounded-md" onError={(e) => { e.target.style.display='none' }} />
          <span className="font-display font-700 text-lg text-gray-900 tracking-tight">
            RIT <span className="text-brand-500">Canteen</span>
          </span>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-24 w-full max-w-screen-xl mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[11px] font-medium transition-colors
             ${isActive ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'}`
          }>
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  {to === '/cart' && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-[9px] font-bold
                                     w-4 h-4 rounded-full flex items-center justify-center leading-none">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
