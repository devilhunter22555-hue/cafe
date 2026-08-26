import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  getCategories,
  getMenuItems,
  toggleAvailability,
  updateCategory,
  updateMenuItem,
} from '../api/menuApi.js'

const emptyItem = { name: '', description: '', price: '', categoryId: '', isVeg: true, taxSlab: 5 }

function responseData(response) {
  return response.data.data
}

function MenuManagement() {
  const [tab, setTab] = useState('categories')
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categoryForm, setCategoryForm] = useState({ name: '', sortOrder: 0 })
  const [editingCategory, setEditingCategory] = useState(null)
  const [itemForm, setItemForm] = useState(emptyItem)
  const [editingItem, setEditingItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')

  const loadCategories = async () => {
    try {
      setCategories(responseData(await getCategories()))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load categories')
    }
  }

  const loadItems = async (categoryId = categoryFilter) => {
    try {
      setItems(responseData(await getMenuItems(categoryId)))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load menu items')
    }
  }

  useEffect(() => {
    getCategories()
      .then((response) => setCategories(responseData(response)))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load categories'))
  }, [])

  useEffect(() => {
    getMenuItems(categoryFilter)
      .then((response) => setItems(responseData(response)))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load menu items'))
  }, [categoryFilter])

  const handleCategorySubmit = async (event) => {
    event.preventDefault()
    try {
      const data = { name: categoryForm.name, sortOrder: Number(categoryForm.sortOrder) }
      if (editingCategory) await updateCategory(editingCategory, data)
      else await createCategory(data)
      setCategoryForm({ name: '', sortOrder: 0 })
      setEditingCategory(null)
      setError('')
      await loadCategories()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save category')
    }
  }

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete category')
    }
  }

  const openItemModal = (item = null) => {
    setEditingItem(item?._id || null)
    setItemForm(item ? {
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId?._id || item.categoryId,
      isVeg: item.isVeg,
      taxSlab: item.taxSlab,
    } : { ...emptyItem, categoryId: categories[0]?._id || '' })
    setIsModalOpen(true)
  }

  const handleItemSubmit = async (event) => {
    event.preventDefault()
    try {
      const data = { ...itemForm, price: Number(itemForm.price), taxSlab: Number(itemForm.taxSlab) }
      if (editingItem) await updateMenuItem(editingItem, data)
      else await createMenuItem(data)
      setIsModalOpen(false)
      setEditingItem(null)
      setError('')
      await loadItems()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save menu item')
    }
  }

  const handleAvailability = async (item) => {
    try {
      await toggleAvailability(item._id, !item.isAvailable)
      await loadItems()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update availability')
    }
  }

  const handleDeleteItem = async (id) => {
    try {
      await deleteMenuItem(id)
      await loadItems()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete menu item')
    }
  }

  const categoryName = (item) => item.categoryId?.name || categories.find((category) => category._id === item.categoryId)?.name || 'Uncategorized'

  return <main className="mx-auto max-w-6xl p-6">
    <h1 className="mb-6 text-2xl font-bold text-secondary">Menu Management</h1>
    {error && <p className="mb-4 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}
    <div className="mb-6 flex flex-row border-b border-gray-200">
      <button className={`px-4 pb-2 ${tab === 'categories' ? 'border-b-2 border-primary font-medium text-primary' : 'text-gray-500 hover:text-secondary'}`} onClick={() => setTab('categories')} type="button">Categories</button>
      <button className={`px-4 pb-2 ${tab === 'items' ? 'border-b-2 border-primary font-medium text-primary' : 'text-gray-500 hover:text-secondary'}`} onClick={() => setTab('items')} type="button">Menu Items</button>
    </div>

    {tab === 'categories' ? <section>
      <form className="card mb-6 flex gap-3" onSubmit={handleCategorySubmit}>
        <input className="input-field flex-1" placeholder="Category name" required value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
        <input className="input-field w-24" min="0" type="number" value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: event.target.value })} />
        <button className="btn-primary" type="submit">{editingCategory ? 'Update' : 'Add'}</button>
        {editingCategory && <button className="btn-secondary" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', sortOrder: 0 }) }} type="button">Cancel</button>}
      </form>
      {categories.map((category) => <div className="card mb-2 flex items-center justify-between p-4" key={category._id}>
        <div><span className="font-medium text-secondary">{category.name}</span><span className="ml-3 text-xs text-gray-400">Sort: {category.sortOrder}</span></div>
        <div className="flex gap-3"><button aria-label={`Edit ${category.name}`} className="text-gray-400 hover:text-primary" onClick={() => { setEditingCategory(category._id); setCategoryForm({ name: category.name, sortOrder: category.sortOrder }) }} type="button"><Pencil size={18} /></button><button aria-label={`Delete ${category.name}`} className="text-gray-400 hover:text-danger" onClick={() => handleDeleteCategory(category._id)} type="button"><Trash2 size={18} /></button></div>
      </div>)}
    </section> : <section>
      <div className="mb-6 flex items-center justify-between gap-3"><select className="input-field w-64" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select><button className="btn-primary flex items-center gap-2" onClick={() => openItemModal()} type="button"><Plus size={18} /> Add Item</button></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article className="card" key={item._id}>
        <div className="flex items-center gap-2"><h2 className="font-semibold text-secondary">{item.name}</h2><span aria-label={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'} className={`h-3 w-3 rounded-full ${item.isVeg ? 'bg-success' : 'bg-danger'}`} /></div>
        <p className="mt-1 text-lg font-bold text-primary">{Number(item.price).toFixed(2)}</p><p className="mt-1 text-xs text-gray-400">{categoryName(item)}</p>
        <div className="mt-3 flex items-center justify-between"><button aria-pressed={item.isAvailable} className="flex items-center gap-2 text-sm text-secondary" onClick={() => handleAvailability(item)} type="button"><span className={`relative h-6 w-10 rounded-full ${item.isAvailable ? 'bg-success' : 'bg-gray-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${item.isAvailable ? 'left-5' : 'left-1'}`} /></span>{item.isAvailable ? 'Available' : 'Unavailable'}</button><div className="flex gap-3"><button aria-label={`Edit ${item.name}`} className="text-gray-400 hover:text-primary" onClick={() => openItemModal(item)} type="button"><Pencil size={18} /></button><button aria-label={`Delete ${item.name}`} className="text-gray-400 hover:text-danger" onClick={() => handleDeleteItem(item._id)} type="button"><Trash2 size={18} /></button></div></div>
      </article>)}</div>
    </section>}

    {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form className="card w-full max-w-md" onSubmit={handleItemSubmit}><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-secondary">{editingItem ? 'Edit Item' : 'Add Item'}</h2><button aria-label="Close" className="text-gray-400 hover:text-secondary" onClick={() => setIsModalOpen(false)} type="button"><X size={20} /></button></div><div className="space-y-4"><input className="input-field" placeholder="Name" required value={itemForm.name} onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })} /><textarea className="input-field" placeholder="Description" rows="3" value={itemForm.description} onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })} /><input className="input-field" min="0" placeholder="Price" required step="0.01" type="number" value={itemForm.price} onChange={(event) => setItemForm({ ...itemForm, price: event.target.value })} /><select className="input-field" required value={itemForm.categoryId} onChange={(event) => setItemForm({ ...itemForm, categoryId: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select><div className="flex gap-2"><button className={`flex-1 rounded-lg border px-3 py-2 ${itemForm.isVeg ? 'border-success bg-success/10 text-success' : 'border-gray-300 text-gray-500'}`} onClick={() => setItemForm({ ...itemForm, isVeg: true })} type="button">Veg</button><button className={`flex-1 rounded-lg border px-3 py-2 ${!itemForm.isVeg ? 'border-danger bg-danger/10 text-danger' : 'border-gray-300 text-gray-500'}`} onClick={() => setItemForm({ ...itemForm, isVeg: false })} type="button">Non-Veg</button></div><select className="input-field" value={itemForm.taxSlab} onChange={(event) => setItemForm({ ...itemForm, taxSlab: event.target.value })}><option value="5">5%</option><option value="18">18%</option></select></div><div className="mt-6 flex justify-end gap-3"><button className="btn-secondary" onClick={() => setIsModalOpen(false)} type="button">Cancel</button><button className="btn-primary" type="submit">Save</button></div></form></div>}
  </main>
}

export default MenuManagement