# 🚀 LENCHO DEPLOYMENT & MAINTENANCE CHECKLIST

> **Complete guide for deploying and maintaining your Lencho ecommerce platform**

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Code Review & Preparation
- [ ] All features tested locally (npm run dev)
- [ ] No console errors or warnings
- [ ] All dependencies installed (npm install)
- [ ] .env file created with all required variables
- [ ] .env.example file in repo (for team sharing)
- [ ] README.md complete and updated
- [ ] Code committed and pushed to GitHub

### 2. Database Setup
- [ ] MongoDB Atlas account created
- [ ] Database cluster provisioned
- [ ] Connection string tested
- [ ] Sample products added (minimum 10)
- [ ] Admin account created and tested
- [ ] Database backups enabled

### 3. Security Configuration
- [ ] SESSION_SECRET changed to random strong key
- [ ] MONGODB_URI updated to production DB
- [ ] NODE_ENV set to "production"
- [ ] Payment gateway keys configured (if using)
- [ ] CORS settings verified
- [ ] HTTPS enabled on both Netlify and Render

### 4. Payment Gateway Setup (if needed)
- [ ] Razorpay account created and keys added
- [ ] Test mode verified first
- [ ] Webhook endpoints configured
- [ ] Payment success/failure pages designed

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Deploy Backend (Render)

```bash
# 1. Go to https://render.com
# 2. Create New → Web Service
# 3. Connect GitHub repository: rupansh2803/lencho-backend
# 4. Fill in:
#    - Name: lencho-backend
#    - Root Directory: (leave empty)
#    - Runtime: Node
#    - Build Command: npm install
#    - Start Command: node server.js
#
# 5. Add Environment Variables:
#    MONGODB_URI = your_atlas_connection_string
#    SESSION_SECRET = random_secret_key
#    NODE_ENV = production
#    PORT = 10000
#    FAST2SMS_KEY = (if using SMS)
#
# 6. Click "Create Web Service"
# 7. Wait for deployment (usually 2-3 minutes)
# 8. Note down the URL (e.g., https://lencho-backend.onrender.com)
# 9. Test API endpoint: https://lencho-backend.onrender.com/api/settings/public
```

✅ **Backend deployed when:** API endpoint responds with settings data

### Step 2: Deploy Frontend (Netlify)

```bash
# 1. Go to https://netlify.com/drop
# OR connect GitHub:
#    - New Site → GitHub
#    - Select repository: rupansh2803/lencho-backend
#
# 2. Build Settings:
#    - Publish Directory: public
#    - Build Command: (leave empty - no build needed)
#
# 3. Environment Variables:
#    - REACT_APP_API_URL = https://lencho-backend.onrender.com
#
# 4. Deploy
# 5. Note URL (e.g., https://lencho-abc123.netlify.app)
```

✅ **Frontend deployed when:** Site loads in browser

### Step 3: Update API Proxy (netlify.toml)

```toml
[[redirects]]
  from = "/api/*"
  to = "https://lencho-backend.onrender.com/api/:splat"
  status = 200
  force = true
```

Then:
```bash
git add netlify.toml
git commit -m "Update Render backend URL for production"
git push origin main
```

### Step 4: Setup Custom Domain (Optional)

1. Buy domain (Namecheap, GoDaddy, etc.)
2. Point DNS to Netlify
3. Add to Netlify Site Settings → Domain Management
4. Enable SSL certificate (automatic)

---

## 🧪 POST-DEPLOYMENT VERIFICATION

### Test Everything

- [ ] **Homepage loads** – No errors, images visible
- [ ] **Products load** – Data from MongoDB shows correctly
- [ ] **Search/Filter works** – Categories filter products
- [ ] **Signup** – New user can create account
- [ ] **Login** – User can log in with credentials
- [ ] **Add to Cart** – Product added to cart
- [ ] **Checkout** – Can fill address and complete checkout
- [ ] **Admin Login** – Admin panel accessible at /admin
- [ ] **Admin Dashboard** – Stats and orders visible
- [ ] **Add Product** – Can add new product in admin
- [ ] **Hard Refresh** – Cache busting works (Ctrl+Shift+R)
- [ ] **Mobile** – Responsive design works on phone
- [ ] **Performance** – Page loads in <3 seconds
- [ ] **SEO** – Proper title/meta tags in HTML source

### Browser Console Check
```
- [ ] No red errors (only warnings are okay)
- [ ] Network tab shows /api/* requests to backend
- [ ] Cookies/Session storage working
```

---

## 📊 MONITORING & MAINTENANCE

### Daily (Every Day)
- [ ] Check for server errors in Render dashboard
- [ ] Monitor MongoDB usage (stay under free tier limits)
- [ ] Check Netlify deploy logs for failures
- [ ] Monitor site uptime (use Pingdom or UptimeRobot)

### Weekly (Every 7 Days)
- [ ] Review new orders in admin panel
- [ ] Check for failed payments
- [ ] Monitor social media inquiries
- [ ] Backup database (MongoDB Atlas auto-backup)
- [ ] Review analytics

### Monthly (Every 30 Days)
- [ ] Deep performance audit (Lighthouse score)
- [ ] Check for broken links
- [ ] Review and optimize slow pages
- [ ] Update product images/descriptions
- [ ] Test payment gateway
- [ ] Security audit (check for updates)
- [ ] Database maintenance

### Quarterly (Every 90 Days)
- [ ] Major feature updates
- [ ] Complete security review
- [ ] Dependency updates (npm audit, npm update)
- [ ] Database optimization
- [ ] Customer feedback review

---

## 🔧 TROUBLESHOOTING COMMON ISSUES

### Issue: Products not loading
```
1. Check Render backend is running (Dashboard → Logs)
2. Verify MONGODB_URI is correct
3. Check MongoDB Atlas network access allows all IPs
4. Test API: curl https://lencho-backend.onrender.com/api/products
```

### Issue: Admin login fails
```
1. Restart Render backend (Settings → Manual Restart)
2. Verify admin credentials in .env
3. Check server logs for database errors
```

### Issue: Checkout page errors
```
1. Verify /api/cart endpoint works
2. Check session management
3. Review browser console for CORS errors
4. Verify netlify.toml proxy is updated
```

### Issue: Images not loading
```
1. Verify image path in /public/images/
2. Check image URLs in product add form
3. Verify CDN/image optimization working
4. Check browser cache (Ctrl+Shift+R)
```

### Issue: Site down/slow
```
1. Check Render uptime status
2. Monitor MongoDB metrics
3. Check Netlify bandwidth usage
4. Review application logs
5. Contact hosting provider support
```

---

## 🆘 ROLLBACK PROCEDURE

If deployment breaks the site:

```bash
# 1. In GitHub, go to previous working commit
git log --oneline

# 2. Checkout previous version
git revert HEAD

# 3. Push to main
git push origin main

# 4. Netlify/Render will auto-redeploy
# 5. Monitor deployment logs

# 6. Once fixed, commit the fix properly
```

---

## 📈 SCALING & OPTIMIZATION

When you get 100+ orders/day:

### Database
- [ ] Migrate to paid MongoDB plan
- [ ] Enable automatic backups
- [ ] Setup read replicas for redundancy
- [ ] Monitor query performance

### Backend
- [ ] Upgrade Render plan if needed
- [ ] Implement caching (Redis)
- [ ] Optimize database queries
- [ ] Setup CDN for assets

### Frontend
- [ ] Enable Netlify caching headers
- [ ] Use image optimization service (Imgix)
- [ ] Setup Cloudflare for DDoS protection
- [ ] Implement service workers for offline support

---

## 💰 COST BREAKDOWN

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Netlify** | 100GB/month | $19/month+ |
| **Render** | $7-15/month | $25+/month |
| **MongoDB** | 512MB storage | $19/month |
| **Cloudflare** | Full features | $20/month |
| **Total** | ~$7-15/month | ~$60+/month |

> **Tip:** Start on free tiers, upgrade as you grow!

---

## 📞 GETTING HELP

### Platform Support
- **Render:** https://render.com/support
- **Netlify:** https://app.netlify.com/support
- **MongoDB:** https://docs.mongodb.com/support

### Community
- Stack Overflow: Tag `nodejs`, `mongodb`, `ecommerce`
- GitHub Issues: Check existing issues
- Forums: Dev.to, Hashnode

### Professional Help
- Hire developers from Upwork, Fiverr
- Consulting: Reach out for custom needs

---

## ✨ BEST PRACTICES

1. **Automate Everything** – Use GitHub Actions for automated testing
2. **Monitor Metrics** – Track uptime, errors, response times
3. **Document Changes** – Keep changelog of updates
4. **Version Control** – Use semantic versioning (v1.0.0)
5. **Security First** – Regular security audits
6. **User Feedback** – Listen to customer issues
7. **Performance** – Monitor Lighthouse score
8. **Backups** – Automatic and regular manual backups

---

## 🎯 SUCCESS METRICS

Monitor these KPIs:

| Metric | Target | How to Check |
|--------|--------|--------------|
| **Uptime** | 99.5%+ | Statuspage.io, UptimeRobot |
| **Page Load** | <3 seconds | Lighthouse, PageSpeed Insights |
| **Error Rate** | <0.5% | Render logs, Sentry.io |
| **Conversion Rate** | 2-5% | Admin dashboard |
| **Monthly Revenue** | +20% MoM | Order tracking |

---

## 🚀 QUICK COMMANDS

```bash
# Check logs in real-time
# Render Dashboard → Lencho Backend → Logs

# Check MongoDB
# MongoDB Atlas → Clusters → Lencho

# Trigger redeploy
# GitHub → New Commit OR Render → Manual Deploy

# Check site speed
# PageSpeed Insights (https://pagespeed.web.dev)

# Monitor uptime
# UptimeRobot (https://uptimerobot.com)
```

---

**Remember:** A well-maintained platform is a profitable platform! 💎

*Last Updated: April 2026*
