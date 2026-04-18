import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-3">
          <img src="/rit-logo.png" alt="RIT" className="h-10 w-auto object-contain rounded-md" onError={(e) => { e.target.style.display='none' }} />
          <span className="font-display font-700 text-xl text-gray-900 tracking-tight">
            RIT Canteen
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Login
          </Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2">
            Get Started
          </Link>
        </div>

        {/* Mobile Nav Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="sm:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 flex items-center justify-center min-w-[44px] min-h-[44px] transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`sm:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-40 overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col p-4 space-y-3">
          <Link 
            to="/login" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full text-center py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-transparent"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="btn-primary w-full py-3 text-center text-base"
          >
            Get Started
          </Link>
        </div>
      </div>
    </>
  )
}
