const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  username: { type: String, required: true }, // 🟢 เพิ่มเพื่อระบุเจ้าของออเดอร์
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Shipping', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);