const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  gstNumber: { type: String, trim: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
