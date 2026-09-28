const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['owner', 'manager', 'cashier', 'kitchen', 'waiter'],
    required: true,
    set: (val) => {
      if (typeof val === 'string' && val.trim().toUpperCase() === 'ADMIN') {
        return 'owner';
      }
      return val;
    }
  },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  emailVerifiedAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  monthlySalary: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('cafeId').get(function getCafeId() {
  return this.restaurantId;
});

userSchema.virtual('roleLabel').get(function getRoleLabel() {
  if (this.role === 'owner') return 'ADMIN';
  return String(this.role || '').toUpperCase();
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
