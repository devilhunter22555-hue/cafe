const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const modifierGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  options: [{
    name: { type: String, required: true, trim: true },
    priceDelta: { type: Number, default: 0 }
  }],
  isRequired: { type: Boolean, default: false },
  maxSelect: { type: Number, default: 1 }
}, { timestamps: true });

modifierGroupSchema.plugin(tenantPlugin);

module.exports = mongoose.model('ModifierGroup', modifierGroupSchema);
