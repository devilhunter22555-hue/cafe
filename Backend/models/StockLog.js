const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const stockLogSchema = new mongoose.Schema({
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  changeType: { type: String, enum: ['purchase', 'wastage', 'manual_adjustment'], required: true },
  quantityChange: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  note: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

stockLogSchema.plugin(tenantPlugin);

module.exports = mongoose.model('StockLog', stockLogSchema);