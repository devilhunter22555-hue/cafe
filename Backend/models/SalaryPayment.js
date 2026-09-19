const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const salaryPaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-(0[1-9]|1[0-2])$/
  },
  amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paidAt: { type: Date },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi']
  },
  note: { type: String, trim: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

salaryPaymentSchema.plugin(tenantPlugin);
salaryPaymentSchema.index({ restaurantId: 1, userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('SalaryPayment', salaryPaymentSchema);
