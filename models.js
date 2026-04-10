// ─── LENCHO INDIA — MONGODB MODELS ───────────────────────────
const mongoose = require('mongoose');

// ── USER ──────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  phone:     { type: String, default: '' },
  gender:    { type: String, enum: ['female','male','other','prefer-not'], default: 'female' },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['user','admin'], default: 'user' },
  address:   { type: String, default: '' },
  addresses: [{ label:String, line1:String, city:String, state:String, pin:String, phone:String }],
  isVerified:{ type: Boolean, default: false },
  otp:       { code: String, expiresAt: Date },
  profileImg:{ type: String, default: '' },
  language:  { type: String, default: 'en' },
  securityQuestion: { type: String, default: '' },
  securityAnswer:   { type: String, default: '' },
}, { timestamps: true });

// ── PRODUCT ───────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  category:   { type: String, required: true },
  price:      { type: Number, required: true },
  mrp:        { type: Number, required: true },
  discount:   { type: Number, default: 0 },
  stock:      { type: Number, default: 0 },
  description:{ type: String, default: '' },
  images:     [String],
  gstRate:    { type: Number, default: 18 }, // ✅ FIXED: 18% for jewelry (CGST 9% + SGST 9%)
  hsn:        { type: String, default: '7117' },
  featured:   { type: Boolean, default: false },
  rating:     { type: Number, default: 0 },
  reviews:    [{ userId:String, userName:String, rating:Number, comment:String, date:Date }],
}, { timestamps: true });

// ── ORDER ─────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  userId:     { type: String, required: true },
  userName:   { type: String, required: true },
  items:      [{ productId:String, name:String, image:String, price:Number, mrp:Number, quantity:Number, gstRate:Number, hsn:String, gstAmount:Number, total:Number }],
  address:    { type: String, required: true },
  paymentMethod: { type: String, required: true },
  subtotal:   Number, gstTotal:Number, shipping:Number, discount:Number, grandTotal:Number,
  couponCode: String,
  status:     { type: String, default: 'placed' },
  timeline:   [{ status:String, label:String, date:Date, done:Boolean }],
  
  // ── PAYMENT & LOGISTICS ──
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  shiprocketOrderId:    String,
  shiprocketShipmentId: String,
  awbCode:              String, // Tracking ID
  labelUrl:             String, // PDF URL
  
  deliveryPartner: String,
  trackingNumber:  String,
  estimatedDelivery: Date,
}, { timestamps: true });

// ── CART ──────────────────────────────────────────────────────
const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items:  [{ productId: String, quantity: Number }],
}, { timestamps: true });

// ── WISHLIST ──────────────────────────────────────────────────
const wishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items:  [String],
}, { timestamps: true });

// ── SETTINGS (admin-controlled) ───────────────────────────────
const settingsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  label: String,
}, { timestamps: true });

// ── OTP LOG ───────────────────────────────────────────────────
const otpSchema = new mongoose.Schema({
  target:    { type: String, required: true }, // email or phone
  code:      { type: String, required: true },
  type:      { type: String, default: 'signup' }, // signup | login | admin
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false },
}, { timestamps: true });

// Auto expire OTP docs after 10 min
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── TESTIMONIAL ───────────────────────────────────────────────
const testimonialSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  city:    { type: String, default: '' },
  rating:  { type: Number, default: 5 },
  comment: { type: String, required: true },
  approved:{ type: Boolean, default: true }, // Auto-approve by default for manual admin entries
}, { timestamps: true });

// ── CATEGORY (COLLECTION) ─────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  slug:        { type: String, required: true, unique: true },
  image:       { type: String, default: '' },
  description: { type: String, default: '' },
  displayOrder:{ type: Number, default: 0 },
}, { timestamps: true });

// ── INQUIRY (CONTACT FORM) ────────────────────────────────────
const inquirySchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  message: { type: String, required: true },
  status:  { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
}, { timestamps: true });

module.exports = {
  User:     mongoose.model('User',     userSchema),
  Category: mongoose.model('Category', categorySchema),
  Product:  mongoose.model('Product',  productSchema),
  Order:    mongoose.model('Order',    orderSchema),
  Cart:     mongoose.model('Cart',     cartSchema),
  Wishlist: mongoose.model('Wishlist', wishlistSchema),
  Settings: mongoose.model('Settings', settingsSchema),
  OTPLog:   mongoose.model('OTPLog',   otpSchema),
  Testimonial: mongoose.model('Testimonial', testimonialSchema),
  Inquiry:  mongoose.model('Inquiry',  inquirySchema),
};
