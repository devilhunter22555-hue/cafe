const mongoose = require('mongoose');

const otpSessionSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }
}, { timestamps: true });

module.exports = mongoose.model('OtpSession', otpSessionSchema);
