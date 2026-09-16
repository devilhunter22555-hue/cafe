const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const MenuItem = require('../models/MenuItem');
const InventoryItem = require('../models/InventoryItem');

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function validateMenuItem(menuItemId, req) {
  if (!mongoose.isValidObjectId(menuItemId)) throw createError('Valid menuItemId is required', 400);
  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    restaurantId: req.restaurantId,
    branchId: req.branchId,
    isActive: true
  });
  if (!menuItem) throw createError('Menu item not found', 404);
  return menuItem;
}

async function normalizeIngredients(ingredients, req) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw createError('At least one ingredient is required', 400);
  }

  const normalized = ingredients.map((ingredient) => {
    if (!mongoose.isValidObjectId(ingredient.inventoryItemId)) {
      throw createError('Each ingredient must reference a valid inventory item', 400);
    }
    const quantityPerUnit = Number(ingredient.quantityPerUnit);
    if (!Number.isFinite(quantityPerUnit) || quantityPerUnit <= 0) {
      throw createError('quantityPerUnit must be greater than zero', 400);
    }
    return { inventoryItemId: ingredient.inventoryItemId, quantityPerUnit };
  });

  const inventoryItems = await InventoryItem.find({
    _id: { $in: normalized.map((ingredient) => ingredient.inventoryItemId) },
    restaurantId: req.restaurantId,
    branchId: req.branchId,
    isActive: true
  });
  if (inventoryItems.length !== new Set(normalized.map((ingredient) => String(ingredient.inventoryItemId))).size) {
    throw createError('One or more inventory items were not found', 404);
  }
  return normalized;
}

async function upsertRecipe(req, res, next) {
  try {
    await validateMenuItem(req.params.menuItemId, req);
    const ingredients = await normalizeIngredients(req.body.ingredients, req);
    const recipe = await Recipe.findOneAndUpdate(
      { menuItemId: req.params.menuItemId, restaurantId: req.restaurantId, branchId: req.branchId },
      { $set: { ingredients, restaurantId: req.restaurantId, branchId: req.branchId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: recipe, message: 'Recipe saved successfully' });
  } catch (error) {
    next(error);
  }
}

async function getRecipe(req, res, next) {
  try {
    await validateMenuItem(req.params.menuItemId, req);
    const recipe = await Recipe.findOne({
      menuItemId: req.params.menuItemId,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    }).populate('ingredients.inventoryItemId', 'name unit');
    if (!recipe) throw createError('Recipe not found', 404);
    res.json({ success: true, data: recipe, message: 'Recipe fetched successfully' });
  } catch (error) {
    next(error);
  }
}

async function deleteRecipe(req, res, next) {
  try {
    const recipe = await Recipe.findOneAndDelete({
      menuItemId: req.params.menuItemId,
      restaurantId: req.restaurantId,
      branchId: req.branchId
    });
    if (!recipe) throw createError('Recipe not found', 404);
    res.json({ success: true, data: recipe, message: 'Recipe deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { upsertRecipe, getRecipe, deleteRecipe };