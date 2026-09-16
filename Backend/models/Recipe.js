const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const ingredientSchema = new mongoose.Schema({
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  quantityPerUnit: { type: Number, required: true, min: 0 }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, unique: true },
  ingredients: { type: [ingredientSchema], required: true }
}, { timestamps: true });

recipeSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Recipe', recipeSchema);