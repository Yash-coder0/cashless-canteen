// src/pages/admin/AdminMenu.jsx
import { useState, useEffect } from 'react'
import { adminAPI, menuAPI, categoryAPI } from '../../api/axios'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Leaf, Flame } from 'lucide-react'

const EMPTY_FORM = { name:'', description:'', price:'', category:'', isVegetarian:true, isVegan:false, isSpicy:false, preparationTime:10, tags:'', image:null }

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display font-600 text-lg text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function AdminMenu() {
  const [items, setItems]           = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null) // null | 'add' | 'edit' | 'addCat'
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [catForm, setCatForm]       = useState({ name:'', description:'' })
  const [saving, setSaving]         = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const [m, c] = await Promise.all([adminAPI.allMenu(), categoryAPI.getAll()])
    setItems(m.data.data)
    setCategories(c.data.data)
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const openAdd = () => { setForm(EMPTY_FORM); setEditingItem(null); setModal('add') }
  const openEdit = (item) => {
    setForm({ ...item, price: item.price, tags: item.tags?.join(',') || '', category: item.category?._id || item.category })
    setEditingItem(item)
    setModal('edit')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = new FormData()
      payload.append('name', form.name)
      payload.append('price', form.price)
      payload.append('category', form.category)
      if (form.description) payload.append('description', form.description)
      if (form.preparationTime) payload.append('preparationTime', form.preparationTime)
      if (form.tags) payload.append('tags', form.tags)
      payload.append('isVegetarian', form.isVegetarian)
      payload.append('isVegan', form.isVegan)
      payload.append('isSpicy', form.isSpicy)
      if (form.image) payload.append('image', form.image)

      if (editingItem) { await menuAPI.update(editingItem._id, payload); toast.success('Item updated.') }
      else { await menuAPI.create(payload); toast.success('Item created.') }
      setModal(null)
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from the menu?')) return
    await menuAPI.delete(id)
    toast.success('Item removed.')
    fetchAll()
  }

  const handleToggleSoldOut = async (item) => {
    await menuAPI.toggleSoldOut(item._id)
    toast.success(`${item.name}: ${item.isSoldOut ? 'back in stock' : 'marked sold out'}`)
    fetchAll()
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await categoryAPI.create(catForm)
      toast.success('Category added.')
      setModal(null)
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const renderFormFields = () => (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Item Name *</label>
          <input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Vada Pav" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Price (₹) *</label>
          <input className="input" type="number" required min={1} step="0.5" value={form.price} onChange={set('price')} placeholder="25" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Category *</label>
          <select className="input" required value={form.category} onChange={set('category')}>
            <option value="">Select…</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={set('description')} placeholder="Short description…" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Menu Item Image (Optional)</label>
          <input className="input !p-1.5" type="file" name="image" accept="image/*" onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Prep Time (min)</label>
          <input className="input" type="number" min={1} value={form.preparationTime} onChange={set('preparationTime')} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Tags (comma-separated)</label>
          <input className="input" value={form.tags} onChange={set('tags')} placeholder="bestseller, popular" />
        </div>
        <div className="col-span-2 flex gap-4">
          {[['isVegetarian','Vegetarian'],['isVegan','Vegan'],['isSpicy','Spicy']].map(([k,l]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[k]} onChange={set(k)} className="accent-brand-500" />
              <span className="text-sm text-gray-700">{l}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={() => setModal(null)} className="btn-outline flex-1">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : editingItem ? 'Update Item' : 'Add Item'}</button>
      </div>
    </form>
  )

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-2xl text-gray-900">Menu Management</h1>
          <p className="text-sm text-gray-400">{items.length} items total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('addCat')} className="btn-outline text-sm">+ Category</button>
          <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-1.5"><Plus size={16} /> Add Item</button>
        </div>
      </div>

      {/* Categories bar */}
      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map(c => (
          <span key={c._id} className="badge badge-orange">{c.name}</span>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Item','Category','Price','Status','Flags','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td></tr>
              )) : items.map(item => (
                <tr key={item._id} className={`hover:bg-gray-50/50 transition-colors ${!item.isAvailable ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {item.images?.[0] ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.category?.name}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">₹{item.price}</td>
                  <td className="px-4 py-3">
                    {item.isSoldOut
                      ? <span className="badge badge-red">Sold Out</span>
                      : item.isAvailable
                        ? <span className="badge badge-green">Available</span>
                        : <span className="badge badge-gray">Hidden</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {item.isVegetarian && <span title="Veg"><Leaf size={14} className="text-emerald-500" /></span>}
                      {item.isSpicy && <span title="Spicy"><Flame size={14} className="text-red-400" /></span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleToggleSoldOut(item)} title={item.isSoldOut ? 'Mark available' : 'Mark sold out'}
                        className="btn-ghost p-1.5 text-gray-400">
                        {item.isSoldOut ? <ToggleLeft size={18} /> : <ToggleRight size={18} className="text-emerald-500" />}
                      </button>
                      <button onClick={() => openEdit(item)} className="btn-ghost p-1.5 text-gray-400 hover:text-brand-500">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="btn-ghost p-1.5 text-gray-400 hover:text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'edit' ? 'Edit Item' : 'Add Menu Item'} onClose={() => setModal(null)}>
          {renderFormFields()}
        </Modal>
      )}

      {/* Add category modal */}
      {modal === 'addCat' && (
        <Modal title="Add Category" onClose={() => setModal(null)}>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Category Name *</label>
              <input className="input" required value={catForm.name}
                onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Beverages" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
              <input className="input" value={catForm.description}
                onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)} className="btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Adding…' : 'Add Category'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
