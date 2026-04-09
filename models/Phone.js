const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  brand: { type: String, required: true },
  image: { type: String, required: true }, // รูปหลัก (สำหรับแสดงหน้าแรก)
  description: { type: String },
  stock: { type: Number, default: 0 },
  category: { 
    type: String, 
    required: true,
    enum: ['Phone', 'Case', 'AirPods', 'Apple Watch'], 
    default: 'Phone' 
  },
  
  // 🟢 ส่วนที่เพิ่มใหม่: ระบบเลือกสีและรูปภาพตามสี
  variants: [
    {
      colorName: { type: String, required: true }, // เช่น "Natural Titanium"
      colorCode: { type: String },                 // เช่น "#BEBEBE" (สำหรับทำปุ่มวงกลมสี)
      variantImage: { type: String, required: true } // URL รูปภาพของสีนี้
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Phone', phoneSchema);