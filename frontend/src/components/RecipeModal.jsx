import { useEffect, useState } from 'react'
import { AlertCircle, Plus, Trash2, Utensils, X } from 'lucide-react'
import { getInventoryItems } from '../api/inventoryApi.js'
import { deleteRecipe, getRecipe, upsertRecipe } from '../api/recipeApi.js'

function RecipeModal({ item, onClose }) {
  const [inventoryItems, setInventoryItems] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [hasRecipe, setHasRecipe] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.allSettled([getInventoryItems(), getRecipe(item._id)])
      .then(([inventoryResult, recipeResult]) => {
        if (!active) return
        if (inventoryResult.status === 'fulfilled') {
          setInventoryItems(inventoryResult.value.data.data || [])
        } else {
          setError(inventoryResult.reason.response?.data?.message || 'Unable to load inventory items')
        }

        if (recipeResult.status === 'fulfilled') {
          const recipe = recipeResult.value.data.data
          setHasRecipe(true)
          setIngredients(
            (recipe.ingredients || []).map((ingredient) => ({
              inventoryItemId: ingredient.inventoryItemId?._id || ingredient.inventoryItemId,
              quantityPerUnit: String(ingredient.quantityPerUnit)
            }))
          )
        } else if (recipeResult.reason.response?.status !== 404) {
          setError(recipeResult.reason.response?.data?.message || 'Unable to load recipe')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [item._id])

  const updateIngredient = (index, field, value) => {
    setIngredients((current) =>
      current.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient
      )
    )
  }

  const save = async () => {
    if (!ingredients.length) {
      setError('Add at least one ingredient before saving')
      return
    }
    setSaving(true)
    try {
      await upsertRecipe(
        item._id,
        ingredients.map((ingredient) => ({
          inventoryItemId: ingredient.inventoryItemId,
          quantityPerUnit: Number(ingredient.quantityPerUnit)
        }))
      )
      onClose()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save recipe')
    } finally {
      setSaving(false)
    }
  }

  const removeRecipe = async () => {
    if (!window.confirm(`Remove recipe for ${item.name}? Inventory will not be automatically deducted.`)) return
    setSaving(true)
    try {
      await deleteRecipe(item._id)
      onClose()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove recipe')
    } finally {
      setSaving(false)
    }
  }

  const addIngredient = () =>
    setIngredients((current) => [...current, { inventoryItemId: '', quantityPerUnit: '' }])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-[#EBE7DF] bg-white shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#F7F5F2] px-6 py-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7068]">
              Ingredient Recipe
            </span>
            <h2 className="text-lg font-bold text-[#2B2118]">{item.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-[#7A7068]">Loading recipe details...</p>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-[#C75C5C]">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <p className="text-xs text-[#7A7068]">
                Define ingredients used per serving. When ordered in POS, these quantities will automatically deduct from inventory stock.
              </p>

              {ingredients.length > 0 ? (
                <div className="space-y-3">
                  {ingredients.map((ingredient, index) => {
                    const selectedItem = inventoryItems.find(
                      (inv) => inv._id === ingredient.inventoryItemId
                    )
                    return (
                      <div
                        key={`${item._id}-${index}`}
                        className="flex items-center gap-2 rounded-xl border border-[#EBE7DF] bg-[#F7F5F2]/60 p-2.5"
                      >
                        <select
                          className="min-w-0 flex-1 rounded-lg border border-[#EBE7DF] bg-white px-3 py-2 text-xs font-medium text-[#2B2118] focus:border-[#6F4E37] focus:outline-none"
                          onChange={(e) => updateIngredient(index, 'inventoryItemId', e.target.value)}
                          value={ingredient.inventoryItemId}
                        >
                          <option value="">Choose Raw Ingredient...</option>
                          {inventoryItems.map((inv) => (
                            <option key={inv._id} value={inv._id}>
                              {inv.name} ({inv.unit})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1.5 w-28">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            placeholder="Qty"
                            value={ingredient.quantityPerUnit}
                            onChange={(e) => updateIngredient(index, 'quantityPerUnit', e.target.value)}
                            className="w-full rounded-lg border border-[#EBE7DF] bg-white px-2.5 py-2 text-xs text-[#2B2118] focus:border-[#6F4E37] focus:outline-none text-right font-medium"
                          />
                          <span className="w-8 shrink-0 text-xs font-semibold text-[#7A7068]">
                            {selectedItem?.unit || '—'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setIngredients((current) =>
                              current.filter((_, ingredientIndex) => ingredientIndex !== index)
                            )
                          }
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-[#C75C5C] transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#EBE7DF] p-6 text-center text-xs text-[#7A7068]">
                  No ingredients set yet. This item won't affect inventory stock when ordered.
                </div>
              )}

              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6F4E37] hover:text-[#2B2118] transition-colors"
              >
                <Plus size={16} />
                <span>Add Ingredient</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-[#F7F5F2] px-6 py-4">
          <div>
            {hasRecipe && (
              <button
                type="button"
                disabled={saving}
                onClick={removeRecipe}
                className="text-xs font-semibold text-[#C75C5C] hover:underline"
              >
                Delete Recipe
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#EBE7DF] px-4 py-2 text-xs font-semibold text-[#7A7068] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !ingredients.length}
              onClick={save}
              className="rounded-xl bg-[#6F4E37] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#2B2118] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Recipe'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default RecipeModal
