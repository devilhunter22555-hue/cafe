const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const menuItemSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true },
  isVeg: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  taxSlab: { type: Number, enum: [5, 18], required: true },
  modifierGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ModifierGroup' }],
  imageUrl: { type: String, trim: true }
}, { timestamps: true });

menuItemSchema.plugin(tenantPlugin);

module.exports = mongoose.model('MenuItem', menuItemSchema);
