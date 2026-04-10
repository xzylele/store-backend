const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Phone = require('./models/Phone');
const User = require('./models/User');
const Order = require('./models/Order');

// 🎫 Coupon Model
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date },
  usageLimit: { type: Number, default: null }, // null = ไม่จำกัด
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

const app = express();

// 🟢 ปรับปรุง CORS สำหรับ Render.com
app.use(cors({
  origin: ["http://localhost:3000", /\.onrender\.com$/], 
  credentials: true
}));

// 🟢 ขยายขนาดการรับข้อมูลเพื่อให้รับรูปสลิป Base64 ได้
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ เชื่อมต่อ MongoDB Atlas สำเร็จ!'))
  .catch((err) => console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ DB:', err));

// ------------------------------------
// 📊 SALES DASHBOARD API
// ------------------------------------

app.get('/api/sales-summary', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }); 
    const totalSales = orders
      .filter(order => order.status !== 'Cancelled')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    res.json({ totalSales, totalOrders: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: "ดึงข้อมูลยอดขายไม่สำเร็จ", error });
  }
});

// ------------------------------------
// 🎫 COUPON API
// ------------------------------------

app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "ดึงข้อมูลคูปองไม่สำเร็จ" });
  }
});

app.post('/api/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "กรุณาระบุโค้ดส่วนลด" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ message: "ไม่พบโค้ดส่วนลดนี้" });

    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return res.status(400).json({ message: "โค้ดส่วนลดนี้หมดอายุแล้ว" });
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "โค้ดส่วนลดนี้ถูกใช้งานครบจำนวนแล้ว" });
    }

    res.json({
      message: "ใช้โค้ดส่วนลดสำเร็จ!",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบโค้ด" });
  }
});

app.post('/api/coupons', async (req, res) => {
    try {
        const newCoupon = new Coupon(req.body);
        await newCoupon.save();
        res.status(201).json({ message: "สร้างคูปองสำเร็จ", newCoupon });
    } catch (error) {
        res.status(400).json({ message: "สร้างคูปองไม่สำเร็จ", error });
    }
});

app.delete('/api/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "ลบคูปองเรียบร้อยแล้ว" });
  } catch (error) {
    res.status(500).json({ message: "ลบไม่สำเร็จ", error });
  }
});

// ------------------------------------
// 🛒 CHECKOUT API - ตัดสต็อกแยกสี + บันทึกที่อยู่สลิป
// ------------------------------------

app.post('/api/checkout', async (req, res) => {
  const { items, username, totalAmount, couponCode, shippingAddress, paymentProof } = req.body; 

  try {
    // 1. ตรวจสอบสต็อก (เช็คสต็อกแยกสี)
    for (const item of items) {
      const phone = await Phone.findById(item.id);
      if (!phone) return res.status(404).json({ message: `ไม่พบสินค้า: ${item.name}` });

      const colorMatch = item.name.match(/\(([^)]+)\)/);
      const selectedColor = colorMatch ? colorMatch[1] : null;

      if (selectedColor) {
        const variant = phone.variants.find(v => v.colorName === selectedColor);
        if (variant && variant.stock < item.quantity) {
          return res.status(400).json({ message: `สี ${selectedColor} ของ ${phone.name} เหลือไม่พอ` });
        }
      } else if (phone.stock < item.quantity) {
        return res.status(400).json({ message: `สินค้า ${item.name} เหลือไม่พอ` });
      }
    }

    // 2. จัดการคูปอง
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        await Coupon.updateOne({ code: couponCode.toUpperCase() }, { $inc: { usageCount: 1 } });
      }
    }

    // 3. ตัดสต็อก
    for (const item of items) {
      const colorMatch = item.name.match(/\(([^)]+)\)/);
      const selectedColor = colorMatch ? colorMatch[1] : null;

      if (selectedColor) {
        await Phone.updateOne(
          { _id: item.id, "variants.colorName": selectedColor },
          { $inc: { "variants.$.stock": -item.quantity, "stock": -item.quantity } }
        );
      } else {
        await Phone.findByIdAndUpdate(item.id, { $inc: { stock: -item.quantity } });
      }
    }

    // 4. บันทึกออเดอร์
    const newOrder = new Order({
      username,
      items: items.map(i => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image
      })),
      totalAmount,
      shippingAddress, 
      paymentProof,   
      status: 'Pending'
    });
    await newOrder.save();

    res.json({ message: "สั่งซื้อสำเร็จ!" });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error });
  }
});

// ------------------------------------
// 📦 ORDER MANAGEMENT API - อัปเดตสถานะและคืนสต็อกหาก Cancelled
// ------------------------------------

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    // 1. ดึงข้อมูลออเดอร์เดิม
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "ไม่พบออเดอร์" });

    // 🟢 ถ้าเปลี่ยนสถานะเป็น 'Cancelled' และเดิมไม่ใช่ 'Cancelled' ให้คืนสต็อก
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      for (const item of order.items) {
        const colorMatch = item.name.match(/\(([^)]+)\)/);
        const selectedColor = colorMatch ? colorMatch[1] : null;
        
        // ค้นหาสินค้าจากชื่อ (ตัดชื่อสีออก)
        const baseName = item.name.split(' (')[0];
        const phone = await Phone.findOne({ name: baseName });

        if (phone) {
          if (selectedColor) {
            // คืนสต็อกเฉพาะสี และ สต็อกหลัก
            await Phone.updateOne(
              { _id: phone._id, "variants.colorName": selectedColor },
              { $inc: { "variants.$.stock": item.quantity, "stock": item.quantity } }
            );
          } else {
            // คืนสต็อกหลักอย่างเดียว
            await Phone.findByIdAndUpdate(phone._id, { $inc: { stock: item.quantity } });
          }
        }
      }
    }

    // 2. อัปเดตสถานะ
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId, 
      { status }, 
      { new: true }
    );
    res.json(updatedOrder);
  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ message: "อัปเดตไม่สำเร็จ", error });
  }
});

// ------------------------------------
// AUTH & CRUD API
// ------------------------------------

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role: 'member' });
    await user.save();
    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (error) {
    res.status(400).json({ message: "สมัครไม่สำเร็จ", error });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, username: user.username, role: user.role });
    } else {
      res.status(401).json({ message: "อีเมลหรือรหัสผ่านผิด" });
    }
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการ Login" });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "ดึงข้อมูลผู้ใช้ไม่สำเร็จ" });
  }
});

app.get('/api/phones', async (req, res) => {
  try {
    const phones = await Phone.find(); res.json(phones);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', error });
  }
});

app.post('/api/phones', async (req, res) => {
  try {
    const newPhone = new Phone(req.body); await newPhone.save(); res.status(201).json(newPhone);
  } catch (error) {
    res.status(400).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล', error });
  }
});

app.get('/api/phones/:id', async (req, res) => {
  try {
    const phone = await Phone.findById(req.params.id);
    if (!phone) return res.status(404).json({ message: 'ไม่พบข้อมูลสินค้านี้' });
    res.json(phone);
  } catch (error) {
    res.status(500).json({ message: 'รูปแบบ ID อาจไม่ถูกต้อง', error });
  }
});

app.put('/api/phones/:id', async (req, res) => {
  try {
    const updatedPhone = await Phone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedPhone);
  } catch (error) {
    res.status(400).json({ message: 'อัปเดตข้อมูลไม่สำเร็จ', error });
  }
});

app.delete('/api/phones/:id', async (req, res) => {
  try {
    await Phone.findByIdAndDelete(req.params.id); res.json({ message: 'ลบข้อมูลสินค้าเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ message: 'ลบข้อมูลไม่สำเร็จ', error });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server วิ่งอยู่ที่พอร์ต ${PORT}`);
});