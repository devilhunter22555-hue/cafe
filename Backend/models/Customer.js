const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  phone: { type: String, required: true, trim: true },
  name: { type: String, trim: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true }
}, { timestamps: true });

customerSchema.index({ phone: 1, restaurantId: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
