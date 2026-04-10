# 🌟 LENCHO – Premium Artificial Jewellery Ecommerce Platform

> **Your Script. Your Brand. Your Success.** Complete turnkey ecommerce solution for artificial jewellery in India.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Installation & Setup](#installation--setup)
6. [Deployment Guide](#deployment-guide)
7. [Admin Panel Guide](#admin-panel-guide)
8. [Customization Guide](#customization-guide)
9. [Troubleshooting](#troubleshooting)
10. [Marketing & Growth](#marketing--growth)

---

## 🚀 Quick Start

### For Development (Local)
```bash
# 1. Install dependencies
npm install

# 2. Create .env file (see below)
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Open in browser
→ http://localhost:30054
→ Admin Panel: /admin
→ Use admin email: rupanshsaini17@gmail.com / Password: Isha@1234@
```

### For Production (Deploy Live)
See **[Deployment Guide](#deployment-guide)** section below.

---

## 🏗️ Architecture Overview

```
                      GitHub (Single Repo)
                      rupansh2803/lencho-backend
                             │
                  ┌──────────┴──────────┐
                  │                     │
              ┌───▼────┐          ┌────▼────┐
              │ Netlify│          │  Render │
              │Frontend│──API────▶│Backend  │
              │ (public)          │(server) │
              └────────┘          └────┬────┘
                  ▲                    │
                  │                    │
              HTML/CSS/JS        MongoDB/Data
                                (External)
```

**Key Points:**
- **Frontend:** Static files served by Netlify (`public/` folder)
- **Backend:** Node.js/Express API hosted on Render (`server.js`)
- **Database:** MongoDB Atlas (cloud) or local MongoDB
- **API Proxy:** Configured in `netlify.toml` for `/api/*` routes

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JS (No Framework) | Latest |
| **Backend** | Node.js, Express | v18+ |
| **Database** | MongoDB | v5+ |
| **Authentication** | bcryptjs (password), Sessions | Standard |
| **OTP/SMS** | Fast2SMS (optional for production) | API |
| **File Upload** | Multer | v1.x |
| **Deployment** | Netlify (Frontend), Render (Backend) | Current |
| **Styling** | CSS Grid/Flexbox, Premium Theme | Custom |

---

## ✨ Features (Current)

### Frontend Features ✅
- ✅ **Hero Section** – Premium centered design with urgency elements
- ✅ **Product Showcase** – Hover image swap, ratings, pricing
- ✅ **Shopping Cart** – Add/remove items, quantity adjustment
- ✅ **Wishlist** – Save favorite items for later
- ✅ **User Authentication** – Email/password signup & login
- ✅ **Order Checkout** – Address entry, multiple payment methods
- ✅ **Order Tracking** – Real-time status updates
- ✅ **User Dashboard** – Order history, profile management
- ✅ **Responsive Design** – Mobile-first optimization
- ✅ **Trust Elements** – Security badges, testimonials, social proof
- ✅ **SEO Optimized** – Meta tags, structured data
- ✅ **Chatbot Widget** – AI-powered customer support (in-app)
- ✅ **WhatsApp Integration** – Direct messaging button
- ✅ **Exit Popup** – Discount offer on page exit

### Admin Panel Features ✅
- ✅ **Dashboard** – Revenue, orders, customers, GST stats
- ✅ **Order Management** – Status updates, tracking, invoices
- ✅ **Product Management** – Add/edit/delete products with images
- ✅ **Inventory Tracking** – Auto stock management
- ✅ **Offer & Coupons** – Create discount codes
- ✅ **User Management** – View customer data
- ✅ **GST Reporting** – Tax compliance for India
- ✅ **Settings** – Store configuration, payment keys
- ✅ **Analytics** – Orders, revenue, conversion rates

---

## 📦 Installation & Setup

### 1. Prerequisites
```
- Node.js v18+
- MongoDB (local or Atlas cloud)
- Git
- Code Editor (VS Code recommended)
```

### 2. Clone & Setup
```bash
# Clone from GitHub
git clone https://github.com/rupansh2803/lencho-backend.git
cd lencho-backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lencho-db
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=development
PORT=30054
FAST2SMS_KEY=your-fast2sms-key-here
WHATSAPP_NUMBER=919999999999
EOF

# Start server
npm run dev
```

### 3. Environment Variables (.env)

| Variable | Example | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB connection string |
| `SESSION_SECRET` | `random_secret_123` | Session encryption key |
| `NODE_ENV` | `development` or `production` | Environment mode |
| `PORT` | `30054` | Server port |
| `FAST2SMS_KEY` | `xxxxx` | OTP SMS API key (optional) |
| `WHATSAPP_NUMBER` | `919999999999` | WhatsApp business number |

---

## 🚀 Deployment Guide

### Option A: Netlify (Frontend) + Render (Backend)

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial Lencho deployment"
git push origin main
```

#### Step 2: Setup Render Backend
1. Go to [render.com](https://render.com)
2. Create New → Web Service
3. Connect GitHub repository: `rupansh2803/lencho-backend`
4. Configure:
   - **Name:** lencho-backend
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

5. Set Environment Variables:
   ```
   MONGODB_URI = your_atlas_connection_string
   SESSION_SECRET = random_secret
   NODE_ENV = production
   PORT = 10000
   FAST2SMS_KEY = your_key
   ```

6. Deploy → Keep the URL (e.g., `https://lencho-backend.onrender.com`)

#### Step 3: Setup Netlify Frontend
1. Go to [netlify.com](https://netlify.com)
2. New Site → GitHub → Select repository
3. Build Settings:
   - **Publish Directory:** `public`
   - **Build Command:** (leave empty)
4. Deploy

#### Step 4: Update API Proxy
Edit `netlify.toml`:
```toml
[[redirects]]
  from = "/api/*"
  to = "https://lencho-backend.onrender.com/api/:splat"
  status = 200
  force = true
```

#### Step 5: Verify Live Site
```
✅ Homepage loads
✅ Products load from DB
✅ Admin login works
✅ Checkout process works
✅ /api/* routes respond correctly
```

---

### Option B: Traditional Hosting (VPS/cPanel)

1. **Upload files** via FTP to hosting
2. **Install Node.js** on server
3. **Run:** `npm install && node server.js`
4. **Use PM2** to keep server running:
   ```bash
   npm install -g pm2
   pm2 start server.js --name lencho
   pm2 startup
   pm2 save
   ```
5. **Setup reverse proxy** (Nginx)

---

## 🔐 Admin Panel Guide

### Login
- **URL:** `yoursite.com/admin`
- **Email:** `rupanshsaini17@gmail.com`
- **Password:** `Isha@1234@` (auto-synced on server restart)

### Dashboard Section
View key metrics:
- Total revenue
- Orders count
- Customers count
- Today's stats
- Recent orders

### Orders Management
- **View** all orders with details
- **Update** order status (placed → confirmed → shipped → delivered)
- **Set** delivery partner (Shiprocket, Delhivery, etc.)
- **Track** with tracking number
- **Download** invoice (PDF)

### Product Management
- **Add Product:**
  - Name, category, price/MRP, discount
  - Upload up to 5 images
  - Set stock level
  - Mark as featured
  
- **Edit Product:** Update prices, images, stock
- **Delete Product:** Remove from catalog
- **Bulk Actions:** (Can be added)

### Settings
- Store name & contact
- Payment gateway keys
- Shipping settings
- GST/Tax configuration

---

## 🎨 Customization Guide

### Changing Brand Colors
Edit `public/css/style.css` → `:root` variables:
```css
:root {
  --rose: #C96A8A;          /* Primary color */
  --gold: #C9954C;          /* Accent color */
  --dark: #18122B;          /* Dark background */
  /* ... etc */
}
```

### Changing Product Categories
Edit `public/js/app.js` → `renderProducts()` function:
```javascript
const ALL_CATS = [
  { val: 'earrings', label: 'Earrings' },
  { val: 'necklace', label: 'Necklace' },
  // Add your categories here
];
```

### Adding Payment Gateways
Edit `public/js/pages.js` → `renderCheckout()`:
- Add Razorpay/PayU/Instamojo options
- Token integration in `placeOrder()` function

### Updating Homepage Content
Edit `public/js/app.js` → `renderHome()` function:
- Change hero text
- Update product sections
- Modify testimonials

### Custom SMS/Email
Edit `server.js` → `sendSMSOTP()` / `sendEmailOTP()`:
```javascript
// Use Twilio, SendGrid, AWS SES, etc.
```

---

## 🐛 Troubleshooting

### 1. "Loading products..." stuck on homepage
**Problem:** MongoDB connection failed
**Solution:**
- Check `.env` → `MONGODB_URI` is correct
- Verify MongoDB Atlas network access (allow all IPs)
- Check server logs for connection error

### 2. Admin login not working
**Problem:** Admin account not seeded
**Solution:**
- Restart server → `seedAdmin()` auto-syncs credentials
- Check server log for: `✅ Admin credentials force-updated`

### 3. Checkout payment gateway error
**Problem:** Razorpay/PayU keys incorrect
**Solution:**
- Go to Admin → Settings
- Enter correct payment gateway keys
- Test in development first

### 4. Images not loading
**Problem:** Wrong image path
**Solution:**
- Images in `/public/images/` folder
- Update image names in:
  - `renderHome()` function
  - Product add form

### 5. CORS errors in console
**Problem:** API proxy not working
**Solution:**
- Verify `netlify.toml` is updated
- Check Render backend URL is live
- Clear browser cache

---

## 📈 Marketing & Growth

### Phase 1: Setup (Week 1)
- ✅ Domain name ready
- ✅ Branding finalized
- ✅ 20+ products added
- ✅ Payment methods tested

### Phase 2: Launch (Week 2-4)
- 📸 Create 30 Instagram reels
- 📍 Post to Meesho, Flipkart if applicable
- 📧 Email list buildup
- 🔗 Share with friends & family

### Phase 3: Scale (Month 2-3)
- 💰 Run Facebook/Google ads
- 📱 Influencer partnerships
- ⭐ Collect customer reviews
- 🎁 Loyalty program

### Quick Social Media Strategy
```
CONTENT PILLARS:
1. Product Showcases (40%)
   - Close-ups, modeling shots
   - Before/after styling

2. How-To (20%)
   - Pairing suggestions
   - Styling tips

3. User Generated (20%)
   - Customer photos
   - Testimonials

4. Promotional (20%)
   - Offers, discounts
   - Flash sales
```

### Email Marketing
- Use admin settings to collect emails
- Send weekly newsletters
- Abandoned cart recovery
- Cross-sell recommendations

### WhatsApp Campaign
- Integrate ChatBot widget
- Share catalogs via WhatsApp Business API
- OTP verification for orders

---

## 📱 Mobile Optimization

The site is **mobile-first responsive**. Test on:
- iPhone (14/15)
- Samsung Galaxy
- Tablets

### Performance Metrics
- **Lighthouse Score:** 85+
- **FCP (First Contentful Paint):** < 2s
- **LCP (Largest Contentful Paint):** < 3s
- **CLS (Cumulative Layout Shift):** < 0.1

### Improvements if needed:
1. **Image Optimization:** Use WebP format
2. **Lazy Loading:** Already implemented
3. **Code Splitting:** Preload critical CSS
4. **CDN:** Use Cloudflare for static assets

---

## 📊 SEO Checklist

- ✅ Meta titles & descriptions
- ✅ Heading hierarchy (H1, H2, H3)
- ✅ Image alt text
- ✅ Internal linking
- ✅ Mobile responsive
- ✅ Page speed optimized
- ✅ Structured data (JSON-LD)
- ✅ Sitemap & robots.txt
- ✅ Google Analytics
- ✅ Google Search Console

### Add to index.html:
```html
<link rel="canonical" href="https://yoursite.com"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
```

---

## 💡 Key Success Factors

1. **Product Quality:** Use HD images, accurate descriptions
2. **Trust:** Show reviews, ratings, guarantees
3. **Speed:** Fast load times (images optimized)
4. **Mobile:** 70% traffic will be mobile
5. **Customer Service:** Respond quickly to queries
6. **Consistency:** Regular updates & new products
7. **Marketing:** Social media is your main channel
8. **Analytics:** Track what works, double down on it

---

## 🔗 Useful Resources

| Resource | Link | Purpose |
|----------|------|---------|
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas | Database hosting |
| Render | https://render.com | Backend deployment |
| Netlify | https://netlify.com | Frontend deployment |
| GitHub | https://github.com | Version control |
| Imgix | https://www.imgix.com | Image optimization |
| Cloudflare | https://cloudflare.com | CDN & DNS |
| Stripe/Razorpay | https://razorpay.com | Payments |
| Shiprocket | https://shiprocket.in | Logistics |

---

## 📞 Support & Contact

For issues or features:
- 📧 Email: **lencho.official01@gmail.com**
- 📱 WhatsApp: **+91 7404217625**
- 🌐 Website: **Coming Soon**
- 📍 Address: 197 Sarakpur, Barara, Ambala, Haryana

---

## 📜 License & Terms

- **Platform:** Lencho India
- **Year:** 2026
- **GST:** 27XXXXX1234X1ZX

**Remember:** This platform is your business. Customize, explore, and make it your own!

---

## 🎯 Next Steps

1. ✅ Read this guide completely
2. ✅ Setup local development environment
3. ✅ Add your first 20 products
4. ✅ Configure payment gateway
5. ✅ Deploy to production (Netlify + Render)
6. ✅ Test end-to-end (signup → checkout → order)
7. ✅ Create social media presence
8. ✅ Drive first 100 customers
9. ✅ Scale based on data
10. ✅ Automate & optimize

---

**Made with ❤️ for Indian ecommerce entrepreneurs. Let's build Lencho into a 7-figure brand! 🚀**
