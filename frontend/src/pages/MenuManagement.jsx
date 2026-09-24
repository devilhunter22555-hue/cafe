import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FolderPlus,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X
} from 'lucide-react'
import {
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  getCategories,
  getMenuItems,
  toggleAvailability,
  updateCategory,
  updateMenuItem
} from '../api/menuApi.js'
import RecipeModal from '../components/RecipeModal.jsx'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function money(amount) {
  return currency.format(Number(amount) || 0)
}

const emptyItem = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  isVeg: true,
  taxSlab: 5
}

function responseData(response) {
  return response.data.data || []
}

function MenuManagement() {
  const [tab, setTab] = useState('items') // default to items for immediate convenience
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [categoryForm, setCategoryForm] = useState({ name: '', sortOrder: 0 })
  const [editingCategory, setEditingCategory] = useState(null)
  const [itemForm, setItemForm] = useState(emptyItem)
  const [editingItem, setEditingItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recipeItem, setRecipeItem] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
      const data = { name: categoryForm.name.trim(), sortOrder: Number(categoryForm.sortOrder) }
      if (editingCategory) {
        await updateCategory(editingCategory, data)
        setSuccessMessage('Category updated')
      } else {
        await createCategory(data)
        setSuccessMessage('Category created')
      }
      setCategoryForm({ name: '', sortOrder: 0 })
      setEditingCategory(null)
      setError('')
      window.setTimeout(() => setSuccessMessage(''), 2500)
      await loadCategories()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save category')
    }
  }

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Items under this category may become uncategorized.`)) return
    try {
      await deleteCategory(id)
      await loadCategories()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete category')
    }
  }

  const openItemModal = (item = null) => {
    setEditingItem(item?._id || null)
    setItemForm(
      item
        ? {
            name: item.name,
            description: item.description || '',
            price: item.price,
            categoryId: item.categoryId?._id || item.categoryId,
            isVeg: item.isVeg,
            taxSlab: item.taxSlab || 5
          }
        : { ...emptyItem, categoryId: categories[0]?._id || '' }
    )
    setIsModalOpen(true)
  }

  const handleItemSubmit = async (event) => {
    event.preventDefault()
    try {
      const data = { ...itemForm, price: Number(itemForm.price), taxSlab: Number(itemForm.taxSlab) }
      if (editingItem) {
        await updateMenuItem(editingItem, data)
        setSuccessMessage('Menu dish updated')
      } else {
        await createMenuItem(data)
        setSuccessMessage('Menu dish added')
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setError('')
      window.setTimeout(() => setSuccessMessage(''), 2500)
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

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the menu?`)) return
    try {
      await deleteMenuItem(id)
      await loadItems()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete menu item')
    }
  }

  const categoryName = (item) =>
    item.categoryId?.name || categories.find((c) => c._id === item.categoryId)?.name || 'Uncategorized'

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
    )
  }, [items, search])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">Menu Management</h1>
          <p className="mt-1 text-sm text-[#7A7068]">
            Manage café menu catalog, categories, pricing, recipes, and item availability
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tab === 'items' && (
            <button
              type="button"
              onClick={() => openItemModal()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6F4E37] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2B2118] transition-all active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>Add Dish / Item</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-[#4F8A5A]">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs Pill Navigation */}
      <div className="flex rounded-xl bg-white p-1 border border-[#EBE7DF] w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setTab('items')}
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
            tab === 'items'
              ? 'bg-[#6F4E37] text-white shadow-xs'
              : 'text-[#7A7068] hover:text-[#2B2118]'
          }`}
        >
          <UtensilsCrossed size={16} />
          <span>Menu Items ({items.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('categories')}
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
            tab === 'categories'
              ? 'bg-[#6F4E37] text-white shadow-xs'
              : 'text-[#7A7068] hover:text-[#2B2118]'
          }`}
        >
          <Layers size={16} />
          <span>Categories ({categories.length})</span>
        </button>
      </div>

      {/* Categories View */}
      {tab === 'categories' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* Add / Edit Category Form */}
          <div className="rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs">
            <h2 className="text-base font-bold text-[#2B2118] mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hot Coffees, Pastries, Breakfast"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Sort Priority (Lower numbers appear first)
                </label>
                <input
                  type="number"
                  min="0"
                  value={categoryForm.sortOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#6F4E37] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#2B2118] transition-all"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null)
                      setCategoryForm({ name: '', sortOrder: 0 })
                    }}
                    className="rounded-xl border border-[#EBE7DF] px-4 py-2.5 text-sm font-semibold text-[#7A7068] hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#2B2118] mb-3">Existing Categories</h2>
            {categories.map((category) => {
              const itemCount = items.filter((i) => (i.categoryId?._id || i.categoryId) === category._id).length

              return (
                <div
                  key={category._id}
                  className="flex items-center justify-between rounded-2xl border border-[#EBE7DF] bg-white p-4 shadow-xs transition-all hover:border-[#6F4E37]/30"
                >
                  <div>
                    <h3 className="font-bold text-[#2B2118]">{category.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#7A7068]">
                      <span>Sort Order: <strong>{category.sortOrder}</strong></span>
                      <span>•</span>
                      <span>{itemCount} dishes assigned</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(category._id)
                        setCategoryForm({ name: category.name, sortOrder: category.sortOrder })
                      }}
                      className="rounded-lg p-2 text-gray-400 hover:bg-[#F7F5F2] hover:text-[#2B2118] transition-colors"
                      title="Edit Category"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category._id, category.name)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-[#C75C5C] transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Menu Items View */
        <div className="space-y-4">
          {/* Controls: Category Filter + Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EBE7DF] bg-white p-3.5 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2 text-sm font-medium text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
              >
                <option value="">All Categories ({items.length})</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter dishes by name..."
                  className="w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] py-2 pl-9 pr-3 text-sm text-[#2B2118] placeholder:text-[#7A7068]/60 focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                />
              </div>
            </div>

            <span className="text-xs font-semibold text-[#7A7068]">
              Showing {filteredItems.length} of {items.length} items
            </span>
          </div>

          {/* Dishes Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#EBE7DF] bg-white p-5 shadow-xs transition-all hover:border-[#6F4E37]/40 hover:shadow-md"
                >
                  <div>
                    {/* Top Row: Category Pill & Veg Indicator */}
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-[#F7F5F2] px-2.5 py-0.5 text-[11px] font-semibold text-[#7A7068] border border-[#EBE7DF]">
                        {categoryName(item)}
                      </span>

                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                          item.isVeg ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
                        }`}
                        title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                      </span>
                    </div>

                    {/* Dish Name & Description */}
                    <h3 className="text-base font-bold text-[#2B2118] group-hover:text-[#6F4E37] transition-colors">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-[#7A7068]">
                        {item.description}
                      </p>
                    )}

                    {/* Price & Tax */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-[#6F4E37]">
                        {money(item.price)}
                      </span>
                      {item.taxSlab ? (
                        <span className="text-[11px] font-medium text-[#7A7068]">
                          +{item.taxSlab}% GST
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions & Availability Toggle */}
                  <div className="mt-4 flex items-center justify-between border-t border-[#F7F5F2] pt-3">
                    {/* Availability Toggle */}
                    <button
                      type="button"
                      onClick={() => handleAvailability(item)}
                      className="flex items-center gap-2 text-xs font-semibold text-[#7A7068] cursor-pointer"
                    >
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          item.isAvailable ? 'bg-[#4F8A5A]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            item.isAvailable ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </span>
                      <span className={item.isAvailable ? 'text-[#4F8A5A]' : 'text-gray-400'}>
                        {item.isAvailable ? 'Available' : 'Disabled'}
                      </span>
                    </button>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRecipeItem(item)}
                        title="Manage Ingredients Recipe"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-[#F7F5F2] hover:text-[#6F4E37] transition-colors"
                      >
                        <ClipboardList size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openItemModal(item)}
                        title="Edit Dish"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-[#F7F5F2] hover:text-[#2B2118] transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item._id, item.name)}
                        title="Delete Dish"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-[#C75C5C] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[35vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-8 text-center">
              <UtensilsCrossed className="text-gray-300 mb-3" size={40} />
              <h3 className="font-bold text-[#2B2118]">No dishes found</h3>
              <p className="mt-1 text-sm text-[#7A7068]">
                {search ? `No items matching "${search}"` : 'No items created in this category yet'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleItemSubmit}
            className="w-full max-w-lg rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="mb-5 flex items-center justify-between border-b border-[#F7F5F2] pb-3">
              <h2 className="text-lg font-bold text-[#2B2118]">
                {editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Dish Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanilla Iced Latte, Croissant"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, ingredients, or tasting notes..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                    Category
                  </label>
                  <select
                    required
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068] mb-1.5">
                    Dietary Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, isVeg: true })}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                        itemForm.isVeg
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-2xs'
                          : 'border-[#EBE7DF] bg-white text-[#7A7068]'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Vegetarian
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, isVeg: false })}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                        !itemForm.isVeg
                          ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-2xs'
                          : 'border-[#EBE7DF] bg-white text-[#7A7068]'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-rose-600" />
                      Non-Veg
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
                    GST Tax Slab
                  </label>
                  <select
                    value={itemForm.taxSlab}
                    onChange={(e) => setItemForm({ ...itemForm, taxSlab: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2.5 text-sm text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/20"
                  >
                    <option value="5">5% (Restaurant Standard)</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#F7F5F2] pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-[#EBE7DF] px-4 py-2 text-sm font-semibold text-[#7A7068] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#6F4E37] px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#2B2118]"
              >
                Save Dish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recipe Modal Component */}
      {recipeItem && (
        <RecipeModal item={recipeItem} onClose={() => setRecipeItem(null)} />
      )}
    </div>
  )
}

export default MenuManagement