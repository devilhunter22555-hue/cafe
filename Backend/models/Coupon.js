const mongoose = require('mongoose');
const tenantPlugin = require('../utils/tenantPlugin');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  discountType: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

couponSchema.plugin(tenantPlugin);
couponSchema.index({ restaurantId: 1, branchId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', couponSchema);
