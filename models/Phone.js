const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
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
    required: true // รูปหลักสำหรับโชว์ในหน้าแรก (Main Thumbnail)
  },
  description: { 
    type: String 
  },
  // 🟢 สต็อกรวม (แนะนำให้ใช้เก็บผลรวมของสต็อกทุกสี เพื่อใช้เช็คเร็วๆ ในหน้าแรก)
  stock: { 
    type: Number, 
    default: 0 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Phone', 'Case', 'AirPods', 'Apple Watch'], 
    default: 'Phone' 
  },
  
  // 🟢 ส่วนที่ปรับปรุง: ระบบสีและสต็อกแยกตามสี
  variants: [
    {
      colorName: { 
        type: String, 
        required: true 
      }, // เช่น "Black", "Natural Titanium"
      colorCode: { 
        type: String 
      }, // เช่น "#000000", "#BEBEBE" (ใช้ทำปุ่มเลือกสี)
      variantImage: { 
        type: String, 
        required: true 
      }, // URL รูปภาพเฉพาะของสีนี้
      stock: { 
        type: Number, 
        default: 0 
      } // 🚩 เพิ่มสต็อกแยกตามสี
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Phone', phoneSchema);