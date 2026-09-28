const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: { type: String, trim: true, default: '' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ownerName: { type: String, trim: true, default: '' },
  email: { type: String, lowercase: true, trim: true, default: '' },
  emailVerified: { type: Boolean, default: false },
  emailVerifiedAt: { type: Date, default: null },
  phone: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  plan: { type: String, enum: ['trial', 'basic', 'pro'], default: 'trial' },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  settings: {
    currency: { type: String, default: 'INR', trim: true },
    currencySymbol: { type: String, default: '₹', trim: true },
    taxPercent: { type: Number, default: 5, min: 0, max: 100 },
    gstNumber: { type: String, trim: true, default: '' },
    openingTime: { type: String, default: '09:00', trim: true },
    closingTime: { type: String, default: '23:00', trim: true },
    timezone: { type: String, default: 'Asia/Kolkata', trim: true },
    orderSettings: {
      allowDineIn: { type: Boolean, default: true },
      allowTakeaway: { type: Boolean, default: true },
      allowQrOrdering: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

restaurantSchema.virtual('cafeId').get(function getCafeId() {
  return this._id;
});

restaurantSchema.pre('save', function syncCafeStatus(next) {
  if (this.isModified('isActive') && !this.isModified('status')) {
    this.status = this.isActive ? 'ACTIVE' : 'INACTIVE';
  } else if (this.isModified('status') && !this.isModified('isActive')) {
    this.isActive = this.status === 'ACTIVE';
  }
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
