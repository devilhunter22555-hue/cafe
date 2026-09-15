const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  name: { type: String, required: true },
  dateKey: { type: String, default: null },
  value: { type: Number, default: 0 }
});

counterSchema.index(
  { restaurantId: 1, branchId: 1, name: 1, dateKey: 1 },
  { unique: true }
);

module.exports = mongoose.model('Counter', counterSchema);