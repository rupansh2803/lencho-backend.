
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { User, Product, Order, Cart, Wishlist, Settings, OTPLog, Testimonial, Category, Inquiry } = require('./models');

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_6oE5E0WwH6wX9z', 
  key_secret: process.env.RAZORPAY_SECRET || 'test_secret'
});

const app = express();

// CORS Configuration for Production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:30054',
  'https://lencho.in',
  'https://www.lencho.in',
  'https://lencho.netlify.app',
  'https://api.lencho.in'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

let useDB = false;
// ─── MONGODB ──────────────────────────────────────────────────
async function initDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lencho-db');
    // Seed initial products if none exist
    const pCount = await Product.countDocuments();
    if (pCount === 0) {
      console.log('Seeding initial products...');
      const sampleProducts = [
        { 
          name: 'Silver Oxidized Jhumka Earrings', 
          category: 'earrings', 
          price: 299, 
          mrp: 599, 
          discount: 50, 
          stock: 20, 
          featured: true,
          images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80'],
          description: 'Premium Silver Oxidized Jhumkas for everyday elegance.'
        },
        { 
          name: 'American Diamond Necklace Set', 
          category: 'necklace', 
          price: 1299, 
          mrp: 2499, 
          discount: 48, 
          stock: 15, 
          featured: true,
          images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'],
          description: 'Stunning AD Necklace set with matching earrings.'
        },
        { 
          name: 'Gold Plated Toe Rings', 
          category: 'toe-rings', 
          price: 199, 
          mrp: 399, 
          discount: 50, 
          stock: 50, 
          featured: true,
          images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80'],
          description: 'Elegant toe rings for traditional look.'
        }
      ];
      await Product.insertMany(sampleProducts);
    }

    useDB = true;
    console.log('✅ MongoDB Connected → DB: lencho-db');
    await seedAdmin();
    await seedCategories();
    await seedProducts();
    await seedSettings();
    console.log('🚀 System Bootstrapped Successfully');
  } catch (err) {
    console.log('⚠️ MongoDB or Seeding Error:', err.message);
    useDB = false;
    initFallback();
  }
}
initDB();

// ─── SMS OTP (Fast2SMS – free Indian SMS) ────────────────────
async function sendSMSOTP(phone, otp) {
  // Normalize phone number
  const mobile = phone.replace(/\D/g, '').slice(-10);
  const DEV = process.env.NODE_ENV !== 'production';

  // Always log in dev (so you can test without SMS key)
  console.log(`\n📱 OTP for ${mobile}: ${otp}  ← (visible because NODE_ENV=development)\n`);

  // If Fast2SMS key is configured, send real SMS
  const key = process.env.FAST2SMS_KEY;
  if (key && key !== 'your_fast2sms_api_key_here') {
    try {
      const resp = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        params: {
          authorization: key,
          variables_values: otp,
          route: 'otp',
          numbers: mobile,
        },
        headers: { 'cache-control': 'no-cache' },
        timeout: 8000
      });
      if (resp.data?.return === true) {
        console.log(`✅ SMS sent to ${mobile}`);
        return { sent: true, via: 'sms' };
      }
    } catch (e) {
      console.log('⚠️ SMS send failed:', e.message);
    }
  }
  // Fallback: return dev OTP so frontend can show it
  return { sent: true, via: 'dev', devOtp: DEV ? otp : undefined };
}

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

// ─── FALLBACK (JSON) ──────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  products: path.join(DATA_DIR, 'products.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  carts: path.join(DATA_DIR, 'carts.json'),
  wishlists: path.join(DATA_DIR, 'wishlists.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  discounts: path.join(DATA_DIR, 'discounts.json'),
};

const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; } };
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

function initFallback() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  Object.values(FILES).forEach(f => { if (!fs.existsSync(f)) writeJson(f, []); });
  const users = readJson(FILES.users);
  if (!users.find(u => u.role === 'admin')) {
    users.push({
      id: uuidv4(), name: 'Admin', email: 'admin@lencho.in',
      password: bcrypt.hashSync('admin123', 10), role: 'admin', phone: '9999999999',
      isVerified: true, createdAt: new Date().toISOString()
    });
    writeJson(FILES.users, users);
  }
  const prods = readJson(FILES.products);
  if (!prods.length) seedProductsJSON();
}

// ─── SEED DATA ────────────────────────────────────────────────
async function seedCategories() {
  try {
    const cCount = await Category.countDocuments();
    if (cCount === 0) {
      console.log('Seeding categories...');
      const sampleCats = [
        { name: 'Earrings', slug: 'earrings', image: '/images/earrings.png', description: 'Elegant earrings for every occasion' },
        { name: 'Necklace', slug: 'necklace', image: '/images/necklace.png', description: 'Stunning necklace sets' },
        { name: 'Toe Rings', slug: 'toe-rings', image: '/images/toe-rings.png', description: 'Traditional and modern toe rings' },
        { name: 'Payal', slug: 'payal', image: '/images/payal.png', description: 'Beautiful anklets' },
        { name: 'Rings', slug: 'rings', image: '/images/rings.png', description: 'Premium finger rings' },
        { name: 'Bangles', slug: 'bangles', image: '/images/bangles.png', description: 'Traditional bangles' }
      ];
      await Category.insertMany(sampleCats);
    }
  } catch (e) { console.error('Category Seed Error:', e.message); }
}

async function seedAdmin() {
  const email = 'rupanshsaini17@gmail.com';
  const pass = 'Isha@1234@';
  const phone = '7404217625';

  if (useDB) {
    const hashedPass = await bcrypt.hash(pass, 10);
    // Force specific user to be admin with these credentials
    await User.findOneAndUpdate(
      { email }, 
      { name: 'Admin', email, password: hashedPass, role: 'admin', phone, isVerified: true, securityQuestion: 'Birthplace', securityAnswer: 'Admin' }, 
      { upsert: true, new: true }
    );
    console.log(`✅ Admin master account synced: ${email}`);
  }
}

async function seedSettings() {
  const count = await Settings.countDocuments();
  if (!count) {
    await Settings.insertMany([
      { key: 'globalDiscount', value: 0, label: 'Global Discount %' },
      { key: 'freeShippingMin', value: 999, label: 'Free Shipping Minimum (₹)' },
      { key: 'shippingCharge', value: 49, label: 'Shipping Charge (₹)' },
      { key: 'whatsappNumber', value: process.env.WHATSAPP_NUMBER || '919999999999', label: 'WhatsApp Business Number' },
      { key: 'gstRate', value: 3, label: 'Default GST Rate %' },
      { key: 'razorpayKeyId', value: '', label: 'Razorpay Key ID' },
      { key: 'razorpaySecret', value: '', label: 'Razorpay Secret' },
      { key: 'shiprocketEmail', value: '', label: 'Shiprocket Email' },
      { key: 'shiprocketPassword', value: '', label: 'Shiprocket Password' },
      { key: 'storeName', value: 'Lencho', label: 'Store Name' },
      { key: 'storeEmail', value: 'hello@lencho.in', label: 'Store Email' },
      { key: 'storePhone', value: '+91 9876543210', label: 'Store Phone' },
      { key: 'gstin', value: '27XXXXX1234X1ZX', label: 'GSTIN Number' },
      { key: 'saleEndDate', value: new Date(Date.now() + 86400000).toISOString(), label: 'Sale End Date (ISO)' },
      { key: 'smtpHost', value: 'smtp.gmail.com', label: 'SMTP Host' },
      { key: 'smtpPort', value: 465, label: 'SMTP Port' },
      { key: 'smtpUser', value: '', label: 'SMTP User (Gmail)' },
      { key: 'smtpPass', value: '', label: 'SMTP Pass (App Password)' },
      { key: 'otpSubject', value: '✦ Your LENCHO Verification Code: {{otp}} ✦', label: 'OTP Email Subject' },
      { key: 'otpBody', value: '<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:2rem;border:1px solid #eee;border-radius:12px;"><h2 style="color:#c9748f;text-align:center;">✦ LENCHO ✦</h2><p>Hello,</p><p>Your verification code is <b style="font-size:1.5rem;color:#c9748f;">{{otp}}</b></p><p style="color:gray;font-size:0.8rem;">This code is valid for 5 minutes. Do not share it with anyone.</p></div>', label: 'OTP Email Body (HTML)' }
    ]);
    console.log('✅ Default settings seeded');
  } else {
    // Add missing keys
    const exist = await Settings.findOne({ key: 'saleEndDate' });
    if (!exist) await Settings.create({ key: 'saleEndDate', value: new Date(Date.now() + 86400000).toISOString(), label: 'Sale End Date (ISO)' });
    
    // Support OTP Template updates
    const otpExist = await Settings.findOne({ key: 'otpSubject' });
    if (!otpExist) {
       await Settings.create({ key: 'otpSubject', value: '✦ Your LENCHO Verification Code: {{otp}} ✦', label: 'OTP Email Subject' });
       await Settings.create({ key: 'otpBody', value: '<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:2rem;border:1px solid #eee;border-radius:12px;"><h2 style="color:#c9748f;text-align:center;">✦ LENCHO ✦</h2><p>Hello,</p><p>Your verification code is <b style="font-size:1.5rem;color:#c9748f;">{{otp}}</b></p><p style="color:gray;font-size:0.8rem;">This code is valid for 5 minutes. Do not share it with anyone.</p></div>', label: 'OTP Email Body (HTML)' });
    }
  }
}

async function seedProducts() {
  const count = await Product.countDocuments();
  if (!count) {
    await Product.insertMany([
      { name: 'Rose Gold Hoop Earrings', category: 'earrings', price: 599, mrp: 999, discount: 40, stock: 50, description: 'Elegant rose gold hoop earrings with crystal accents. Perfect for everyday wear.', images: ['/images/p1.png'], gstRate: 3, hsn: '7117', featured: true, rating: 4.5 },
      { name: 'Golden Kundan Necklace Set', category: 'necklace', price: 1299, mrp: 2499, discount: 48, stock: 30, description: 'Stunning kundan necklace set. Gold-plated with meenakari work.', images: ['/images/p2.png'], gstRate: 3, hsn: '7117', featured: true, rating: 4.8 },
      { name: 'Silver Oxidized Toe Rings', category: 'toe-rings', price: 299, mrp: 499, discount: 40, stock: 100, description: 'Handcrafted oxidized silver toe rings with tribal motifs.', images: ['/images/p3.png'], gstRate: 3, hsn: '7117', featured: true, rating: 4.3 },
      { name: 'Boho Jhumka Earrings', category: 'earrings', price: 449, mrp: 799, discount: 44, stock: 75, description: 'Traditional jhumka with colorful beads and rose gold plating.', images: ['/images/p4.png'], gstRate: 3, hsn: '7117', featured: true, rating: 4.6 },
      { name: 'Pearl Drop Necklace', category: 'necklace', price: 899, mrp: 1599, discount: 44, stock: 40, description: 'Elegant freshwater pearl drop necklace with gold chain.', images: ['/images/p2.png'], gstRate: 3, hsn: '7117', featured: false, rating: 4.4 },
      { name: 'Crystal Stud Earrings', category: 'earrings', price: 349, mrp: 599, discount: 42, stock: 80, description: 'Sparkling crystal stud earrings in rose gold setting.', images: ['/images/p1.png'], gstRate: 3, hsn: '7117', featured: false, rating: 4.2 },
    ]);
    console.log('✅ Sample products seeded');
  }
}

function seedProductsJSON() {
  const sample = [
    { id: uuidv4(), name: 'Rose Gold Hoop Earrings', category: 'earrings', price: 599, mrp: 999, discount: 40, stock: 50, description: 'Elegant rose gold hoop earrings.', images: ['/images/p1.png'], gstRate: 3, hsn: '7117', featured: true, rating: 4.5, reviews: [], createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Golden Kundan Necklace Set', category: 'necklace', price: 1299, mrp: 2499, discount: 48, stock: 30, description: 'Stunning kundan necklace.', images: ['/images/p2.png'], gstRate: 3, hsn: '7117', featured: true, rating: 4.8, reviews: [], createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Silver Oxidized Toe Rings', category: 'toe-rings', price: 299, mrp: 499, discount: 40, stock: 100, description: 'Handcrafted oxidized silver toe rings.', images: ['/images/p3.png'], gstRate: 3, hsn: '7117', featured: true, rating: 4.3, reviews: [], createdAt: new Date().toISOString() },
  ];
  writeJson(FILES.products, sample);
}

// ─── MIDDLEWARE ────────────────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d', etag: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '30d' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'lencho-secret',
  resave: false, saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true }
}));

if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'));
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, 'uploads/'),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────
const requireAuth = (req, res, next) => { if (!req.session.userId) return res.status(401).json({ error: 'Please login first' }); next(); };
const requireAdmin = (req, res, next) => { if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: 'Admin access only' }); next(); };

// ─── SECURITY HELPERS ─────────────────────────────────────────
function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { q: `${a} + ${b} = ?`, a: a + b };
}

// ─── HELPER: get setting ──────────────────────────────────────
async function getSetting(key, fallback) {
  if (!useDB) return fallback;
  const s = await Settings.findOne({ key });
  return s ? s.value : fallback;
}

// ─── SETTINGS API ─────────────────────────────────────────────
app.get('/api/settings/public', async (req, res) => {
  try {
    const keys = ['globalDiscount', 'freeShippingMin', 'shippingCharge', 'whatsappNumber', 'storeName', 'storeEmail', 'storePhone'];
    if (useDB) {
      const rows = await Settings.find({ key: { $in: keys } });
      const obj = {};
      rows.forEach(r => obj[r.key] = r.value);
      return res.json(obj);
    }
    res.json({ globalDiscount: 0, freeShippingMin: 999, shippingCharge: 49, whatsappNumber: '919999999999' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    if (!useDB) return res.json([]);
    const settings = await Settings.find({});
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body; // array of {key, value}
    if (!useDB) return res.json({ success: true });
    for (const s of settings) {
      await Settings.findOneAndUpdate({ key: s.key }, { value: s.value }, { upsert: true });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/discount/email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    console.log(`[DISCOUNT] Coupon WELCOME10 claimed by: ${email}`);
    if (!useDB) {
      const discounts = readJson(FILES.discounts);
      discounts.push({ email, code: 'WELCOME10', createdAt: new Date().toISOString() });
      writeJson(FILES.discounts, discounts);
    }
    res.json({ success: true, code: 'WELCOME10' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/discounts', requireAdmin, async (req, res) => {
  try {
    if (!useDB) {
      const discounts = readJson(FILES.discounts);
      return res.json(discounts);
    }
    res.json([]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GST & TAX REPORTING ──────────────────────────────────────
app.get('/api/admin/gst-data', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'cancelled' } });
    let totalSales = 0;
    let totalGST = 0;
    let cgst = 0;
    let sgst = 0;

    orders.forEach(order => {
      totalSales += order.grandTotal || 0;
      totalGST += order.gstTotal || 0;
      cgst += (order.gstTotal || 0) / 2;
      sgst += (order.gstTotal || 0) / 2;
    });

    res.json({
      summary: {
        totalSales,
        totalGST,
        cgst,
        sgst,
        orderCount: orders.length
      },
      orders: orders.map(o => ({
        id: o._id,
        date: o.createdAt,
        customer: o.userName,
        amount: o.grandTotal,
        gst: o.gstTotal,
        status: o.status
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── TESTIMONIALS ──────────────────────────────────────────────
app.get('/api/testimonials', async (req, res) => {
  try {
    const t = await Testimonial.find({ approved: true }).sort('-createdAt');
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/testimonials', requireAdmin, async (req, res) => {
  try {
    const t = new Testimonial(req.body);
    await t.save();
    res.json({ message: 'Testimonial added', testimonial: t });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SECURITY & CAPTCHA ───────────────────────────────────────
app.get('/api/captcha', (req, res) => {
  const { q, a } = generateCaptcha();
  req.session.captcha = a;
  res.json({ question: q });
});

// ─── ADMIN SETUP ─────────────────────────────────────────────
app.get('/api/admin/check-setup', async (req, res) => {
  try {
    if (!useDB) return res.json({ setupRequired: false });
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.json({ setupRequired: adminCount === 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/setup', async (req, res) => {
  try {
    if (await User.countDocuments({ role: 'admin' }) > 0) return res.status(400).json({ error: 'Setup already completed' });
    const { name, email, password, phone, securityQuestion, securityAnswer } = req.body;
    if (!email || !password || !securityAnswer) return res.status(400).json({ error: 'Complete all fields' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone, role:'admin', securityQuestion, securityAnswer, isVerified: true });
    req.session.userId = user._id.toString(); req.session.role = 'admin'; 
    res.json({ success: true, message: 'Master Admin created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── FORGOT PASSWORD (SECURITY QUESTION) ──────────────────────
app.post('/api/admin/forgot-password', async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(404).json({ error: 'Admin account not found' });
    if (user.securityAnswer.toLowerCase() !== securityAnswer.toLowerCase()) return res.status(400).json({ error: 'Incorrect security answer' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── RAZORPAY — SMART PAYMENT HUB ─────────────────────────────
app.post('/api/razorpay/order', requireAuth, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: receipt || `rec_${Date.now()}`,
      payment_capture: 1
    };
    const order = await rzp.orders.create(options);
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/razorpay/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const key_secret = process.env.RAZORPAY_SECRET || 'test_secret';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      if (useDB) {
        await Order.findOneAndUpdate({ id: orderId }, {
          status: 'placed',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          $push: { timeline: { status: 'paid', label: 'Payment Verified ✓', date: new Date(), done: true } }
        });
      }
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid payment signature' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SHIPROCKET — AUTOMATED LOGISTICS ─────────────────────────
const ShiprocketService = {
  token: null,
  async getToken() {
    try {
      const res = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
        email: process.env.SHIPROCKET_EMAIL || 'hello@lencho.in',
        password: process.env.SHIPROCKET_PASSWORD || 'password123'
      });
      this.token = res.data.token;
      return this.token;
    } catch (err) { console.error('Shiprocket Auth Error:', err.message); return null; }
  },
  async createOrder(order, token) {
    // Transform our order to Shiprocket format
    const payload = {
      order_id: order.id,
      order_date: new Date(order.createdAt).toISOString().split('T')[0],
      pickup_location: "Primary",
      billing_customer_name: order.userName,
      billing_last_name: "",
      billing_address: order.address,
      billing_city: "Barara",
      billing_pincode: "133201",
      billing_state: "Haryana",
      billing_country: "India",
      billing_email: "customer@gmail.com",
      billing_phone: "9876543210",
      shipping_is_billing: true,
      order_items: order.items.map(i => ({
        name: i.name,
        sku: i.productId,
        units: i.quantity,
        selling_price: i.price,
        hsn: i.hsn || "7117"
      })),
      payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.subtotal,
      length: 10, breadth: 10, height: 10, weight: 0.5
    };
    const res = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};

app.post('/api/admin/orders/:id/shiprocket', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const token = await ShiprocketService.getToken();
    if (!token) return res.status(500).json({ error: 'Could not connect to Shiprocket' });
    
    const srOrder = await ShiprocketService.createOrder(order, token);
    
    // Generate AWB automatically
    const awbRes = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
      shipment_id: srOrder.shipment_id
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    await Order.findOneAndUpdate({ id: order.id }, {
      shiprocketOrderId: srOrder.order_id,
      shiprocketShipmentId: srOrder.shipment_id,
      awbCode: awbRes.data.response.data.awb_code,
      status: 'shipped',
      $push: { timeline: { status: 'shipped', label: 'Order Shipped via Shiprocket', date: new Date(), done: true } }
    });
    
    res.json({ success: true, awb: awbRes.data.response.data.awb_code });
  } catch (err) { res.status(500).json({ error: err.response?.data?.message || err.message }); }
});

app.get('/api/admin/orders/:id/label', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    const token = await ShiprocketService.getToken();
    const labelRes = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
      shipment_id: [order.shiprocketShipmentId]
    }, { headers: { Authorization: `Bearer ${token}` } });
    res.json({ label_url: labelRes.data.label_url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── OTP ROUTES ───────────────────────────────────────────────
app.post('/api/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    const mobile = phone.replace(/\D/g, '').slice(-10);
    if (mobile.length !== 10) return res.status(400).json({ error: 'Enter valid 10-digit mobile number' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (useDB) {
      await OTPLog.deleteMany({ target: mobile, used: false });
      await OTPLog.create({ target: mobile, code: otp, type: 'signup', expiresAt });
    } else {
      req.session.pendingOTP = { phone: mobile, code: otp, expiresAt: expiresAt.toISOString() };
    }

    const result = await sendSMSOTP(mobile, otp);
    res.json({
      success: true,
      message: `OTP has been sent to +91 ${mobile} 📱`,
      via: result.via,
      devOtp: result.devOtp
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/otp/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const mobile = phone.replace(/\D/g, '').slice(-10);
    if (useDB) {
      const record = await OTPLog.findOne({ target: mobile, code: otp, used: false });
      if (!record || record.expiresAt < new Date()) return res.status(400).json({ error: 'Invalid or expired OTP' });
      await OTPLog.findByIdAndUpdate(record._id, { used: true });
    } else {
      const pending = req.session.pendingOTP;
      if (!pending || pending.phone !== mobile || pending.code !== otp) return res.status(400).json({ error: 'Invalid OTP' });
      if (new Date(pending.expiresAt) < new Date()) return res.status(400).json({ error: 'OTP expired. Please resend.' });
    }
    res.json({ success: true, verified: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/otp/send-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (useDB) {
      await OTPLog.deleteMany({ target: email, used: false });
      await OTPLog.create({ target: email, code: otp, type: 'email_login', expiresAt });
    } else {
      req.session.pendingEmailOTP = { email, code: otp, expiresAt: expiresAt.toISOString() };
    }

    const host = await getSetting('smtpHost', 'smtp.gmail.com');
    const port = await getSetting('smtpPort', 465);
    const user = await getSetting('smtpUser', '');
    const pass = await getSetting('smtpPass', '');
    const subjectTpl = await getSetting('otpSubject', 'Your Verification Code: {{otp}}');
    const bodyTpl = await getSetting('otpBody', 'Your OTP is {{otp}}');

    if (!user || !pass) return res.status(500).json({ error: 'SMTP not configured in admin settings' });

    const transporter = nodemailer.createTransport({
      host, port: +port, secure: +port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: `"Lencho Secure" <${user}>`,
      to: email,
      subject: subjectTpl.replace('{{otp}}', otp),
      html: bodyTpl.replace('{{otp}}', otp)
    });

    res.json({ success: true, message: 'OTP sent! Check your inbox.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/otp/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    if (useDB) {
      const log = await OTPLog.findOne({ target: email, code: otp, used: false, expiresAt: { $gt: new Date() } });
      if (!log) return res.status(400).json({ error: 'Invalid or expired OTP' });
      log.used = true; await log.save();
    } else {
      const pending = req.session.pendingEmailOTP;
      if (!pending || pending.email !== email || pending.code !== otp) return res.status(400).json({ error: 'Invalid OTP' });
      if (new Date(pending.expiresAt) < new Date()) return res.status(400).json({ error: 'OTP expired' });
    }

    res.json({ success: true, verified: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


app.get('/api/captcha', (req, res) => {
  const n1 = Math.floor(Math.random() * 10) + 1;
  const n2 = Math.floor(Math.random() * 10) + 1;
  const answer = n1 + n2;
  req.session.captcha = answer;
  res.json({ success: true, question: `${n1} + ${n2} = ?`, answer }); // answer sent for debugging, can be removed in prod
});

// ─── AUTH ROUTES ──────────────────────────────────────────────
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, phone, gender } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });

    if (useDB) {
      if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashed, phone: phone || '', gender: gender || 'female', isVerified: true });
      req.session.userId = user._id.toString(); req.session.role = user.role; req.session.name = user.name;
      const { password: _, ...safe } = user.toObject();
      return res.json({ success: true, user: { id: safe._id, ...safe } });
    }
    const users = readJson(FILES.users);
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), name, email, password: hashed, phone: phone || '', gender: gender || 'female', role: 'user', isVerified: true, address: '', createdAt: new Date().toISOString() };
    users.push(user); writeJson(FILES.users, users);
    req.session.userId = user.id; req.session.role = user.role; req.session.name = user.name;
    return res.json({ success: true, user: { id: user.id, name, email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, captchaAnswer } = req.body;
    if (useDB) {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: 'Invalid email or password' });
      
      // CAPTCHA check for admins
      if (user.role === 'admin') {
        if (!captchaAnswer || parseInt(captchaAnswer) !== req.session.captcha) {
          return res.status(400).json({ error: 'Invalid or missing CAPTCHA answer' });
        }
      }

      if (!await bcrypt.compare(password, user.password)) return res.status(400).json({ error: 'Invalid email or password' });
      req.session.userId = user._id.toString(); req.session.role = user.role; req.session.name = user.name;
      const { password: _, ...safe } = user.toObject();
      return res.json({ success: true, user: { id: user._id, ...safe } });
    }
    const users = readJson(FILES.users);
    const user = users.find(u => u.email === email);
    if (!user || !await bcrypt.compare(password, user.password)) return res.status(400).json({ error: 'Invalid email or password' });
    req.session.userId = user.id; req.session.role = user.role; req.session.name = user.name;
    res.json({ success: true, user: { id: user.id, name: user.name, email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });

app.get('/api/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  try {
    if (useDB) {
      const user = await User.findById(req.session.userId).select('-password');
      return res.json({ user: user ? { id: user._id, ...user.toObject() } : null });
    }
    const users = readJson(FILES.users);
    const user = users.find(u => u.id === req.session.userId);
    if (!user) return res.json({ user: null });
    const { password, ...safe } = user;
    res.json({ user: safe });
  } catch { res.json({ user: null }); }
});

app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, address, gender, password, securityQuestion, securityAnswer } = req.body;
    if (useDB) {
      const updates = { name, phone, address, gender };
      if (password) updates.password = await bcrypt.hash(password, 10);
      if (securityQuestion) updates.securityQuestion = securityQuestion;
      if (securityAnswer) updates.securityAnswer = securityAnswer;
      
      const user = await User.findByIdAndUpdate(req.session.userId, updates, { new: true }).select('-password');
      req.session.name = user.name;
      return res.json({ success: true, user: { id: user._id, ...user.toObject() } });
    }
    const users = readJson(FILES.users);
    const idx = users.findIndex(u => u.id === req.session.userId);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    if (name) users[idx].name = name; if (phone) users[idx].phone = phone;
    if (address) users[idx].address = address; if (gender) users[idx].gender = gender;
    writeJson(FILES.users, users);
    const { password: p, ...safe } = users[idx];
    res.json({ success: true, user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── CATEGORY (COLLECTION) API ────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    if (useDB) {
      const cats = await Category.find().sort('displayOrder');
      return res.json(cats);
    }
    res.json([]); // JSON fallback categories
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const { name, image, description, displayOrder } = req.body;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const cat = await Category.create({ name, slug, image, description, displayOrder });
    res.json({ success: true, category: cat });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category: cat });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PRODUCTS ─────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const { category, featured, search, sort } = req.query;
    if (useDB) {
      let query = {};
      if (category) query.category = category;
      if (featured === 'true') query.featured = true;
      if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
      let q = Product.find(query);
      if (sort === 'price-asc') q = q.sort({ price: 1 });
      else if (sort === 'price-desc') q = q.sort({ price: -1 });
      else if (sort === 'rating') q = q.sort({ rating: -1 });
      const products = await q.lean();
      return res.json(products.map(p => ({ ...p, id: p._id })));
    }
    let products = readJson(FILES.products);
    if (category) products = products.filter(p => p.category === category);
    if (featured === 'true') products = products.filter(p => p.featured);
    if (search) products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
    res.json(products);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    if (useDB) {
      const p = await Product.findById(req.params.id).lean();
      if (!p) return res.status(404).json({ error: 'Product not found' });
      return res.json({ ...p, id: p._id });
    }
    const products = readJson(FILES.products);
    const p = products.find(p => p.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch { res.status(404).json({ error: 'Product not found' }); }
});

app.post('/api/products', requireAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, category, price, mrp, discount, stock, description, gstRate, hsn, featured } = req.body;
    const images = req.files?.length ? req.files.map(f => '/uploads/' + f.filename) : ['/images/p1.png'];
    if (useDB) {
      const p = await Product.create({ name, category, price: +price, mrp: +mrp, discount: +(discount || 0), stock: +stock, description, images, gstRate: +(gstRate || 18), hsn: hsn || '7117', featured: featured === 'true' });
      return res.json({ success: true, product: { ...p.toObject(), id: p._id } });
    }
    const products = readJson(FILES.products);
    const p = { id: uuidv4(), name, category, price: +price, mrp: +mrp, discount: +(discount || 0), stock: +stock, description, images, gstRate: +(gstRate || 18), hsn: hsn || '7117', featured: featured === 'true', rating: 0, reviews: [], createdAt: new Date().toISOString() };
    products.push(p);
    writeJson(FILES.products, products);
    res.json({ success: true, product: p });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', requireAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.files?.length) updates.images = req.files.map(f => '/uploads/' + f.filename);
    ['price', 'mrp', 'discount', 'stock', 'gstRate'].forEach(f => { if (updates[f]) updates[f] = +updates[f]; });
    if (updates.featured !== undefined) updates.featured = updates.featured === 'true';
    if (useDB) {
      const p = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!p) return res.status(404).json({ error: 'Not found' });
      return res.json({ success: true, product: { ...p.toObject(), id: p._id } });
    }
    const products = readJson(FILES.products);
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    products[idx] = { ...products[idx], ...updates };
    writeJson(FILES.products, products);
    res.json({ success: true, product: products[idx] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    if (useDB) { await Product.findByIdAndDelete(req.params.id); return res.json({ success: true }); }
    const products = readJson(FILES.products).filter(p => p.id !== req.params.id);
    writeJson(FILES.products, products); res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── CART ─────────────────────────────────────────────────────
app.get('/api/cart', requireAuth, async (req, res) => {
  try {
    const uid = req.session.userId;
    if (useDB) {
      const cart = await Cart.findOne({ userId: uid }) || { items: [] };
      const enriched = await Promise.all((cart.items || []).map(async item => {
        const p = await Product.findById(item.productId).lean();
        return p ? { ...item.toObject?.(), ...item, product: { ...p, id: p._id } } : null;
      }));
      return res.json({ items: enriched.filter(Boolean), count: enriched.filter(Boolean).length });
    }
    const carts = readJson(FILES.carts);
    const cart = carts.find(c => c.userId === uid) || { items: [] };
    const products = readJson(FILES.products);
    const enriched = cart.items.map(item => {
      const p = products.find(p => p.id === item.productId);
      return p ? { ...item, product: p } : null;
    }).filter(Boolean);
    res.json({ items: enriched, count: enriched.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cart/add', requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const uid = req.session.userId;
    if (useDB) {
      let cart = await Cart.findOne({ userId: uid });
      if (!cart) cart = await Cart.create({ userId: uid, items: [] });
      const idx = cart.items.findIndex(i => i.productId === productId);
      if (idx > -1) cart.items[idx].quantity += +quantity;
      else cart.items.push({ productId, quantity: +quantity });
      await cart.save();
      return res.json({ success: true, count: cart.items.length });
    }
    const carts = readJson(FILES.carts);
    let ci = carts.findIndex(c => c.userId === uid);
    if (ci === -1) { carts.push({ userId: uid, items: [] }); ci = carts.length - 1; }
    const ii = carts[ci].items.findIndex(i => i.productId === productId);
    if (ii > -1) carts[ci].items[ii].quantity += +quantity;
    else carts[ci].items.push({ productId, quantity: +quantity });
    writeJson(FILES.carts, carts);
    res.json({ success: true, count: carts[ci].items.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/cart/update', requireAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const uid = req.session.userId;
    if (useDB) {
      const cart = await Cart.findOne({ userId: uid });
      if (!cart) return res.status(404).json({ error: 'Cart not found' });
      if (+quantity <= 0) cart.items = cart.items.filter(i => i.productId !== productId);
      else { const idx = cart.items.findIndex(i => i.productId === productId); if (idx > -1) cart.items[idx].quantity = +quantity; }
      await cart.save(); return res.json({ success: true });
    }
    const carts = readJson(FILES.carts);
    const ci = carts.findIndex(c => c.userId === uid);
    if (ci === -1) return res.status(404).json({ error: 'Cart not found' });
    if (+quantity <= 0) carts[ci].items = carts[ci].items.filter(i => i.productId !== productId);
    else { const ii = carts[ci].items.findIndex(i => i.productId === productId); if (ii > -1) carts[ci].items[ii].quantity = +quantity; }
    writeJson(FILES.carts, carts); res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/cart/:productId', requireAuth, async (req, res) => {
  try {
    const uid = req.session.userId;
    if (useDB) {
      await Cart.findOneAndUpdate({ userId: uid }, { $pull: { items: { productId: req.params.productId } } });
      return res.json({ success: true });
    }
    const carts = readJson(FILES.carts);
    const ci = carts.findIndex(c => c.userId === uid);
    if (ci > -1) { carts[ci].items = carts[ci].items.filter(i => i.productId !== req.params.productId); writeJson(FILES.carts, carts); }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/cart', requireAuth, async (req, res) => {
  try {
    const uid = req.session.userId;
    if (useDB) { await Cart.findOneAndUpdate({ userId: uid }, { items: [] }); return res.json({ success: true }); }
    const carts = readJson(FILES.carts);
    const ci = carts.findIndex(c => c.userId === uid);
    if (ci > -1) { carts[ci].items = []; writeJson(FILES.carts, carts); }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── WISHLIST ─────────────────────────────────────────────────
app.get('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const uid = req.session.userId;
    if (useDB) {
      const wl = await Wishlist.findOne({ userId: uid }) || { items: [] };
      const products = await Product.find({ _id: { $in: wl.items } }).lean();
      return res.json(products.map(p => ({ ...p, id: p._id })));
    }
    const wl = (readJson(FILES.wishlists).find(w => w.userId === uid) || { items: [] });
    const products = readJson(FILES.products);
    res.json(wl.items.map(id => products.find(p => p.id === id)).filter(Boolean));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/wishlist/toggle', requireAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    const uid = req.session.userId;
    if (useDB) {
      let wl = await Wishlist.findOne({ userId: uid });
      if (!wl) wl = await Wishlist.create({ userId: uid, items: [] });
      const idx = wl.items.indexOf(productId);
      if (idx > -1) { wl.items.splice(idx, 1); await wl.save(); return res.json({ added: false }); }
      wl.items.push(productId); await wl.save(); return res.json({ added: true });
    }
    const wishlists = readJson(FILES.wishlists);
    let wi = wishlists.findIndex(w => w.userId === uid);
    if (wi === -1) { wishlists.push({ userId: uid, items: [] }); wi = wishlists.length - 1; }
    const ii = wishlists[wi].items.indexOf(productId);
    if (ii > -1) { wishlists[wi].items.splice(ii, 1); writeJson(FILES.wishlists, wishlists); return res.json({ added: false }); }
    wishlists[wi].items.push(productId); writeJson(FILES.wishlists, wishlists); res.json({ added: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ORDERS ───────────────────────────────────────────────────
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { address, paymentMethod, items, couponCode } = req.body;
    const globalDiscount = await getSetting('globalDiscount', 0);
    const freeShipMin = await getSetting('freeShippingMin', 999);
    const shipCharge = await getSetting('shippingCharge', 49);

    let subtotal = 0, totalGst = 0;
    const orderItems = await Promise.all(items.map(async item => {
      let p;
      if (useDB) { p = await Product.findById(item.productId).lean(); if (p) p.id = p._id; }
      else { p = (readJson(FILES.products)).find(pr => pr.id === item.productId); }
      if (!p) throw new Error('Product not found');
      const gstAmt = (p.price * p.gstRate / 100) * item.quantity;
      subtotal += p.price * item.quantity; totalGst += gstAmt;
      return { productId: p.id || p._id, name: p.name, image: p.images[0], price: p.price, mrp: p.mrp, quantity: item.quantity, gstRate: p.gstRate, hsn: p.hsn, gstAmount: gstAmt, total: p.price * item.quantity };
    }));

    // Coupon discount
    const coupons = { 'FIRST10': { discount: 10, type: 'percent', minOrder: 199 }, 'SAVE50': { discount: 50, type: 'flat', minOrder: 499 }, 'LENCHO20': { discount: 20, type: 'percent', minOrder: 999 } };
    const coupon = coupons[couponCode?.toUpperCase()];
    let couponDiscount = coupon ? (coupon.type === 'percent' ? Math.round(subtotal * coupon.discount / 100) : coupon.discount) : 0;
    // Global discount (admin set)
    let adminDiscount = globalDiscount > 0 ? Math.round(subtotal * globalDiscount / 100) : 0;
    const discount = couponDiscount + adminDiscount;
    const shipping = subtotal >= freeShipMin ? 0 : shipCharge;
    const grandTotal = subtotal + totalGst + shipping - discount;
    const orderId = 'LEN' + Date.now().toString().slice(-8).toUpperCase();

    const isCOD = paymentMethod === 'cod';
    const status = isCOD ? 'placed' : 'awaiting_payment';
    const timeline = isCOD 
      ? [{ status: 'placed', label: 'Order Placed', date: new Date(), done: true }]
      : [{ status: 'pending', label: 'Awaiting Payment', date: new Date(), done: true }];

    const orderData = { 
      id: orderId, userId: req.session.userId, userName: req.session.name, items: orderItems, 
      address, paymentMethod, subtotal, gstTotal: totalGst, shipping, discount, grandTotal, 
      couponCode: couponCode || null, status, timeline, 
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), createdAt: new Date() 
    };

    if (useDB) {
      await Order.create(orderData);
      if (isCOD) await Cart.findOneAndUpdate({ userId: req.session.userId }, { items: [] });
    } else {
      const orders = readJson(FILES.orders); orders.push(orderData); writeJson(FILES.orders, orders);
      if (isCOD) {
        const carts = readJson(FILES.carts); const ci = carts.findIndex(c => c.userId === req.session.userId);
        if (ci > -1) { carts[ci].items = []; writeJson(FILES.carts, carts); }
      }
    }
    res.json({ success: true, order: orderData });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders/my', requireAuth, async (req, res) => {
  try {
    if (useDB) {
      const orders = await Order.find({ userId: req.session.userId }).sort({ createdAt: -1 }).lean();
      return res.json(orders.map(o => ({ ...o, id: o.id || o._id })));
    }
    res.json(readJson(FILES.orders).filter(o => o.userId === req.session.userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders/track/:orderId', async (req, res) => {
  try {
    if (useDB) {
      const o = await Order.findOne({ id: req.params.orderId.toUpperCase() }).lean();
      if (!o) return res.status(404).json({ error: 'Order not found' });
      const { userId, userName, address, ...safe } = o;
      return res.json({ ...safe, id: o.id || o._id });
    }
    const o = readJson(FILES.orders).find(o => o.id === req.params.orderId.toUpperCase());
    if (!o) return res.status(404).json({ error: 'Order not found' });
    const { userId, userName, address, ...safe } = o;
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    if (useDB) {
      const o = await Order.findOne({ $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { id: req.params.id }] }).lean();
      if (!o || (o.userId.toString() !== req.session.userId && req.session.role !== 'admin')) return res.status(404).json({ error: 'Not found' });
      return res.json({ ...o, id: o.id || o._id });
    }
    const o = readJson(FILES.orders).find(o => o.id === req.params.id && (o.userId === req.session.userId || req.session.role === 'admin'));
    if (!o) return res.status(404).json({ error: 'Not found' });
    res.json(o);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders/:id/invoice', requireAuth, async (req, res) => {
  try {
    let order;
    if (useDB) {
      order = await Order.findOne({ $or: [{ id: req.params.id }, { _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }] }).lean();
    } else {
      order = readJson(FILES.orders).find(o => o.id === req.params.id);
    }
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const gstin = await getSetting('gstin', '27XXXXX1234X1ZX');
    const storeName = await getSetting('storeName', 'Lencho');
    const storeEmail = await getSetting('storeEmail', 'hello@lencho.in');
    const storePhone = await getSetting('storePhone', '+91 9876543210');
    const invoice = {
      invoiceNo: 'INV-' + (order.id || order._id),
      invoiceDate: new Date(order.createdAt).toLocaleDateString('en-IN'),
      seller: { name: storeName, gstin, address: 'Mumbai, Maharashtra - 400001', phone: storePhone, email: storeEmail },
      buyer: { name: order.userName, phone: '', address: order.address },
      items: order.items.map(item => {
        const cgst = item.gstRate / 2, sgst = item.gstRate / 2;
        const taxableValue = item.price * item.quantity;
        return { ...item, taxableValue, cgst, sgst, cgstAmt: taxableValue * cgst / 100, sgstAmt: taxableValue * sgst / 100 };
      }),
      subtotal: order.subtotal, totalCgst: order.gstTotal / 2, totalSgst: order.gstTotal / 2,
      totalGst: order.gstTotal, shipping: order.shipping, discount: order.discount,
      grandTotal: order.grandTotal, paymentMethod: order.paymentMethod, orderId: order.id || order._id
    };
    res.json(invoice);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── COUPON ───────────────────────────────────────────────────
app.post('/api/coupon/validate', (req, res) => {
  const { code, amount } = req.body;
  const coupons = { 'FIRST10': { discount: 10, type: 'percent', minOrder: 199 }, 'SAVE50': { discount: 50, type: 'flat', minOrder: 499 }, 'LENCHO20': { discount: 20, type: 'percent', minOrder: 999 } };
  const coupon = coupons[code?.toUpperCase()];
  if (!coupon) return res.status(400).json({ error: 'Invalid coupon code' });
  if (amount < coupon.minOrder) return res.status(400).json({ error: `Minimum order ₹${coupon.minOrder} required` });
  const discountAmt = coupon.type === 'percent' ? Math.round(amount * coupon.discount / 100) : coupon.discount;
  res.json({ valid: true, discountAmt, coupon });
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    if (useDB) {
      const [orders, users, products] = await Promise.all([Order.find().lean(), User.find({ role: 'user' }).lean(), Product.find().lean()]);
      const today = new Date().toDateString();
      const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
      const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
      return res.json({
        totalOrders: orders.length, totalRevenue: orders.reduce((s, o) => s + o.grandTotal, 0),
        todayOrders: todayOrders.length, todayRevenue: todayOrders.reduce((s, o) => s + o.grandTotal, 0),
        totalUsers: users.length, totalProducts: products.length,
        totalGstCollected: orders.reduce((s, o) => s + (o.gstTotal || 0), 0),
        statusCounts, recentOrders: orders.slice(-5).reverse()
      });
    }
    const orders = readJson(FILES.orders), users = readJson(FILES.users).filter(u => u.role !== 'admin'), products = readJson(FILES.products);
    const today = new Date().toDateString(), todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
    res.json({ totalOrders: orders.length, totalRevenue: orders.reduce((s, o) => s + o.grandTotal, 0), todayOrders: todayOrders.length, todayRevenue: todayOrders.reduce((s, o) => s + o.grandTotal, 0), totalUsers: users.length, totalProducts: products.length, totalGstCollected: orders.reduce((s, o) => s + (o.gstTotal || 0), 0), statusCounts, recentOrders: orders.slice(-5).reverse() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── INQUIRY ROUTES ───────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required' });
    
    if (useDB) await Inquiry.create({ name, email, message });
    else console.log('Contact Inquiry (Fallback):', { name, email, message });

    // Notify Admin via Email
    try {
      const host = await getSetting('smtpHost', 'smtp.gmail.com');
      const port = await getSetting('smtpPort', 465);
      const user = await getSetting('smtpUser', '');
      const pass = await getSetting('smtpPass', '');
      const storeEmail = await getSetting('storeEmail', 'rupanshsaini17@gmail.com');

      if (user && pass) {
        const transporter = nodemailer.createTransport({
          host, port: +port, secure: +port === 465,
          auth: { user, pass }
        });
        await transporter.sendMail({
          from: `"Lencho System" <${user}>`,
          to: storeEmail,
          subject: '🔔 New Customer Inquiry - Lencho India',
          html: `
            <div style="font-family:sans-serif;padding:2rem;border:1px solid #eee;border-radius:12px;">
              <h2 style="color:#c9748f;">New Message Recieved</h2>
              <p><b>From:</b> ${name} (${email})</p>
              <p><b>Message:</b></p>
              <div style="background:#f9f9f9;padding:1rem;border-radius:8px;">${message}</div>
              <p style="margin-top:1.5rem;"><a href="${req.headers.origin}/admin" style="color:#c9748f;font-weight:700;text-decoration:none;">View in Admin Panel →</a></p>
            </div>
          `
        });
      }
    } catch (err) { console.error('Inquiry Email Notify Error:', err.message); }

    res.json({ success: true, message: 'Inquiry received' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/inquiries', requireAdmin, async (req, res) => {
  try {
    const inquiries = useDB ? await Inquiry.find().sort({ createdAt: -1 }) : [];
    res.json(inquiries);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/inquiries/:id', requireAdmin, async (req, res) => {
  try {
    if (useDB) await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ADMIN TOOLS ──────────────────────────────────────────────
app.put('/api/admin/clear-data', requireAdmin, async (req, res) => {
  try {
    if (!useDB) return res.status(400).json({ error: 'Database not connected' });
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});
    await Inquiry.deleteMany({});
    res.json({ success: true, message: 'All test data cleared!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/orders/:id/label-branded', requireAdmin, async (req, res) => {
  try {
    if (!useDB) return res.status(400).json({ error: 'Database not connected' });
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const labelHTML = `
      <!DOCTYPE html><html><head><title>Label - ${order.id}</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; }
        .label-card { width: 100mm; height: 150mm; border: 2px solid #000; padding: 15px; background: #fff; position: relative; }
        .logo { font-size: 24px; font-weight: 800; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; }
        .section { margin-bottom: 12px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
        .label { font-size: 10px; text-transform: uppercase; color: #666; font-weight: 700; }
        .value { font-size: 14px; font-weight: 600; line-height: 1.4; }
        .barcode { text-align: center; margin-top: 20px; border: 2px solid #000; padding: 10px; font-weight: 800; }
      </style>
      </head><body>
      <div class="label-card">
        <div class="logo"><span>✦ LENCHO ✦</span><span>SHIPROCKET AWB</span></div>
        <div class="section"><div class="label">SHIP TO:</div><div class="value">${order.userName}<br/>${order.address}</div></div>
        <div class="section"><div class="label">ORDER ID:</div><div class="value">${order.id}</div></div>
        <div class="section"><div class="label">PAYMENT:</div><div class="value">${order.paymentMethod.toUpperCase()} (₹${order.grandTotal})</div></div>
        <div class="barcode">*${order.id}*<br/><small>AWB: ${order.awbCode || 'PENDING'}</small></div>
        <div style="position:absolute;bottom:15px;font-size:10px;">Lencho India - Luxury Redefined</div>
      </div>
      <script>window.onload = () => window.print();</script>
      </body></html>
    `;
    res.send(labelHTML);
  } catch (e) { res.status(500).send('Error'); }
});

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    if (useDB) { const o = await Order.find().sort({ createdAt: -1 }).lean(); return res.json(o.map(o => ({ ...o, id: o.id || o._id }))); }
    res.json(readJson(FILES.orders).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, deliveryPartner, trackingNumber } = req.body;
    const statusLabels = { placed: 'Order Placed', confirmed: 'Order Confirmed', shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
    const timelineEntry = { status, label: statusLabels[status] || status, date: new Date(), done: true };
    if (useDB) {
      const o = await Order.findOne({ $or: [{ id: req.params.id }, { _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }] });
      if (!o) return res.status(404).json({ error: 'Not found' });
      o.status = status;
      if (deliveryPartner) o.deliveryPartner = deliveryPartner;
      if (trackingNumber) o.trackingNumber = trackingNumber;
      if (!o.timeline.find(t => t.status === status)) o.timeline.push(timelineEntry);
      await o.save();
      return res.json({ success: true, order: { ...o.toObject(), id: o.id || o._id } });
    }
    const orders = readJson(FILES.orders), idx = orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    orders[idx].status = status;
    if (deliveryPartner) orders[idx].deliveryPartner = deliveryPartner;
    if (trackingNumber) orders[idx].trackingNumber = trackingNumber;
    if (!orders[idx].timeline?.find(t => t.status === status)) (orders[idx].timeline = orders[idx].timeline || []).push(timelineEntry);
    writeJson(FILES.orders, orders); res.json({ success: true, order: orders[idx] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    if (useDB) { const u = await User.find().select('-password').lean(); return res.json(u.map(u => ({ ...u, id: u._id }))); }
    res.json(readJson(FILES.users).map(({ password, ...u }) => u));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    if (useDB) { await User.findOneAndDelete({ _id: req.params.id, role: { $ne: 'admin' } }); return res.json({ success: true }); }
    const u = readJson(FILES.users).filter(u => u.id !== req.params.id || u.role === 'admin');
    writeJson(FILES.users, u); res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/gst-report', requireAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    let orders;
    if (useDB) {
      let q = {};
      if (month && year) q = { createdAt: { $gte: new Date(+year, +month - 1, 1), $lt: new Date(+year, +month, 1) } };
      orders = await Order.find(q).lean();
    } else {
      orders = readJson(FILES.orders);
      if (month && year) orders = orders.filter(o => { const d = new Date(o.createdAt); return d.getMonth() + 1 === +month && d.getFullYear() === +year; });
    }
    const report = orders.map(o => ({ orderId: o.id || o._id, date: new Date(o.createdAt).toLocaleDateString('en-IN'), customerName: o.userName, grandTotal: o.grandTotal, taxableAmount: o.subtotal, cgst: (o.gstTotal || 0) / 2, sgst: (o.gstTotal || 0) / 2, totalGst: o.gstTotal || 0, paymentMethod: o.paymentMethod }));
    const totals = report.reduce((acc, r) => ({ grandTotal: acc.grandTotal + r.grandTotal, taxableAmount: acc.taxableAmount + r.taxableAmount, cgst: acc.cgst + r.cgst, sgst: acc.sgst + r.sgst, totalGst: acc.totalGst + r.totalGst }), { grandTotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, totalGst: 0 });
    res.json({ report, totals, count: report.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/change-credentials', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword, name } = req.body;
    if (useDB) {
      const user = await User.findById(req.session.userId);
      if (!user || !await bcrypt.compare(currentPassword, user.password)) return res.status(400).json({ error: 'Current password is incorrect' });
      if (newEmail && newEmail !== user.email) { if (await User.findOne({ email: newEmail })) return res.status(400).json({ error: 'Email in use' }); user.email = newEmail; }
      if (name) user.name = name;
      if (newPassword && newPassword.length >= 6) user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      const { password, ...safe } = user.toObject();
      return res.json({ success: true, user: { id: user._id, ...safe } });
    }
    const users = readJson(FILES.users), idx = users.findIndex(u => u.id === req.session.userId);
    if (idx === -1 || !await bcrypt.compare(currentPassword, users[idx].password)) return res.status(400).json({ error: 'Current password galat hai' });
    if (newEmail) users[idx].email = newEmail;
    if (name) users[idx].name = name;
    if (newPassword && newPassword.length >= 6) users[idx].password = await bcrypt.hash(newPassword, 10);
    writeJson(FILES.users, users);
    const { password, ...safe } = users[idx];
    res.json({ success: true, user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── AI FEATURES ──────────────────────────────────────────────
app.get('/api/ai/recommendations', async (req, res) => {
  try {
    const { productId, category, limit = 6 } = req.query;
    let products;
    if (useDB) { products = (await Product.find().lean()).map(p => ({ ...p, id: p._id })); }
    else { products = readJson(FILES.products); }
    const source = products.find(p => p.id?.toString() === productId || p._id?.toString() === productId);
    let recommended = [];
    if (source) {
      recommended = products.filter(p => p.id?.toString() !== productId && p._id?.toString() !== productId)
        .map(p => ({ ...p, score: (p.category === source.category ? 40 : 0) + (p.price >= source.price * 0.5 && p.price <= source.price * 1.5 ? 30 : 0) + (p.rating >= 4 ? 20 : 0) + (p.featured ? 10 : 0) }))
        .sort((a, b) => b.score - a.score).slice(0, +limit);
    } else {
      recommended = products.filter(p => p.featured || p.rating >= 4).sort((a, b) => (b.rating * 10) - (a.rating * 10)).slice(0, +limit);
    }
    res.json(recommended);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ai/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);
    const query = q.toLowerCase().trim();
    if (useDB) {
      const products = await Product.find({ $or: [{ name: { $regex: query, $options: 'i' } }, { category: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }] }).limit(10).lean();
      return res.json(products.map(p => ({ ...p, id: p._id })));
    }
    const products = readJson(FILES.products);
    res.json(products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 10));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ai/trending', async (req, res) => {
  try {
    let products, orders;
    if (useDB) {
      products = (await Product.find().lean()).map(p => ({ ...p, id: p._id }));
      orders = await Order.find().lean();
    } else { products = readJson(FILES.products); orders = readJson(FILES.orders); }
    const orderCount = {};
    orders.forEach(o => o.items?.forEach(i => { orderCount[i.productId] = (orderCount[i.productId] || 0) + i.quantity; }));
    res.json(products.map(p => ({ ...p, _orders: orderCount[p.id?.toString()] || 0 })).sort((a, b) => (b._orders * 2 + b.rating * 10) - (a._orders * 2 + a.rating * 10)).slice(0, 8));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PAGE ROUTES ──────────────────────────────────────────────
const sendIndex = (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html'));
app.get('/', sendIndex);
app.get('/debug', (req, res) => {
  res.send(`
    <div style="font-family:sans-serif;padding:2rem;text-align:center;">
      <h1 style="color:#c9748f;">✦ Lencho V3 Live Debug ✦</h1>
      <p><b>Time:</b> ${new Date().toLocaleString('en-IN')}</p>
      <p><b>Status:</b> Code is Live and Syncing!</p>
      <hr style="width:50px;margin:2rem auto;border:1px solid #eee;"/>
      <button onclick="location.href='/'" style="padding:10px 20px;background:#c9748f;color:#fff;border:none;border-radius:5px;cursor:pointer;">Go to Home</button>
    </div>
  `);
});

['products', 'product', 'cart', 'checkout', 'orders', 'track', 'dashboard', 'admin', 'login', 'signup', 'wishlist']
  .forEach(page => { app.get(`/${page}`, sendIndex); app.get(`/${page}/:sub`, sendIndex); });
const PORT = process.env.PORT || 30054;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`\n🌟 Lencho API → Running on port ${PORT}`);
  console.log(`📌 Environment: ${NODE_ENV}`);
  console.log(`🔗 CORS: Enabled for ${NODE_ENV === 'production' ? 'Production' : 'Development'}`);
  console.log(`   Admin Panel → /admin`);
  console.log(`   MongoDB: ${useDB ? '✅ Connected' : '⚠️  Using JSON fallback'}\n`);
});