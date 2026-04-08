/* ── LENCHO – MAIN APP ─────────────────────────────── */
let currentUser = null;
let cartCount = 0;

// ── ROUTER ────────────────────────────────────────────────
async function navigate(path, pushState = true) {
  if (pushState) history.pushState({}, '', path);
  const app = document.getElementById('app');
  const footer = document.getElementById('site-footer');
  const header = document.getElementById('site-header');
  app.innerHTML = '<div style="min-height:60vh;display:flex;align-items:center;justify-content:center;"><div class="loader-logo" style="color:var(--rose);font-size:1.5rem;">✦</div></div>';
  const [route, query] = path.split('?');
  const params = new URLSearchParams(query || '');
  footer.style.display = '';
  header.style.display = '';
  app.style.paddingTop = '72px';  // Ensure everything avoids header overlap

  try {
    if (route === '/' || route === '') { app.style.paddingTop = '0'; renderHome(); }
    else if (route === '/products') { renderProducts(params); }
    else if (route.startsWith('/product/')) { renderProductDetail(route.split('/product/')[1]); }
    else if (route === '/cart') { renderCart(); }
    else if (route === '/checkout') { renderCheckout(); }
    else if (route === '/track') { renderTrack(); }
    else if (route === '/contact') { renderContact(); }
    else if (route === '/dashboard') { app.style.paddingTop = '0'; renderDashboard(); }
    else if (route === '/wishlist') { renderWishlist(); }
    else if (route === '/admin') {
      footer.style.display = 'none';
      header.style.display = 'none';
      app.style.paddingTop = '0';
      renderAdmin();
    }
    else { app.innerHTML = `<div class="page-wrap" style="text-align:center;padding-top:120px;"><div class="empty-icon">🔍</div><h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;">Page Not Found</h2><p style="color:var(--gray);margin:1rem 0 2rem;">The page you're looking for doesn't exist.</p><button class="btn-primary" onclick="navigate('/')">Go Home</button></div>`; }
  } catch (e) { console.error(e); }
  window.scrollTo(0, 0);
  initScrollReveal();
}

window.addEventListener('popstate', () => navigate(location.pathname + location.search, false));

// ── API HELPER ────────────────────────────────────────────
async function api(url, opts = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  return res.json();
}
// ── TOAST ─────────────────────────────────────────────────
function toast(msg, type = 'info', dur = 3000) {
  const icons = { success: '✓', error: '✕', info: '✦', cart: '🛍️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type] || '✦'}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, dur);
}

// ── AUTH ──────────────────────────────────────────────────
async function loadUser() {
  const r = await api('/api/me');
  currentUser = r.user;
  updateHeader();
}

function updateHeader() {
  const btn = document.getElementById('header-user-btn');
  if (currentUser) {
    btn.innerHTML = `<i class="fas fa-user-check"></i>`;
    btn.style.color = 'var(--rose)';
  } else {
    btn.innerHTML = `<i class="fas fa-user"></i>`;
    btn.style.color = '';
  }
}

function handleUserClick() {
  if (currentUser) {
    if (currentUser.role === 'admin') navigate('/admin');
    else navigate('/dashboard');
  } else {
    openAuthModal();
  }
}

function openAuthModal() {
  document.getElementById('auth-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
  document.body.style.overflow = '';
}
function switchToSignup() {
  document.getElementById('auth-login-form').style.display = 'none';
  document.getElementById('auth-signup-form').style.display = 'block';
}
function switchToLogin() {
  document.getElementById('auth-signup-form').style.display = 'none';
  document.getElementById('auth-login-form').style.display = 'block';
}

async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  err.textContent = '';
  const r = await api('/api/login', { method: 'POST', body: { email, password } });
  if (r.error) { err.textContent = r.error; return; }
  currentUser = r.user;
  updateHeader();
  closeAuthModal();
  toast('Welcome back, ' + r.user.name + '! ✦', 'success');
  updateCartCount();
  if (r.user.role === 'admin') navigate('/admin');
}

async function sendSignupOTP(resend = false) {
  const phone = document.getElementById('signup-phone')?.value?.trim();
  const err = document.getElementById('signup-error');
  if (!phone || phone.length < 10) { err.textContent = 'Please enter valid 10-digit mobile number first'; return; }
  const btn = document.getElementById('send-otp-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
  const r = await api('/api/otp/send', { method: 'POST', body: { phone } });
  if (btn) { btn.disabled = false; btn.textContent = resend ? '✓ Resent' : '✓ OTP Sent'; btn.style.color = 'var(--rose)'; }
  if (r.error) { err.textContent = r.error; if (btn) { btn.disabled = false; btn.textContent = 'Send OTP'; } return; }
  document.getElementById('otp-field').style.display = 'block';
  toast(r.message, 'success');
  // If in dev mode, show the SMS on screen as a helper
  if (r.via === 'dev') {
    setTimeout(() => {
      alert(`[VIRTUAL SMS] Your Lencho verification code is: ${r.devOtp}. Enter this to verify.`);
    }, 1000);
  }
}

async function handleSignup() {
  const name = document.getElementById('signup-name')?.value?.trim();
  const phone = document.getElementById('signup-phone')?.value?.trim();
  const email = document.getElementById('signup-email')?.value?.trim();
  const gender = document.getElementById('signup-gender')?.value || 'female';
  const otp = document.getElementById('signup-otp')?.value?.trim();
  const password = document.getElementById('signup-password')?.value;
  const confirm = document.getElementById('signup-confirm')?.value;
  const err = document.getElementById('signup-error');
  err.textContent = '';
  if (!name) { err.textContent = 'Please enter your name'; return; }
  if (!phone || phone.length < 10) { err.textContent = 'Please enter valid mobile number'; return; }
  if (!email) { err.textContent = 'Please enter your email'; return; }
  if (!password) { err.textContent = 'Please enter a password'; return; }
  if (password.length < 6) { err.textContent = 'Password must be at least 6 characters'; return; }
  if (password !== confirm) { err.textContent = '❌ Passwords do not match!'; return; }
  const btn = document.getElementById('signup-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating Account...'; }
  const r = await api('/api/signup', { method: 'POST', body: { name, email, phone, gender, password, otpCode: otp } });
  if (btn) { btn.disabled = false; btn.textContent = 'Create Account ✦'; }
  if (r.error) { err.textContent = r.error; return; }
  currentUser = r.user;
  updateHeader();
  closeAuthModal();
  toast('🎉 Welcome to Lencho! Account created successfully!', 'success');
  updateCartCount();
}

function toggleDesc(btn) {
  const p = btn.previousElementSibling;
  if(p.classList.contains('desc-collapsed')) {
    p.classList.remove('desc-collapsed');
    btn.textContent = 'See Less';
  } else {
    p.classList.add('desc-collapsed');
    btn.textContent = 'See More';
  }
}


function toggleSpec(el) {
  const item = el.closest('.spec-item');
  const isActive = item.classList.contains('active');
  document.querySelectorAll('.spec-item').forEach(i => i.classList.remove('active'));
  if (!isActive) item.classList.add('active');
}

async function handleLogout() {
  await api('/api/logout', { method: 'POST' });
  currentUser = null;
  updateHeader();
  cartCount = 0;
  document.getElementById('cart-count').textContent = '0';
  toast('Logged out successfully', 'info');
  navigate('/');
}

// ── CART COUNT ────────────────────────────────────────────
async function updateCartCount() {
  if (!currentUser) { document.getElementById('cart-count').textContent = '0'; return; }
  const r = await api('/api/cart');
  cartCount = r.count || 0;
  document.getElementById('cart-count').textContent = cartCount;
}

async function addToCart(productId, showToast = true) {
  if (!currentUser) { openAuthModal(); return; }
  const r = await api('/api/cart/add', { method: 'POST', body: { productId, quantity: 1 } });
  if (r.error) { toast(r.error, 'error'); return; }
  cartCount = r.count;
  document.getElementById('cart-count').textContent = cartCount;
  if (showToast) toast('Added to cart! 🛍️', 'cart');
}

async function toggleWishlist(productId, btn) {
  if (!currentUser) { openAuthModal(); return; }
  const r = await api('/api/wishlist/toggle', { method: 'POST', body: { productId } });
  if (r.added) { btn.classList.add('active'); toast('Added to wishlist ❤️', 'success'); }
  else { btn.classList.remove('active'); toast('Removed from wishlist', 'info'); }
}

// ── DISCOUNT POPUP ────────────────────────────────────────
function closePopup() {
  document.getElementById('discount-popup').style.display = 'none';
  document.body.style.overflow = '';
  sessionStorage.setItem('popupShown', '1');
}
async function claimDiscount() {
  const email = document.getElementById('popup-email').value;
  if (!email) { toast('Please enter your email', 'error'); return; }
  const btn = document.querySelector('.popup-form .btn-primary');
  btn.textContent = 'Claiming...'; btn.disabled = true;
  const r = await api('/api/discount/email', { method: 'POST', body: { email } });
  if (r.error) { toast(r.error, 'error'); btn.textContent = 'Claim My Discount 🎁'; btn.disabled = false; return; }
  document.getElementById('popup-result').innerHTML = `🎉 Thank you! Your code: <strong style="color:var(--rose-dark);font-size:1.1rem">WELCOME10</strong> — 10% OFF applied!`;
  setTimeout(closePopup, 4000);
}

// ── HEADER SCROLL ─────────────────────────────────────────
function initHeader() {
  const h = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    h.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
  document.getElementById('hamburger-btn').addEventListener('click', () => {
    document.getElementById('main-nav').classList.add('open');
  });
  document.getElementById('nav-close-btn').addEventListener('click', () => {
    document.getElementById('main-nav').classList.remove('open');
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => document.getElementById('main-nav').classList.remove('open'));
  });
}

// ── SCROLL REVEAL ─────────────────────────────────────────
function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => obs.observe(el));
}

// ── STARS HELPER ─────────────────────────────────────────
function renderStars(rating) {
  const full = Math.floor(rating), half = rating % 1 >= 0.5;
  let s = '';
  for (let i = 0; i < full; i++) s += '<i class="fas fa-star"></i>';
  if (half) s += '<i class="fas fa-star-half-alt"></i>';
  for (let i = Math.ceil(rating); i < 5; i++) s += '<i class="far fa-star"></i>';
  return s;
}

function formatCurrency(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

// ── PRODUCT CARD ─────────────────────────────────────────
function productCardHTML(p) {
  const secondaryImg = p.images[1] || p.images[0];
  return `
  <div class="product-card reveal">
    <div class="product-img-wrap" onclick="navigate('/product/${p.id}')">
      <img class="product-img" src="${p.images[0]}" alt="${p.name}" loading="lazy"/>
      <img class="product-img img-hover" src="${secondaryImg}" alt="${p.name}" loading="lazy"/>
      ${p.discount ? `<span class="product-badge">${p.discount}% OFF</span>` : ''}
      <button class="product-wish" onclick="event.stopPropagation(); toggleWishlist('${p.id}',this)" title="Wishlist"><i class="fas fa-heart"></i></button>
    </div>
    <div class="product-body">
      <div class="product-name" onclick="navigate('/product/${p.id}')">${p.name}</div>
      <div class="product-rating">
        <span class="stars">${renderStars(p.rating || 0)}</span>
        ${p.reviews?.length ? `<span class="rating-count">(${p.reviews.length})</span>` : ''}
      </div>
      <div class="product-price">
        <span class="price-current">${formatCurrency(p.price)}</span>
        ${p.mrp ? `<span class="price-mrp">${formatCurrency(p.mrp)}</span>` : ''}
        ${p.discount ? `<span class="price-off">${p.discount}% off</span>` : ''}
      </div>
      <div class="product-actions" style="margin-top:.75rem;">
        <button class="btn-primary btn-sm" onclick="addToCart('${p.id}')" style="flex:1;">
          <i class="fas fa-shopping-bag"></i> Add to Cart
        </button>
      </div>
    </div>
  </div>`;
}

// ── HOME PAGE ─────────────────────────────────────────────
async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = `
  <!-- HERO PREMIUM -->
  <section class="hero-premium">
    <div class="hero-p-left reveal-left">
      <div class="hero-badge" style="color:var(--gold-light);background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);padding:8px 20px;border-radius:99px;display:inline-block;margin-bottom:1.5rem;letter-spacing:.15em;font-size:.8rem;">✦ ESTABLISHED 2026 ✦</div>
      <h1 class="hero-p-title">Luxury Look<br/><span>Under ₹199</span></h1>
      <p class="hero-p-sub">Dazzle in premium artificial jewellery crafted for the modern, elegant woman. High quality, zero tarnish, maximum style.</p>
      <div class="hero-btns">
        <button class="btn-gold" style="padding:16px 40px;font-size:1rem;" onclick="navigate('/products')">Shop Best Sellers <i class="fas fa-arrow-right"></i></button>
      </div>
    </div>
    <div class="hero-p-right reveal">
      <img class="hero-p-img" src="/images/hero_model.png" alt="Lencho Luxury Collection"/>
    </div>
  </section>

  <!-- TRUST HUB -->
  <div class="trust-hub">
    <div class="trust-item"><i class="fas fa-truck-fast"></i> <span>Free Delivery</span></div>
    <div class="trust-item"><i class="fas fa-wallet"></i> <span>Cash on Delivery</span></div>
    <div class="trust-item"><i class="fas fa-rotate-left"></i> <span>Easy 7-Day Returns</span></div>
    <div class="trust-item"><i class="fas fa-shield-check"></i> <span>100% Authentic</span></div>
  </div>

  <!-- MARQUEE -->
  <div class="marquee-strip">
    <div class="marquee-inner">
      ${Array(8).fill('✦ BUY 2 GET 1 FREE – USE CODE: B2G1 &nbsp;&nbsp; ✦ PRE-BOOK FOR AKSHAYA TRITIYA &nbsp;&nbsp; ✦ FLAT 50% OFF ON BRIDAL SETS &nbsp;&nbsp;').join('')}
    </div>
  </div>

  <!-- CATEGORIES -->
  <section class="categories">
    <div class="section-header reveal">
      <div class="section-eyebrow">Shop by Category</div>
      <h2 class="section-title">Exclusive Collections</h2>
      <div class="divider"></div>
      <p class="section-desc">Handpicked designs that define elegance and sophistication</p>
    </div>
    <div class="categories-grid">
      <div class="cat-card reveal-left" onclick="navigate('/products?category=earrings')">
        <img class="cat-img" src="/images/earrings.png" alt="Earrings" onerror="this.src='/images/hero.png'"/>
        <div class="cat-overlay"></div>
        <div class="cat-content"><div class="cat-name">Earrings</div><button class="cat-btn">Shop Now</button></div>
      </div>
      <div class="cat-card reveal" onclick="navigate('/products?category=necklace')">
        <img class="cat-img" src="/images/necklace.png" alt="Necklace" onerror="this.src='/images/hero.png'"/>
        <div class="cat-overlay"></div>
        <div class="cat-content"><div class="cat-name">Necklace</div><button class="cat-btn">Shop Now</button></div>
      </div>
      <div class="cat-card reveal-right" onclick="navigate('/products?category=toe-rings')">
        <img class="cat-img" src="/images/toe-rings.png" alt="Toe Rings" onerror="this.src='/images/hero.png'"/>
        <div class="cat-overlay"></div>
        <div class="cat-content"><div class="cat-name">Toe Rings</div><button class="cat-btn">Shop Now</button></div>
      </div>
      <div class="cat-card reveal-right" onclick="navigate('/products?category=payal')" style="animation-delay:.2s">
        <img class="cat-img" src="/images/payal.png" alt="Payal" onerror="this.src='/images/hero.png'"/>
        <div class="cat-overlay"></div>
        <div class="cat-content"><div class="cat-name">Payal</div><button class="cat-btn">Shop Now</button></div>
      </div>
    </div>
  </section>

  <!-- FEATURED PRODUCTS -->
  <section style="background:var(--beige);">
    <div class="section-header reveal">
      <div class="section-eyebrow">Bestsellers</div>
      <h2 class="section-title">🔥 Trending Now</h2>
      <div class="divider"></div>
    </div>
    <div class="products-grid" id="featured-grid"></div>
    <div style="text-align:center;margin-top:3rem;"><button class="btn-outline" onclick="navigate('/products')">View All Collections <i class="fas fa-arrow-right"></i></button></div>
  </section>

  <!-- VIDEO STORY -->
  <section class="video-section reveal">
    <div class="video-container" style="background:#000; overflow:hidden; position:relative; min-height:500px; border-radius:32px; box-shadow:0 30px 60px rgba(0,0,0,0.4);">
      <video autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0; opacity:0.8;">
        <source src="https://assets.mixkit.co/videos/preview/mixkit-diamond-ring-and-accessories-close-up-34988-large.mp4" type="video/mp4">
      </video>
      <div style="position:relative;z-index:2;height:100%;min-height:500px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);">
        <div style="text-align:center;">
          <h2 style="font-family:'Playfair Display',serif;font-size:3.5rem;color:#fff;margin-bottom:1rem;text-shadow:0 10px 30px rgba(0,0,0,0.5);">Handcrafted Excellence</h2>
          <p style="color:var(--gold-light);font-size:1.2rem;letter-spacing:0.2em;text-transform:uppercase;">✦ Luxury in Every Detail ✦</p>
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURED PRODUCTS -->
  <section style="background:var(--beige);">
    <div class="section-header reveal">
      <div class="section-eyebrow">Bestsellers</div>
      <h2 class="section-title">Featured Products</h2>
      <div class="divider"></div>
    </div>
    <div class="products-grid" id="featured-grid"><div style="text-align:center;padding:2rem;color:var(--gray);">Loading products...</div></div>
    <div style="text-align:center;margin-top:3rem;"><button class="btn-outline" onclick="navigate('/products')">View All Products <i class="fas fa-arrow-right"></i></button></div>
  </section>

  <!-- TESTIMONIALS -->
  <section class="testimonials">
    <div class="section-header reveal">
      <div class="section-eyebrow" style="color:var(--gold-light);">Happy Customers</div>
      <h2 class="section-title">What Our Customers Say</h2>
      <div class="divider"></div>
    </div>
    <div class="testi-grid">
      <div class="testi-card reveal"><div class="testi-stars">★★★★★</div><p class="testi-text">"Absolutely love the rose gold earrings! The quality is amazing and they look so premium. Got so many compliments!"</p><div class="testi-author"><div class="testi-avatar">P</div><div><div class="testi-name">Priya Sharma</div><div class="testi-loc">Mumbai, Maharashtra</div></div></div></div>
      <div class="testi-card reveal"><div class="testi-stars">★★★★★</div><p class="testi-text">"The kundan necklace set is breathtaking! Wore it to my sister's wedding and everyone asked where I got it from."</p><div class="testi-author"><div class="testi-avatar">M</div><div><div class="testi-name">Meera Patel</div><div class="testi-loc">Ahmedabad, Gujarat</div></div></div></div>
      <div class="testi-card reveal"><div class="testi-stars">★★★★★</div><p class="testi-text">"Fast delivery, beautiful packaging, and the jewellery is exactly as pictured. Will definitely order again!"</p><div class="testi-author"><div class="testi-avatar">A</div><div><div class="testi-name">Ananya Reddy</div><div class="testi-loc">Hyderabad, Telangana</div></div></div></div>
    </div>
  </section>`;

  createParticles();
  loadFeaturedProducts();
  initScrollReveal();
  setTimeout(() => {
    if (!sessionStorage.getItem('popupShown')) {
      document.getElementById('discount-popup').style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }, 5000);
}

function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${Math.random() * 100}%;width:${2 + Math.random() * 4}px;height:${2 + Math.random() * 4}px;animation-duration:${8 + Math.random() * 12}s;animation-delay:${Math.random() * 8}s;opacity:${0.3 + Math.random() * 0.5}`;
    container.appendChild(p);
  }
}

async function loadFeaturedProducts() {
  const r = await api('/api/products?featured=true');
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  grid.innerHTML = r.map ? r.map(productCardHTML).join('') : '<p>No products found</p>';
  initScrollReveal();
}

// ── PRODUCTS PAGE ─────────────────────────────────────────
async function renderProducts(params) {
  const category = params.get('category') || '';
  const app = document.getElementById('app');
  const ALL_CATS = [
    { val: '', label: 'All' }, { val: 'earrings', label: 'Earrings' }, { val: 'necklace', label: 'Necklace' },
    { val: 'toe-rings', label: 'Toe Rings' }, { val: 'rings', label: 'Rings' }, { val: 'chains', label: 'Chains' },
    { val: 'payal', label: 'Payal' }, { val: 'bangles', label: 'Bangles' }, { val: 'bracelets', label: 'Bracelets' },
    { val: 'maang-tikka', label: 'Maang Tikka' }, { val: 'sets', label: 'Bridal Sets' },
  ];
  app.innerHTML = `
  <div class="page-wrap">
    <h1 class="page-title">${ALL_CATS.find(ct => ct.val === category)?.label || 'All Collections'}</h1>
    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:2rem;align-items:center;">
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
        ${ALL_CATS.map(c => `<button class="btn-${c.val === category ? 'primary' : 'outline'} btn-sm" onclick="navigate('/products${c.val ? '?category=' + c.val : ''}')">${c.label}</button>`).join('')}
      </div>
      <select id="sort-select" onchange="sortProducts(this.value,'${category}')" style="margin-left:auto;padding:10px 18px;border:2px solid var(--border);border-radius:99px;font-size:.85rem;outline:none;cursor:pointer;background:#fff;color:var(--dark);font-family:'Inter',sans-serif;appearance:none;-webkit-appearance:none;padding-right:2rem;background-image:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22><path fill=%22%23c9748f%22 d=%22M0 0l5 6 5-6z%22/></svg>');background-repeat:no-repeat;background-position:right 12px center;">
        <option value="">Sort By</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="rating">Top Rated</option>
      </select>
    </div>
    <div class="products-grid" id="products-grid"><div style="text-align:center;padding:3rem;color:var(--gray);">Loading...</div></div>
  </div>`;
  const url = '/api/products' + (category ? `?category=${category}` : '');
  const products = await api(url);
  const grid = document.getElementById('products-grid');
  if (grid) grid.innerHTML = products.length ? products.map(productCardHTML).join('') : '<div class="empty-state"><div class="empty-icon">💎</div><h3>No products found</h3><p>Check back soon for new arrivals!</p></div>';
  initScrollReveal();
}

async function sortProducts(sort, category) {
  const url = '/api/products?' + new URLSearchParams({ ...(category && { category }), ...(sort && { sort }) });
  const products = await api(url);
  const grid = document.getElementById('products-grid');
  if (grid) { grid.innerHTML = products.map(productCardHTML).join(''); initScrollReveal(); }
}

async function loadPublicSettings() {
  try {
    const s = await api('/api/settings/public');
    const wb = document.getElementById('whatsapp-btn');
    if (wb && s.whatsappNumber) wb.href = 'https://wa.me/' + s.whatsappNumber + '?text=Hi%20Lencho%20India!';
  } catch (e) { }
}

// ── INIT ──────────────────────────────────────────────────
async function init() {
  await loadUser();
  updateCartCount();
  initHeader();
  loadPublicSettings();
  navigate(location.pathname + location.search, false);
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
  }, 2000);
}

init();
