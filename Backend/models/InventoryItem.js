const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  unit: { type: String, enum: ['kg', 'g', 'l', 'ml', 'pcs'], required: true },
  currentStock: { type: Number, default: 0, required: true },
  lowStockThreshold: { type: Number, default: 5, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

inventoryItemSchema.plugin(tenantPlugin);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);