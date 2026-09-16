const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const billItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  categoryName: String
}, { _id: false });

const billSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  billNumber: { type: String, required: true },
  items: { type: [billItemSchema], required: true },
  subtotal: { type: Number, required: true },
  cgst: { type: Number, required: true },
  sgst: { type: Number, required: true },
  discount: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMode: { type: String, enum: ['cash', 'card', 'upi'], required: true },
  customerPhone: String,
  billedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

billSchema.plugin(tenantPlugin);
billSchema.index({ restaurantId: 1, branchId: 1, billNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);