const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const tableSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true, trim: true },
  capacity: { type: Number, default: 4 },
  status: { type: String, enum: ['free', 'occupied', 'reserved'], default: 'free' },
  qrToken: { type: String, unique: true, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

tableSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Table', tableSchema);
