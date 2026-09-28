const mongoose = require('mongoose');

const superAdminAuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'EMAIL_OTP_SENT',
      'EMAIL_VERIFIED',
      'CAFE_CREATED',
      'CAFE_UPDATED',
      'CAFE_ACTIVATED',
      'CAFE_DEACTIVATED',
      'CAFE_PLAN_UPDATED',
      'CAFE_DELETED',
      'ADMIN_CREATED',
      'ADMIN_UPDATED',
      'ADMIN_ACTIVATED',
      'ADMIN_DEACTIVATED',
      'ADMIN_PASSWORD_RESET'
    ],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    default: null
  },
  performedByEmail: {
    type: String,
    trim: true,
    default: 'Super Admin'
  },
  cafeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null,
    index: true
  },
  cafeName: {
    type: String,
    trim: true,
    default: ''
  },
  details: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('SuperAdminAuditLog', superAdminAuditLogSchema);
