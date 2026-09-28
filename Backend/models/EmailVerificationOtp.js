const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailVerificationOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verificationExpiresAt: {
    type: Date,
    default: null
  },
  invalidated: {
    type: Boolean,
    default: false
  },
  consumedAt: {
    type: Date,
    default: null
  },
  lastSentAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 3600 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    default: null
  }
}, { timestamps: true });

emailVerificationOtpSchema.methods.compareOtp = function compareOtp(candidateOtp) {
  return bcrypt.compare(String(candidateOtp || ''), this.otpHash);
};

module.exports = mongoose.model('EmailVerificationOtp', emailVerificationOtpSchema);
