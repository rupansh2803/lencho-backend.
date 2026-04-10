# 🚀 LENCHO.IN DEPLOYMENT GUIDE

## PHASE 1: MONGODB ATLAS (Database)

### 1.1 Create MongoDB Account
- Go: https://account.mongodb.com/account/register
- Sign up (Gmail se kar)
- Free Tier select karo

### 1.2 Create Database Cluster
- "Create" button → "Free Cluster"
- Cloud Provider: AWS
- Region: ap-south-1 (Mumbai) ✅ [Fast for India]
- Cluster Name: lencho-cluster
- Create cluster (2-3 min wait)

### 1.3 Create Database User
1. Left menu → "Database Access"
2. "Add New Database User"
   - Username: `lencho_admin`
   - Password: `Strong@Password123` (copy kar lo!)
   - Built-in Role: Atlas admin
3. "Add User"

### 1.4 Add IP Whitelist
1. Left menu → "Network Access"
2. "Add IP Address"
   - Choose: "Allow access from anywhere" (0.0.0.0/0)
   - For production, Render/Netlify IPs add kar sakte ho baad mein
3. Confirm

### 1.5 Get Connection String
1. "Databases" → Click "Connect"
2. "Connect your application"
3. Driver: "Node.js", Version: "4.x or later"
4. Copy the connection string:
   ```
   mongodb+srv://lencho_admin:<password>@lencho-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with actual password ✅

---

## PHASE 2: BACKEND DEPLOYMENT (Render)

### 2.1 Prepare Backend Files
Make sure `server.js` has this port setup:
```javascript
const PORT = process.env.PORT || 30054;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
```

### 2.2 Create Render Account
- Go: https://render.com
- Sign up with GitHub
- Connect GitHub account (allow permissions)

### 2.3 Deploy Backend to Render
1. **New** → **Web Service**
2. **Connect Repository**: Select your website repo
3. **Configuration**:
   - **Name**: lencho-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Paid for always-on)
4. **Environment Variables** (Add these):
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://lencho_admin:Strong@Password123@lencho-cluster.xxxxx.mongodb.net/lencho-db?retryWrites=true&w=majority
   JWT_SECRET=lencho_super_secret_key_12345
   FAST2SMS_API_KEY=your_api_key_here (optional)
   ```
5. **Create Web Service**
6. **Wait for deploy** (5-10 min)
7. Get your backend URL: `https://lencho-backend.onrender.com`

---

## PHASE 3: FRONTEND DEPLOYMENT (Netlify)

### 3.1 Create Netlify Account
- Go: https://netlify.com
- Sign up with GitHub
- Connect repository

### 3.2 Deploy Frontend
1. **Add new site** → **Import an existing project**
2. **Choose GitHub repository**
3. **Configuration**:
   - **Build command**: `npm run build` (if available) OR leave empty
   - **Publish directory**: `public` ✅
   - **Team**: Your team
4. **Deploy site**
5. Get your Netlify URL: `https://lencho.netlify.app` (auto-generated)

### 3.3 Update Frontend API Calls
After backend URL is ready, update `public/js/app.js`:

**BEFORE** (local dev):
```javascript
const API_BASE = 'http://localhost:30054/api';
```

**AFTER** (production):
```javascript
const API_BASE = 'https://lencho-backend.onrender.com/api';
```

Then commit & push to GitHub → Netlify auto-redeploys! ✅

---

## PHASE 4: CONNECT DOMAIN (lencho.in)

### 4.1 Point Domain DNS to Netlify (Frontend)
1. My Netlify Site Settings → **Domain management**
2. **Add custom domain** → Type: `lencho.in`
3. Netlify will show nameserver details:
   ```
   dns1.p08.nsone.net
   dns2.p08.nsone.net
   dns3.p08.nsone.net
   dns4.p08.nsone.net
   ```
4. **Go to Domain Registrar** (GoDaddy, Hostinger, etc):
   - Find **Nameservers** settings
   - Replace with Netlify nameservers
   - Wait 24 hours (usually 30 min)

### 4.2 Point API Subdomain to Render (Backend)
1. **Render Dashboard** → Services → Select your backend
2. **Settings** → Copy service URL
3. **Domain Registrar** → Add CNAME record:
   ```
   Subdomain: api
   Type: CNAME
   Value: lencho-backend.onrender.com
   ```
4. Wait for DNS propagation (30 min - 24 hours)
5. **Update backend URL in frontend**:
   ```javascript
   const API_BASE = 'https://api.lencho.in/api';
   ```

---

## PHASE 5: ENVIRONMENT VARIABLES & SECURITY

### 5.1 Backend Environment (.env)
Create `.env` file in root:
```env
NODE_ENV=production
PORT=30054
MONGODB_URI=mongodb+srv://lencho_admin:Strong@Password123@lencho-cluster.xxxxx.mongodb.net/lencho-db
JWT_SECRET=lencho_super_secret_key_change_this_12345
SESSION_SECRET=lencho_session_secret_change_this
FAST2SMS_API_KEY=optional_sms_key
CORS_ORIGIN=https://lencho.in,https://www.lencho.in,https://api.lencho.in
```

### 5.2 Render Environment Variables
1. Render Dashboard → Backend service → **Environment**
2. Add all variables from `.env` (don't commit `.env` to Git!)

---

## FINAL CHECKLIST

- [ ] MongoDB Atlas cluster created & running
- [ ] Database user credentials saved
- [ ] Backend deployed to Render
- [ ] Render environment variables set
- [ ] Frontend API_BASE updated to Render URL
- [ ] Frontend deployed to Netlify
- [ ] Domain DNS nameservers updated
- [ ] SSL certificate activated (automatic on Netlify)
- [ ] Test live: https://lencho.in
- [ ] Test admin panel: https://lencho.in/admin
- [ ] Test API: https://api.lencho.in/api/products

---

## TESTING LIVE DEPLOYMENT

1. **Homepage**: https://lencho.in - Dekho load ho raha hai
2. **Products**: Click products, dekho featured items load ho rahi hain
3. **Admin**: https://lencho.in/admin - Login kar, orders dekho
4. **API Test**: 
   ```
   https://api.lencho.in/api/products?featured=true
   ```
   Should return JSON with products ✅

---

## TROUBLESHOOTING

| Issue | Fix |
|-------|-----|
| Backend 502 error | Check Render logs, environment variables |
| MongoDB connection failed | Verify connection string, IP whitelist |
| API calls failing | Check CORS settings in server.js |
| Domain not resolving | Wait 30 min, clear browser cache, check nameservers |
| Frontend showing old data | Hard refresh (Ctrl+Shift+R), clear cache |

---

## NEXT STEPS

After going live:
- Monitor error logs daily (Render → Logs)
- Add more products via admin panel
- Configure email notifications (later)
- Set up SSL/HTTPS monitoring
- Create daily backups of database

