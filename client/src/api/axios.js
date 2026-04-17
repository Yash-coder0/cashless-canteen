// src/api/axios.js
import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('canteen_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg = error.response?.data?.message || 'Something went wrong.'
    if (error.response?.status === 401) {
      localStorage.removeItem('canteen_token')
      localStorage.removeItem('canteen_user')
      window.location.href = '/login'
    } else if (error.response?.status !== 400) {
      // 400s are handled in-component; show toast for all other errors
      toast.error(msg)
    }
    return Promise.reject(error)
  }
)

export default api

// ── Typed API calls ───────────────────────────────────────────

export const authAPI = {
  register:      (data) => api.post('/auth/register', data),
  login:         (data) => api.post('/auth/login', data),
  me:            ()     => api.get('/auth/me'),
  logout:        ()     => api.post('/auth/logout'),
  createStaff:   (data) => api.post('/auth/create-staff', data),
}

export const menuAPI = {
  getAll:        (params) => api.get('/menu', { params }),
  getById:       (id)     => api.get(`/menu/${id}`),
  create:        (data)   => api.post('/menu', data),
  update:        (id, d)  => api.patch(`/menu/${id}`, d),
  delete:        (id)     => api.delete(`/menu/${id}`),
  toggleSoldOut: (id)     => api.patch(`/menu/${id}/sold-out`),
}

export const categoryAPI = {
  getAll:  ()     => api.get('/categories'),
  create:  (data) => api.post('/categories', data),
  update:  (id,d) => api.patch(`/categories/${id}`, d),
  delete:  (id)   => api.delete(`/categories/${id}`),
}

export const cartAPI = {
  get:      ()     => api.get('/cart'),
  add:      (data) => api.post('/cart/add', data),
  update:   (data) => api.patch('/cart/update', data),
  remove:   (id)   => api.delete(`/cart/remove/${id}`),
  clear:    ()     => api.delete('/cart/clear'),
  validate: ()     => api.post('/cart/validate'),
  toggleFav:(id)   => api.patch(`/cart/favourites/${id}`),
}

export const walletAPI = {
  get:             ()     => api.get('/wallet'),
  transactions:    (p)    => api.get('/wallet/transactions', { params: p }),
  analytics:       (p)    => api.get('/wallet/spending-analytics', { params: p }),
  initiateTopUp:   (data) => api.post('/wallet/topup/initiate', data),
  verifyTopUp:     (data) => api.post('/wallet/topup/verify', data),
}

export const orderAPI = {
  place:         (data) => api.post('/orders', data),
  myOrders:      (p)    => api.get('/orders', { params: p }),
  getById:       (id)   => api.get(`/orders/${id}`),
  cancel:        (id)   => api.patch(`/orders/${id}/cancel`),
  kitchenQueue:  ()     => api.get('/orders/kitchen/queue'),
  updateStatus:  (id,d) => api.patch(`/orders/${id}/status`, d),
}

export const adminAPI = {
  overview:      ()  => api.get('/admin/analytics/overview'),
  revenue:       (p) => api.get('/admin/analytics/revenue', { params: p }),
  itemAnalytics: ()  => api.get('/admin/analytics/items'),
  users:         (p) => api.get('/admin/users', { params: p }),
  toggleUser:    (id)=> api.patch(`/admin/users/${id}/toggle`),
  orders:        (p) => api.get('/admin/orders', { params: p }),
  staff:         ()  => api.get('/admin/staff'),
  removeStaff:   (id)=> api.delete(`/admin/staff/${id}`),
  allMenu:       ()  => api.get('/admin/menu'),
  exportOrders:  (p) => api.get('/admin/export/orders', { params: p, responseType: 'blob' }),
  exportRevenue: ()  => api.get('/admin/export/revenue', { responseType: 'blob' }),
  exportOrdersPDF: (p) => api.get('/admin/export/orders-pdf', { params: p, responseType: 'blob' }),
  exportRevenuePDF: (p) => api.get('/admin/export/revenue-pdf', { params: p, responseType: 'blob' }),
}

export const reviewAPI = {
  create:   (data) => api.post('/reviews', data),
  forItem:  (id,p) => api.get(`/reviews/item/${id}`, { params: p }),
  mine:     ()     => api.get('/reviews/my'),
}

export const notifAPI = {
  get:         () => api.get('/notifications'),
  markAllRead: () => api.patch('/notifications/read-all'),
  markRead:    (id) => api.patch(`/notifications/${id}/read`),
}
