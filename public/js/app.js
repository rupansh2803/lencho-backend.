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
  return `
  <div class="product-card reveal">
    <div class="product-img-wrap">
      <img class="product-img" src="${p.images[0]}" alt="${p.name}" loading="lazy"/>
      ${p.discount ? `<span class="product-badge">${p.discount}% OFF</span>` : ''}
      <button class="product-wish" onclick="toggleWishlist('${p.id}',this)" title="Wishlist"><i class="fas fa-heart"></i></button>
    </div>
    <div class="product-body">
      <div class="product-name">${p.name}</div>
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
        <button class="btn-primary btn-sm" onclick="addToCart('${p.id}')" style="flex:1;"><i class="fas fa-shopping-bag"></i> Add</button>
        <button class="btn-outline btn-sm" onclick="navigate('/product/${p.id}')" style="flex:1;">View</button>
      </div>
    </div>
  </div>`;
}

// ── HOME PAGE ─────────────────────────────────────────────
async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = `
  <!-- HERO -->
  <section class="hero">
    <div class="hero-bg"><img class="hero-img" src="/images/hero.png" alt="Lencho Jewellery" onerror="this.src='https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80'"/></div>
    <div class="hero-particles" id="particles"></div>
    <div class="hero-content">
      <div class="hero-badge">✦ NEW COLLECTION 2026 ✦</div>
      <h1 class="hero-title">Elegance That<br/><span>Defines You</span></h1>
      <p class="hero-sub">Premium Artificial Jewellery for Every Occasion.<br/>Crafted with love, designed for the modern woman.</p>
      <div class="hero-btns">
        <button class="btn-gold" onclick="navigate('/products')">Shop Now <i class="fas fa-arrow-right"></i></button>
        <button class="btn-outline" style="border-color:rgba(255,255,255,.5);color:#fff;" onclick="document.querySelector('.categories').scrollIntoView({behavior:'smooth'})">Explore Collection</button>
      </div>
    </div>
    <div class="hero-scroll"><span>SCROLL</span><div class="hero-scroll-line"></div></div>
  </section>

  <!-- MARQUEE -->
  <div class="marquee-strip">
    <div class="marquee-inner">
      ${Array(8).fill('✦ FREE SHIPPING ON ₹999+ &nbsp;&nbsp; ✦ USE CODE FIRST10 FOR 10% OFF &nbsp;&nbsp; ✦ EASY 7-DAY RETURNS &nbsp;&nbsp; ✦ PREMIUM QUALITY GUARANTEED &nbsp;&nbsp;').join('')}
    </div>
  </div>

  <!-- FEATURES -->
  <section style="background:var(--beige);">

    <div class="features-grid">
      <div class="feature-card reveal"><div class="feature-icon">🚚</div><div class="feature-title">Free Delivery</div><div class="feature-desc">On orders above ₹999 across India</div></div>
      <div class="feature-card reveal"><div class="feature-icon">💎</div><div class="feature-title">Premium Quality</div><div class="feature-desc">Anti-tarnish, hypoallergenic materials</div></div>
      <div class="feature-card reveal"><div class="feature-icon">↩️</div><div class="feature-title">Easy Returns</div><div class="feature-desc">7-day hassle-free return policy</div></div>
      <div class="feature-card reveal"><div class="feature-icon">🔒</div><div class="feature-title">Secure Payment</div><div class="feature-desc">100% safe UPI, Card & COD</div></div>
    </div>
  </section>

  <!-- CATEGORIES -->
  <section class="categories">
    <div class="section-header reveal">
      <div class="section-eyebrow">Shop by Category</div>
      <h2 class="section-title">Our Collections</h2>
      <div class="divider"></div>
      <p class="section-desc">Discover our curated range of premium jewellery crafted for every occasion</p>
    </div>
    <div class="categories-grid">
      <div class="cat-card reveal-left" onclick="navigate('/products?category=earrings')">
        <img class="cat-img" src="/images/earrings.png" alt="Earrings" onerror="this.src='https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=400&q=80'"/>
        <div class="cat-overlay"></div>
        <div class="cat-content"><div class="cat-name">Earrings</div><button class="cat-btn">Shop Now</button></div>
      </div>
      <div class="cat-card reveal" onclick="navigate('/products?category=necklace')">
        <img class="cat-img" src="/images/necklace.png" alt="Necklace" onerror="this.src='https://images.unsplash.com/photo-1599643478514-411db1fb6d22?auto=format&fit=crop&w=400&q=80'"/>
        <div class="cat-overlay"></div>
        <div class="cat-content"><div class="cat-name">Necklace</div><button class="cat-btn">Shop Now</button></div>
      </div>
      <div class="cat-card reveal-right" onclick="navigate('/products?category=toe-rings')">
        <img class="cat-img" src="/images/toe-rings.png" alt="Toe Rings" onerror="this.src='https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=400&q=80'"/>
        <div class="cat-overlay"></div>
        <div class="cat-content"><div class="cat-name">Toe Rings</div><button class="cat-btn">Shop Now</button></div>
      </div>
      <div class="cat-card reveal-right" onclick="navigate('/products?category=payal')" style="animation-delay:.2s">
        <img class="cat-img" src="/images/payal.png" alt="Payal" onerror="this.src='https://images.unsplash.com/photo-1610931215444-24dddcbc7221?auto=format&fit=crop&w=400&q=80'"/>
        <div class="cat-overlay"></div>
        <div class="cat-content"><div class="cat-name">Payal</div><button class="cat-btn">Shop Now</button></div>
      </div>
    </div>
  </section>

  <!-- VIDEO SHOWCASE SECTION -->
  <section class="video-section reveal">
    <div class="section-header" style="margin-bottom:2.5rem;">
      <div class="section-eyebrow" style="color:var(--gold-light);">✦ OUR STORY ✦</div>
      <h2 class="section-title" style="color:#fff;font-size:2.4rem;">Crafted with Passion</h2>
      <div class="divider"></div>
      <p style="color:rgba(255,255,255,.65);max-width:560px;margin:.75rem auto 0;font-size:1rem;line-height:1.7;" class="desc-collapsed">
        Every piece is handcrafted with love — see how we create jewellery that tells your story. Our designers use premium materials to ensure that every necklace, earring, and ring is anti-tarnish and comfortable for all-day wear.
      </p>
      <span class="see-more-btn" onclick="toggleDesc(this)" style="color:var(--gold-light);">See More</span>
    </div>
    <div class="video-container" style="background:#000; overflow:hidden; position:relative; min-height:400px; display:flex; align-items:center; justify-content:center; flex-direction:column;">
      <div style="position:absolute;inset:0;background:url('/images/hero.png') center/cover;opacity:0.6;animation:pulseZoom 15s infinite alternate;border-radius:24px;"></div>
      <div style="position:relative;z-index:2;color:#fff;text-align:center;">
        <i class="fas fa-play-circle" style="font-size:4rem;color:var(--gold-light);margin-bottom:1rem;opacity:0.8;"></i>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.8rem;margin:bottom:0;">Coming Soon</h3>
        <p style="font-size:.9rem;color:rgba(255,255,255,.7);">Our craftmanship video processing...</p>
      </div>
    </div>
    <div style="margin-top:2.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;position:relative;z-index:10;">
      <button class="btn-gold" style="padding:14px 32px;font-size:.95rem;position:relative;z-index:10;" onclick="navigate('/products')">
        <i class="fas fa-gem" style="margin-right:.5rem;"></i>Shop the Collection
      </button>
      <button class="btn-outline" style="padding:14px 32px;border-color:rgba(255,255,255,.3);color:#fff;font-size:.95rem;position:relative;z-index:10;" onclick="navigate('/products?category=sets')">
        <i class="fas fa-ring" style="margin-right:.5rem;"></i>Bridal Sets
      </button>
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
