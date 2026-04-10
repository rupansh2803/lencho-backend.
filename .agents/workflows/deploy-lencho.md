---
description: Complete workflow to deploy and maintain the Lencho premium e-commerce website (Frontend on Netlify + Backend on Render)
---

# Lencho Deployment & Maintenance Workflow

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          GitHub: rupansh2803/lencho-backend.     │
│  (Single repo: contains BOTH frontend + backend)│
└──────────┬──────────────────────┬───────────────┘
           │                      │
     ┌─────▼─────┐         ┌─────▼──────┐
     │  Netlify   │         │   Render   │
     │ (Frontend) │ ──API──▶│ (Backend)  │
     │ public/*   │         │ server.js  │
     └───────────┘         └────────────┘
```

---

## Step 1: Local Development

// turbo
```bash
npm run dev
```
- Server starts at `http://localhost:30054`
- Admin Panel at `/admin`
- MongoDB connects automatically via `.env` → `MONGODB_URI`

---

## Step 2: Make Code Changes

All source files are in `c:\Users\rupan\OneDrive\Desktop\website\WESBITE1\`:

| File | Purpose |
|------|---------|
| `server.js` | Backend API, auth, admin seeding, product routes |
| `public/index.html` | Main HTML shell (header, modals, footer) |
| `public/js/app.js` | Frontend SPA logic (hero, products, cart, auth) |
| `public/js/admin.js` | Admin panel logic |
| `public/css/style.css` | All styling (hero, cards, responsive) |
| `netlify.toml` | Netlify proxy config (routes `/api/*` to Render) |
| `render.yaml` | Render deployment config |
| `models.js` | Mongoose schemas (User, Product, Order, etc.) |

---

## Step 3: Push to GitHub

// turbo
```bash
git add .
git commit -m "Your commit message here"
git push origin main
```

This pushes to `rupansh2803/lencho-backend.` which triggers auto-deploy on both Netlify and Render.

---

## Step 4: Render (Backend) Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select service `lencho-backend`
3. Ensure **Connected Repository** = `rupansh2803/lencho-backend.`
4. Ensure **Branch** = `main`
5. Ensure **Build Command** = `npm install`
6. Ensure **Start Command** = `node server.js`
7. **Environment Variables** (set in Render Dashboard → Environment):

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://...` (your Atlas connection string) |
| `SESSION_SECRET` | Any random string |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render default) |
| `FAST2SMS_KEY` | *(optional, for SMS OTP)* |

8. Every `git push` to `main` triggers auto-deploy on Render.

---

## Step 5: Netlify (Frontend) Setup

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site
3. Go to **Site Configuration** → **Build & deploy** → **Repository**
4. Ensure **Connected Repository** = `rupansh2803/lencho-backend.`
5. Ensure **Branch** = `main`
6. Ensure **Publish directory** = `public`
7. Ensure **Build command** = *(leave empty, no build needed)*
8. The `netlify.toml` file handles API proxying:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://lencho-backend.onrender.com/api/:splat"
  status = 200
  force = true
```

> **IMPORTANT:** If your Render URL is different, update the `to` field above.

9. Every `git push` to `main` triggers auto-deploy on Netlify.

---

## Step 6: Verify Live Site

1. Open your Netlify URL in **Incognito/Private** browser window
2. Check:
   - [ ] Hero section loads with centered luxury design
   - [ ] Products load (not stuck on "Loading...")
   - [ ] Signup works without OTP
   - [ ] Admin login works at `/admin`

---

## Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | `Rupanshsini17@gmil.com` |
| **Password** | `Isha@1234@` |

These are force-synced on every server restart via `seedAdmin()` in `server.js`.

---

## Quick Reference: What Was Changed

### Authentication
- ❌ Removed OTP-based signup (no more SMS verification)
- ✅ Direct email + password signup
- ✅ Admin credentials force-updated on every boot

### Hero Section
- ✅ Centered layout (not left-aligned)
- ✅ Premium copy: "Eminence & Elegance / Exquisite Luxury"
- ✅ Luxury boutique background image
- ❌ Removed "Under ₹199" budget messaging

### UI/UX
- ✅ Product card hover image swap
- ✅ Trust bar (Free Delivery, COD, Authenticity)
- ✅ Product detail accordions (Tanishq-style)
- ✅ Cache-busting `v=4.0` on all assets

### Backend
- ✅ Robust async DB initialization (`initDB()`)
- ✅ Force admin credential sync on restart
- ✅ API proxy via `netlify.toml`

---

## Troubleshooting

### "Loading products..." stuck
- Check if MongoDB is connected (look for `✅ MongoDB Connected` in server logs)
- If using Netlify, verify `netlify.toml` proxy points to correct Render URL

### Admin login not working
- Restart the server — `seedAdmin()` force-updates credentials on every boot
- Ensure you're using exact email: `Rupanshsini17@gmil.com` and password: `Isha@1234@`

### Changes not showing on live site
- Hard refresh: `Ctrl + Shift + R`
- Check Netlify/Render deploy logs for errors
- Ensure `git push origin main` completed successfully

### Server crashes on startup
- Check `.env` file has valid `MONGODB_URI`
- Run `npm install` to ensure all dependencies are installed
