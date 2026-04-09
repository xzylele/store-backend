const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date }
});

module.exports = mongoose.model('Coupon', couponSchema);