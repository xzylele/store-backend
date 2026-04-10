const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true 
  }, 
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  }],
  totalAmount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Shipping', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },

  // 🟢 ส่วนที่เพิ่มใหม่: ข้อมูลที่อยู่จัดส่งแบบละเอียด
  shippingAddress: {
    fullName: { type: String }, // ชื่อ-นามสกุล ผู้รับ
    phone: { type: String },    // เบอร์โทรศัพท์
    addressLine: { type: String }, // บ้านเลขที่, ถนน, ซอย
    province: { type: String },    // จังหวัด
    district: { type: String },    // เขต/อำเภอ
    zipCode: { type: String }      // รหัสไปรษณีย์
  },

  // 🟢 ส่วนที่เพิ่มใหม่: หลักฐานการโอนเงิน
  paymentProof: { 
    type: String // เก็บเป็น URL รูปภาพสลิปที่อัปโหลด (เช่น Cloudinary หรือ Link ตรง)
  },

  // 🟢 ส่วนที่เพิ่มใหม่: เลขพัสดุ (สำหรับใส่ตอนเปลี่ยนสถานะเป็น Shipping)
  trackingNumber: { 
    type: String, 
    default: "" 
  }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);