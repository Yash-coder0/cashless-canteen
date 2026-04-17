// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import useSmoothScroll from './utils/useSmoothScroll'

// Auth
import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home     from './pages/public/Home'
import VerifyEmail from './pages/user/VerifyEmail'

// Layouts
import StudentLayout from './layouts/StudentLayout'
import KitchenLayout from './layouts/KitchenLayout'
import AdminLayout   from './layouts/AdminLayout'

// Student pages
import Menu    from './pages/student/Menu'
import Cart    from './pages/student/Cart'
import Orders  from './pages/student/Orders'
import OrderDetail from './pages/student/OrderDetail'
import ProductDetail from './pages/student/ProductDetail'
import SpendingAnalytics from './pages/student/SpendingAnalytics'
import Wallet  from './pages/student/Wallet'
import Profile from './pages/student/Profile'

import KitchenQueue from './pages/kitchen/KitchenQueue'
import KitchenProfile from './pages/kitchen/KitchenProfile'

// Admin pages
import Dashboard    from './pages/admin/Dashboard'
import AdminOrders  from './pages/admin/AdminOrders'
import AdminMenu    from './pages/admin/AdminMenu'
import AdminUsers   from './pages/admin/AdminUsers'
import AdminStaff   from './pages/admin/AdminStaff'

// ── Route guards ──────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { user } = useAuth()
  if (user) {
    if (user.role === 'admin')   return <Navigate to="/admin" replace />
    if (user.role === 'kitchen') return <Navigate to="/kitchen" replace />
    return <Navigate to="/menu" replace />
  }
  return children
}

const Spinner = () => (
  <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
)

export default function App() {
  useSmoothScroll()
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />

      {/* Student */}
      <Route element={<ProtectedRoute roles={['student']}><StudentLayout /></ProtectedRoute>}>
        <Route path="/menu"         element={<Menu />} />
        <Route path="/menu/:id"     element={<ProductDetail />} />
        <Route path="cart"         element={<Cart />} />
        <Route path="orders"       element={<Orders />} />
        <Route path="orders/:id"   element={<OrderDetail />} />
        <Route path="spending-analytics" element={<SpendingAnalytics />} />
        <Route path="wallet"       element={<Wallet />} />
        <Route path="profile"      element={<Profile />} />
      </Route>

      {/* Kitchen */}
      <Route path="/kitchen" element={<ProtectedRoute roles={['kitchen','admin']}><KitchenLayout /></ProtectedRoute>}>
        <Route index element={<KitchenQueue />} />
        <Route path="profile" element={<KitchenProfile />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="menu"   element={<AdminMenu />} />
        <Route path="users"  element={<AdminUsers />} />
        <Route path="staff"  element={<AdminStaff />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
