const mongoose = require('mongoose');
require('dotenv').config();
const Phone = require('./models/Phone');

// 1. เตรียมข้อมูลจำลอง
const mockPhones = [
  {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    price: 48900,
    image: "https://placehold.co/400x500/f3f4f6/a1a1aa?text=iPhone+15+Pro+Max",
    description: "ชิป A17 Pro ดีไซน์ไทเทเนียม กล้องสุดล้ำ พร้อมระบบซูม 5 เท่า"
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    price: 46900,
    image: "https://placehold.co/400x500/f3f4f6/a1a1aa?text=S24+Ultra",
    description: "สมาร์ทโฟน AI อัจฉริยะ มาพร้อมปากกา S Pen และกล้อง 200MP"
  },
  {
    name: "Google Pixel 8 Pro",
    brand: "Google",
    price: 35900,
    image: "https://placehold.co/400x500/f3f4f6/a1a1aa?text=Pixel+8+Pro",
    description: "ที่สุดของกล้องมือถือและการประมวลผล AI จาก Google"
  },
  {
    name: "iPhone 15",
    brand: "Apple",
    price: 32900,
    image: "https://placehold.co/400x500/f3f4f6/a1a1aa?text=iPhone+15",
    description: "ดีไซน์ใหม่ ไดนามิกไอส์แลนด์ และกล้องหลัก 48MP"
  },
  {
    name: "Xiaomi 14 Ultra",
    brand: "Xiaomi",
    price: 34990,
    image: "https://placehold.co/400x500/f3f4f6/a1a1aa?text=Xiaomi+14+Ultra",
    description: "เลนส์ Leica ระดับโปร ถ่ายภาพสวยทุกมิติ"
  }
];

// 2. ฟังก์ชันสำหรับล้างข้อมูลเก่าและเพิ่มข้อมูลใหม่
const seedDatabase = async () => {
  try {
    // เชื่อมต่อ MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

    // ล้างข้อมูลเก่าทั้งหมดใน Collection (เพื่อไม่ให้ข้อมูลซ้ำเวลาเรารันหลายรอบ)
    await Phone.deleteMany();
    console.log('🗑️ เคลียร์ข้อมูลเก่าเรียบร้อยแล้ว');

    // เพิ่มข้อมูลใหม่เข้าไป
    await Phone.insertMany(mockPhones);
    console.log('🌱 สร้างข้อมูล Seeding เรียบร้อยแล้ว!');

    // ปิดการเชื่อมต่อ
    mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการ Seeding:', error);
    process.exit(1);
  }
};

// รันฟังก์ชัน
seedDatabase();