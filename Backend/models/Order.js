const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  selectedModifiers: [{
    name: { type: String, required: true },
    priceDelta: { type: Number, default: 0 }
  }],
  notes: String,
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'], default: 'pending' },
  kotNumber: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderType: { type: String, enum: ['dine-in', 'takeaway'], required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  items: { type: [orderItemSchema], required: true },
  status: { type: String, enum: ['open', 'billed', 'cancelled'], default: 'open' },
  subtotal: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  source: { type: String, enum: ['staff', 'customer'], default: 'staff' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerPhone: String
}, { timestamps: true });

orderSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Order', orderSchema);
