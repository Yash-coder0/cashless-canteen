// src/pages/student/Menu.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { menuAPI, categoryAPI } from '../../api/axios'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'
import { Search, SlidersHorizontal, Leaf, Flame, Star, ShoppingBag, Plus, Minus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const SORTS = [
  { value: 'popular',    label: 'Popular' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'price_asc',  label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
]

function MenuCard({ item }) {
  const { addToCart, cart, updateItem } = useCart()
  const [adding, setAdding] = useState(false)

  const cartItem = cart?.items?.find(i => i.menuItem?._id === item._id || i.menuItem === item._id)
  const qty = cartItem?.quantity || 0

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true)
    try {
      await addToCart(item._id, 1)
      toast.success(`Added to cart!`, { icon: '🛒' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add to cart.')
    } finally { setAdding(false) }
  }

  const handleQty = async (e, newQty) => {
    e.preventDefault();
    e.stopPropagation();
    try { await updateItem(item._id, newQty) } catch { toast.error('Update failed.') }
  }

  return (
    <Link to={`/menu/${item._id}`} className={`block cursor-pointer card overflow-hidden transition-all duration-200 hover:shadow-card-hover
                     ${item.isSoldOut ? 'opacity-60' : ''}`}>
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {item.images?.[0]
          ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        }
        {item.isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">SOLD OUT</span>
          </div>
        )}
        {item.tags?.includes('bestseller') && (
          <span className="absolute top-2 left-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            BESTSELLER
          </span>
        )}
        {/* Veg / Non-veg dot */}
        <span className={`absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center
                          ${item.isVegetarian ? 'border-emerald-600 bg-white' : 'border-red-600 bg-white'}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${item.isVegetarian ? 'bg-emerald-600' : 'bg-red-600'}`} />
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>

        <div className="flex items-center gap-2 mt-1.5">
          {item.averageRating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
              <Star size={11} fill="currentColor" />{item.averageRating}
            </span>
          )}
          {item.isSpicy && <Flame size={12} className="text-red-400" />}
          <span className="text-xs text-gray-400">{item.preparationTime} min</span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="font-display font-700 text-gray-900">₹{item.price}</span>

          {item.isSoldOut ? (
            <span className="text-xs text-gray-400 font-medium">Unavailable</span>
          ) : qty === 0 ? (
            <button onClick={handleAdd} disabled={adding}
              className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 min-h-[44px] rounded-xl
                         flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-70">
              <Plus size={16} /> Add
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-brand-50 rounded-xl p-1">
              <button onClick={(e) => handleQty(e, qty - 1)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
                <Minus size={14} className="text-brand-500" />
              </button>
              <span className="text-sm font-bold text-brand-600 min-w-[24px] text-center">{qty}</span>
              <button onClick={(e) => handleQty(e, qty + 1)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
                <Plus size={14} className="text-brand-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Menu() {
  const { user } = useAuth()
  const [items, setItems]           = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [activeCategory, setCategory] = useState('')
  const [isVeg, setIsVeg]           = useState(false)
  const [sort, setSort]             = useState('popular')
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.data))
  }, [])

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    try {
      const res = await menuAPI.getAll({
        category: activeCategory || undefined,
        isVegetarian: isVeg || undefined,
        search: search || undefined,
        sort, page, limit: 12,
      })
      setItems(res.data.data)
      setTotalPages(res.data.totalPages)
    } finally { setLoading(false) }
  }, [activeCategory, isVeg, sort, page, search])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchMenu() }, 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1); fetchMenu() }, [activeCategory, isVeg, sort])
  useEffect(() => { fetchMenu() }, [page])

  const SkeletonCard = () => (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3]" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-8 w-full mt-2" />
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4 animate-fade-in">
      {/* Greeting */}
      <div className="mb-4">
        <h1 className="font-display font-700 text-2xl text-gray-900">
          Hey, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm">What are you craving today?</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-10 bg-white" placeholder="Search samosa, chai, meals…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <button onClick={() => setCategory('')}
          className={`shrink-0 px-4 min-h-[40px] rounded-full text-sm font-medium border transition-all flex items-center justify-center
                      ${!activeCategory ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
          All
        </button>
        {categories.map(c => (
          <button key={c._id} onClick={() => setCategory(c._id)}
            className={`shrink-0 px-4 min-h-[40px] rounded-full text-sm font-medium border transition-all flex items-center justify-center
                        ${activeCategory === c._id ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <button onClick={() => setIsVeg(v => !v)}
          className={`flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl border text-sm font-medium transition-all flex-1 sm:flex-none
                      ${isVeg ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-500'}`}>
          <Leaf size={16} /> Veg
        </button>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-4 min-h-[44px] bg-white text-gray-600 outline-none focus:border-brand-400 flex-1 sm:flex-none">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 font-medium">No items found</p>
          <p className="text-gray-400 text-sm">Try a different search or category</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => <MenuCard key={item._id} item={item} />)}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline px-4 py-2 text-sm disabled:opacity-40">Previous</button>
              <span className="flex items-center text-sm text-gray-500">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline px-4 py-2 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
