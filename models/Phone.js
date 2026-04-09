const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true // บังคับว่าต้องมีชื่อ
  },
  price: { 
    type: Number, 
    required: true 
  },
  brand: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String, 
    required: true // เก็บเป็น URL ของรูปภาพ
  },
  description: { 
    type: String 
  },
  stock: { 
    type: Number, default: 0 }
  
}, { timestamps: true }); // timestamps จะช่วยเก็บเวลาที่สร้างและอัปเดตข้อมูลให้โดยอัตโนมัติ

module.exports = mongoose.model('Phone', phoneSchema);