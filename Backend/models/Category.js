const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.plugin(tenantPlugin);

module.exports = mongoose.model('Category', categorySchema);
