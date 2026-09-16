import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
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
        if (inventoryResult.status === 'fulfilled') setInventoryItems(inventoryResult.value.data.data)
        else setError(inventoryResult.reason.response?.data?.message || 'Unable to load inventory items')

        if (recipeResult.status === 'fulfilled') {
          const recipe = recipeResult.value.data.data
          setHasRecipe(true)
          setIngredients(recipe.ingredients.map((ingredient) => ({
            inventoryItemId: ingredient.inventoryItemId?._id || ingredient.inventoryItemId,
            quantityPerUnit: String(ingredient.quantityPerUnit)
          })))
        } else if (recipeResult.reason.response?.status !== 404) {
          setError(recipeResult.reason.response?.data?.message || 'Unable to load recipe')
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [item._id])

  const updateIngredient = (index, field, value) => {
    setIngredients((current) => current.map((ingredient, ingredientIndex) => (
      ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient
    )))
  }

  const save = async () => {
    if (!ingredients.length) {
      setError('Add at least one ingredient before saving')
      return
    }
    setSaving(true)
    try {
      await upsertRecipe(item._id, ingredients.map((ingredient) => ({
        inventoryItemId: ingredient.inventoryItemId,
        quantityPerUnit: Number(ingredient.quantityPerUnit)
      })))
      onClose()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save recipe')
    } finally {
      setSaving(false)
    }
  }

  const removeRecipe = async () => {
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

  const addIngredient = () => setIngredients((current) => [...current, { inventoryItemId: '', quantityPerUnit: '' }])

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section className="card max-h-[90vh] w-full max-w-lg overflow-y-auto"><header className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-secondary">Recipe for {item.name}</h2><button aria-label="Close" className="text-gray-400 hover:text-secondary" onClick={onClose} type="button"><X size={20} /></button></header>
    {loading ? <p className="py-8 text-center text-sm text-gray-400">Loading recipe...</p> : <>
      {error && <p className="mb-4 rounded-lg border border-danger bg-red-50 p-3 text-sm text-danger">{error}</p>}
      {ingredients.length ? <div className="space-y-3">{ingredients.map((ingredient, index) => {
        const selectedItem = inventoryItems.find((inventoryItem) => inventoryItem._id === ingredient.inventoryItemId)
        return <div className="flex items-center gap-2" key={`${item._id}-${index}`}><select className="input-field min-w-0 flex-1" onChange={(event) => updateIngredient(index, 'inventoryItemId', event.target.value)} value={ingredient.inventoryItemId}><option value="">Select inventory item</option>{inventoryItems.map((inventoryItem) => <option key={inventoryItem._id} value={inventoryItem._id}>{inventoryItem.name}</option>)}</select><input className="input-field w-24" min="0" onChange={(event) => updateIngredient(index, 'quantityPerUnit', event.target.value)} required step="any" type="number" value={ingredient.quantityPerUnit} /><span className="w-8 text-sm text-gray-500">{selectedItem?.unit || '-'}</span><button aria-label="Remove ingredient" className="text-gray-400 hover:text-danger" onClick={() => setIngredients((current) => current.filter((_, ingredientIndex) => ingredientIndex !== index))} type="button"><X size={18} /></button></div>
      })}</div> : <p className="text-sm text-gray-400">No recipe set — this item won't affect inventory when ordered</p>}
      <button className="mt-4 text-sm font-medium text-primary" onClick={addIngredient} type="button">+ Add Ingredient</button>
      <div className="mt-6 flex items-center justify-between"><div>{hasRecipe && <button className="text-sm text-danger" disabled={saving} onClick={removeRecipe} type="button">Remove Recipe</button>}</div><div className="flex gap-3"><button className="btn-secondary" onClick={onClose} type="button">Cancel</button><button className="btn-primary" disabled={saving || !ingredients.length} onClick={save} type="button">{saving ? 'Saving...' : 'Save Recipe'}</button></div></div>
    </>}
  </section></div>
}

export default RecipeModal
