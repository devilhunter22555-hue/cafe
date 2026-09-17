const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

supplierSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Supplier', supplierSchema);
