
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
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { User, Product, Order, Cart, Wishlist, Settings, OTPLog } = require('./models');

const app = express();
app.use(cors({ origin: '*', credentials: true }));

let useDB = false;
// ─── MONGODB ──────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lencho-db')
  .then(() => {
    useDB = true;
    console.log('✅ MongoDB Connected → DB: lencho-db');
    seedAdmin(); seedProducts(); seedSettings();
  })
  .catch((err) => {
    console.log('⚠️ MongoDB not connected. Using JSON fallback.', err.message);
    initFallback();
  });

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
async function seedAdmin() {
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    await User.create({
      name: 'Admin', email: 'admin@lencho.in',
      password: await bcrypt.hash('admin123', 10), role: 'admin',
      phone: process.env.ADMIN_PHONE || '9999999999', isVerified: true
    });
    console.log('✅ Admin created: admin@lenchoindia.com / admin123');
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
    ]);
    console.log('✅ Default settings seeded');
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


// ─── AUTH ROUTES ──────────────────────────────────────────────
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, phone, gender, otpCode } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    if (useDB) {
      if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already registered' });
      // Verify OTP if provided
      if (otpCode) {
        const rec = await OTPLog.findOne({ target: email, code: otpCode, used: false });
        if (!rec || rec.expiresAt < new Date()) return res.status(400).json({ error: 'Invalid or expired OTP. Please resend.' });
        await OTPLog.findByIdAndUpdate(rec._id, { used: true });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashed, phone: phone || '', gender: gender || 'female', isVerified: !!otpCode });
      req.session.userId = user._id.toString(); req.session.role = user.role; req.session.name = user.name;
      const { password: _, ...safe } = user.toObject();
      return res.json({ success: true, user: { id: safe._id, ...safe } });
    }
    // JSON fallback
    const users = readJson(FILES.users);
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), name, email, password: hashed, phone: phone || '', gender: gender || 'female', role: 'user', isVerified: !!otpCode, address: '', createdAt: new Date().toISOString() };
    users.push(user); writeJson(FILES.users, users);
    req.session.userId = user.id; req.session.role = user.role; req.session.name = user.name;
    return res.json({ success: true, user: { id: user.id, name, email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (useDB) {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: 'Invalid email or password' });
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
    const { name, phone, address, gender } = req.body;
    if (useDB) {
      const user = await User.findByIdAndUpdate(req.session.userId, { name, phone, address, gender }, { new: true }).select('-password');
      req.session.name = user.name;
      return res.json({ success: true, user: { id: user._id, ...user.toObject() } });
    }
    const users = readJson(FILES.users);
    const idx = users.findIndex(u => u.id === req.session.userId);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    if (name) users[idx].name = name; if (phone) users[idx].phone = phone;
    if (address) users[idx].address = address; if (gender) users[idx].gender = gender;
    writeJson(FILES.users, users);
    const { password, ...safe } = users[idx];
    res.json({ success: true, user: safe });
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
      const p = await Product.create({ name, category, price: +price, mrp: +mrp, discount: +(discount || 0), stock: +stock, description, images, gstRate: +(gstRate || 3), hsn: hsn || '7117', featured: featured === 'true' });
      return res.json({ success: true, product: { ...p.toObject(), id: p._id } });
    }
    const products = readJson(FILES.products);
    const p = { id: uuidv4(), name, category, price: +price, mrp: +mrp, discount: +(discount || 0), stock: +stock, description, images, gstRate: +(gstRate || 3), hsn: hsn || '7117', featured: featured === 'true', rating: 0, reviews: [], createdAt: new Date().toISOString() };
    products.push(p); writeJson(FILES.products, p); // bug fix
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

    const orderData = { id: orderId, userId: req.session.userId, userName: req.session.name, items: orderItems, address, paymentMethod, subtotal, gstTotal: totalGst, shipping, discount, grandTotal, couponCode: couponCode || null, status: 'placed', timeline: [{ status: 'placed', label: 'Order Placed', date: new Date(), done: true }], estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), createdAt: new Date() };

    if (useDB) {
      await Order.create(orderData);
      await Cart.findOneAndUpdate({ userId: req.session.userId }, { items: [] });
    } else {
      const orders = readJson(FILES.orders); orders.push(orderData); writeJson(FILES.orders, orders);
      const carts = readJson(FILES.carts); const ci = carts.findIndex(c => c.userId === req.session.userId);
      if (ci > -1) { carts[ci].items = []; writeJson(FILES.carts, carts); }
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
const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`\n🌟 Lencho API → http://localhost:${PORT}`);
  console.log(`   Admin Panel → /admin`);
  console.log(`   MongoDB: ${useDB ? '✅ Connected' : '⚠️  Using JSON fallback'}\n`);
});