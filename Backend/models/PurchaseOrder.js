const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const purchaseOrderItemSchema = new mongoose.Schema({
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true
  },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  poNumber: { type: String, required: true, unique: true, trim: true },
  items: { type: [purchaseOrderItemSchema], default: [] },
  totalAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'received', 'cancelled'],
    default: 'pending'
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedAt: Date,
  notes: String
}, { timestamps: true });

purchaseOrderSchema.plugin(tenantPlugin);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
