# 🚀 LENCHO.IN – LIVE DEPLOYMENT CHECKLIST

**Estimated Time: 2-3 hours** ⏱️  
**Domain: lencho.in** 🌐

---

## PHASE 1: MONGODB ATLAS SETUP ✅ (15 min)

### Step 1.1: Create Account
- [ ] Go: https://account.mongodb.com/account/register
- [ ] Gmail se sign up karo
- [ ] Verify email

### Step 1.2: Create Cluster
- [ ] Dashboard → "Create" button
- [ ] Free Tier select karo
- [ ] Cloud Provider: **AWS**
- [ ] Region: **ap-south-1** (Mumbai - fast for India!)
- [ ] Cluster Name: `lencho-cluster`
- [ ] Create and wait 2-3 minutes

### Step 1.3: Database User (Credentials)
- [ ] Left sidebar → "Database Access"
- [ ] "Add New Database User"
- [ ] Username: `lencho_admin`
- [ ] Password: `Strong@Password123` (copy kar lo!)
- [ ] Built-in Role: "Atlas admin"
- [ ] Add User

### Step 1.4: IP Whitelist  
- [ ] Left sidebar → "Network Access"
- [ ] "Add IP Address"
- [ ] Select: **"Allow access from anywhere"** (0.0.0.0/0)
- [ ] Confirm

### Step 1.5: Get Connection String
- [ ] "Databases" → Click "Connect"
- [ ] "Connect your application"
- [ ] Driver: "Node.js" → "4.x or later"
- [ ] **Copy the entire connection string**
- [ ] Replace `<password>` with actual password

**Your MongoDB URI will look like:**
```
mongodb+srv://lencho_admin:Strong@Password123@lencho-cluster.xxxxx.mongodb.net/lencho-db?retryWrites=true&w=majority
```

---

## PHASE 2: BACKEND DEPLOYMENT TO RENDER ✅ (20 min)

### Step 2.1: Prepare Code
- [ ] Terminal: `git status` (all files synced?)
- [ ] Terminal: `git add .`
- [ ] Terminal: `git commit -m "Prepare for production deployment"`
- [ ] Terminal: `git push origin main`

### Step 2.2: Create Render Account
- [ ] Go: https://render.com
- [ ] Sign up with **GitHub**
- [ ] Authorize GitHub access

### Step 2.3: Deploy Backend
- [ ] Render Dashboard → **New** → **Web Service**
- [ ] **Connect Repository**: Select your website repo
- [ ] **Configuration**:
  - Name: `lencho-backend`
  - Environment: `Node`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Plan: Free (auto-pause after 15 min inactivity) or Paid (always-on)

### Step 2.4: Environment Variables (CRITICAL!)
**Add these in Render → Environment tab:**

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://lencho_admin:Strong@Password123@lencho-cluster.xxxxx.mongodb.net/lencho-db?retryWrites=true&w=majority
JWT_SECRET=your-strong-random-key-here
SESSION_SECRET=your-strong-random-key-here
CORS_ORIGIN=https://lencho.in,https://www.lencho.in,https://lencho.netlify.app,https://api.lencho.in
ADMIN_EMAIL=admin@lencho.in
ADMIN_PASSWORD=YourSecurePassword123
```

**Generate secure keys:**
```bash
# Terminal: Copy-paste this command
node -e "console.log('JWT:', require('crypto').randomBytes(32).toString('hex')); console.log('SESSION:', require('crypto').randomBytes(32).toString('hex'));"
```

- [ ] Copy JWT_SECRET and paste in Render
- [ ] Copy SESSION_SECRET and paste in Render

### Step 2.5: Deploy & Test
- [ ] Click **"Create Web Service"**
- [ ] Wait for deployment (5-10 minutes)
- [ ] Check **Logs** tab for: `✅ MongoDB Connected` and `✅ System Bootstrapped`
- [ ] Copy your Render URL: `https://lencho-backend.onrender.com`
- [ ] Test API: Open in browser: `https://lencho-backend.onrender.com/api/products`
- [ ] Should show JSON with products!

---

## PHASE 3: FRONTEND DEPLOYMENT TO NETLIFY ✅ (15 min)

### Step 3.1: Create Netlify Account
- [ ] Go: https://netlify.com
- [ ] Sign up with **GitHub**
- [ ] Authorize GitHub

### Step 3.2: Deploy Frontend
- [ ] Netlify Dashboard → **Add new site** → **Import an existing project**
- [ ] **Pick a Repository**: Select your website repo
- [ ] **Build Settings**:
  - Build command: (leave empty)
  - Publish directory: `public`
- [ ] Deploy → Wait 2-3 minutes
- [ ] Get your Netlify URL: `https://lencho.netlify.app` (auto-generated)

### Step 3.3: Test Frontend
- [ ] Open: `https://lencho.netlify.app`
- [ ] Homepage loads?
- [ ] Click "Products" - loads from Render API?
- [ ] Add item to cart - works?
- [ ] Login/OTP - works?

---

## PHASE 4: DOMAIN SETUP (LENCHO.IN) ✅ (Variables, may take 24 hours for DNS)

### Step 4.1: Connect Frontend (Netlify)
1. **Netlify Site Settings**:
   - [ ] Go to your Netlify site → **Settings**
   - [ ] **Domain management** → **Add custom domain**
   - [ ] Enter: `lencho.in`
   - [ ] Netlify will show 4 nameservers

2. **Domain Registrar** (Where you bought lencho.in):
   - [ ] Go to your registrar (GoDaddy, Hostinger, Namecheap, etc)
   - [ ] Find **Nameservers** settings
   - [ ] Replace with Netlify nameservers:
     ```
     dns1.p08.nsone.net
     dns2.p08.nsone.net
     dns3.p08.nsone.net
     dns4.p08.nsone.net
     ```
   - [ ] Save
   - [ ] **Wait 30 min - 24 hours** (propagation)

3. **Verify**:
   - [ ] Browser: `https://lencho.in` → Should load your frontend!

### Step 4.2: Connect Backend (API Subdomain)
1. **Domain Registrar** → Add DNS record:
   - [ ] Type: **CNAME**
   - [ ] Name: `api`
   - [ ] Value: `lencho-backend.onrender.com`
   - [ ] Save
   - [ ] **Wait 30 min**

2. **Update Frontend** (if using api.lencho.in):
   - Edit `public/js/app.js`:
   ```javascript
   // Change from relative paths to absolute:
   // const API_BASE = '/api'; // ← This still works!
   // OR
   const API_BASE = 'https://api.lencho.in/api';
   ```
   - [ ] Commit & push → Netlify auto-redeploys

---

## PHASE 5: FINAL TESTING ✅ (10 min)

| Test | URL | Expected |
|------|-----|----------|
| Homepage | `https://lencho.in` | Beautiful homepage with featured products |
| Products | `https://lencho.in/products` | All products load with images |
| Product Detail | Click a product | Details, reviews, shipping info show |
| Cart | Add 2 items to cart | Cart count updates |
| Checkout | Click checkout | Checkout form loads |
| Admin | `https://lencho.in/admin` | Admin login form |
| Admin Dashboard | Login with admin credentials | Dashboard stats load |
| GST Report | Click GST Report tab | Orders table with state, CGST, SGST |
| Download CSV | Click "Download CSV" | CSV file downloads with all orders |
| Settings | Click Settings tab | Shipping, GST, Contact forms appear |
| API Test | `https://api.lencho.in/api/products?featured=true` | JSON response with products |

---

## TROUBLESHOOTING 🔧

### Backend won't deploy / showing error 502
- [ ] Check Render Logs for MongoDB connection error
- [ ] Verify MONGODB_URI in environment variables
- [ ] Check MongoDB Atlas IP whitelist (should be 0.0.0.0/0)
- [ ] Verify database user credentials

### Frontend showing "API call failed"
- [ ] Check browser console (F12 → Console tab)
- [ ] Verify API_BASE URL in app.js is correct
- [ ] Check CORS settings in server.js (should include your domain)
- [ ] Test API directly: `https://api.lencho.in/api/me`

### Domain not working (still shows old site)
- [ ] DNS hasn't propagated yet (wait 30 min - 24 hours)
- [ ] Check DNS propagation: https://www.whatsmydns.net/?type=NS&domain=lencho.in
- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Try in incognito/private window

### MongoDB getting throttled / slow
- [ ] Free tier has limits
- [ ] Upgrade to Paid tier for better performance
- [ ] Add database indexes for frequently queried fields

---

## NEXT STEPS (After Going Live)

1. **Monitor**:
   - Check Render logs daily
   - Monitor database usage (MongoDB)
   - Check error rates

2. **Add More Products**:
   - Login to admin
   - Add 50+ products to inventory
   - Add product images

3. **Business Setup**:
   - Admin → Settings → Configure store details
   - Add WhatsApp number
   - Set shipping costs for your regions

4. **Advanced Features** (Coming Soon):
   - Email confirmations (SendGrid)
   - SMS notifications (Fast2SMS)
   - Payment gateway (Razorpay)
   - Analytics (Google Analytics)

---

## IMPORTANT NOTES

⚠️ **Security**:
- Never share `.env` file credentials
- Change ADMIN_PASSWORD immediately
- Enable 2FA on MongoDB Atlas
- Regularly backup database

📧 **Support**:
- Render Issues: Check logs → Help tab
- Netlify Issues: Check Deploy logs → Help center
- MongoDB Issues: Check Alerts → Forums

💾 **Backup**:
- Render doesn't auto-backup code (it's on GitHub)
- Backup MongoDB regularly → Atlas backup tab

---

**Status: Ready for Production! 🎉**

All systems configured. Go live and start selling! 🚀

