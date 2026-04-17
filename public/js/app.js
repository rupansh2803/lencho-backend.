/* ── LENCHO – MAIN APP ─────────────────────────────── */
let currentUser = null;
let cartCount = 0;

function getHeaderOffset() {
  return window.innerWidth <= 768 ? '110px' : '72px';
}

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
  app.style.paddingTop = getHeaderOffset();  // Ensure everything avoids header overlap

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
    else if (route === '/terms') { renderTerms(); }
    else if (route === '/privacy') { renderPrivacy(); }
    else if (route === '/disclaimer') { renderDisclaimer(); }
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
  try {
    const res = await fetch(url, { 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include',
      ...opts, 
      body: opts.body ? JSON.stringify(opts.body) : undefined 
    });
    
    // Check for non-JSON or error responses
    if (!res.ok) {
      const text = await res.text();
      let errData;
      try { errData = JSON.parse(text); } catch(e) {}
      console.error(`API Error [${res.status}]:`, text);
      return { error: (errData && errData.error) || `Server Error: ${res.status}` };
    }
    
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Fetch Error:', e);
    return { error: 'Connection lost. Please restart your local server (npm start).' };
  }
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

async function openAuthModal() {
  document.getElementById('auth-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  // Load CAPTCHA
  const r = await api('/api/captcha');
  if (r.q) {
    const el = document.getElementById('signup-captcha-q');
    if (el) el.innerText = r.q;
  }
}
function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  window.pendingAuth = null;
  document.getElementById('auth-otp-step').style.display = 'none';
  const signupPasswordStep = document.getElementById('auth-signup-password-step');
  if (signupPasswordStep) signupPasswordStep.style.display = 'none';
  document.getElementById('auth-signup-form').style.display = 'none';
  document.getElementById('auth-login-form').style.display = 'block';
}
function switchToSignup() {
  document.getElementById('auth-login-form').style.display = 'none';
  document.getElementById('auth-otp-step').style.display = 'none';
  const signupPasswordStep = document.getElementById('auth-signup-password-step');
  if (signupPasswordStep) signupPasswordStep.style.display = 'none';
  document.getElementById('auth-signup-form').style.display = 'block';
}
function switchToLogin() {
  document.getElementById('auth-otp-step').style.display = 'none';
  const signupPasswordStep = document.getElementById('auth-signup-password-step');
  if (signupPasswordStep) signupPasswordStep.style.display = 'none';
  document.getElementById('auth-signup-form').style.display = 'none';
  document.getElementById('auth-login-form').style.display = 'block';
}

async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  if(!email || !password) { err.textContent = 'Please enter email and password'; return; }
  
  window.pendingAuth = { type: 'login', email, password };
  sendEmailOTP(email, 'auth-login-form', 'login-error');
}

async function handleSignup() {
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const gender = document.getElementById('signup-gender')?.value || 'female';
  const phone = document.getElementById('signup-phone')?.value || '';
  const err = document.getElementById('signup-error');
  
  if(!name || !email) { err.textContent = 'Please fill name and email'; return; }

  window.pendingAuth = { type: 'signup', name, email, phone, gender };
  sendEmailOTP(email, 'auth-signup-form', 'signup-error');
}

async function sendEmailOTP(email, currentFormId, errorId) {
  const err = document.getElementById(errorId);
  const btnId = currentFormId === 'auth-login-form' ? 'login-btn' : 'signup-btn';
  const btn = document.getElementById(btnId);
  err.textContent = '';
  
  if (btn) { btn.disabled = true; btn.textContent = 'Sending OTP... ✦'; }
  
  const resp = await api('/api/otp/send-email', { method: 'POST', body: { email } });
  
  if (btn) { btn.disabled = false; btn.textContent = currentFormId === 'auth-login-form' ? 'Sign In' : 'Create Account ✦'; }
  
  if (resp.error) { err.textContent = resp.error; return; }
  
  document.getElementById(currentFormId).style.display = 'none';
  document.getElementById('otp-error').textContent = '';
  document.getElementById('auth-otp-input').value = '';
  document.getElementById('auth-otp-step').style.display = 'block';
  toast('OTP sent to your email! 📧', 'success');
}

async function verifyEmailOTP() {
  const otp = document.getElementById('auth-otp-input').value;
  const err = document.getElementById('otp-error');
  const email = window.pendingAuth.email;
  
  const resp = await api('/api/otp/verify-email', { method: 'POST', body: { email, otp } });
  if (resp.error) { err.textContent = resp.error; return; }

  const p = window.pendingAuth;
  if (p.type === 'signup') {
    document.getElementById('auth-otp-step').style.display = 'none';
    document.getElementById('signup-password-step-error').textContent = '';
    document.getElementById('signup-password-step').value = '';
    document.getElementById('signup-confirm-password-step').value = '';
    document.getElementById('auth-signup-password-step').style.display = 'block';
    toast('Email verified. Now set your password.', 'success');
    return;
  }

  // OTP Verified, now complete the original login action
  const endpoint = p.type === 'login' ? '/api/login' : '/api/signup';
  const finalResp = await api(endpoint, { method: 'POST', body: p });
  
  if (finalResp.error) { err.textContent = finalResp.error; return; }
  
  currentUser = finalResp.user;
  updateHeader();
  closeAuthModal();
  toast(`Welcome ${currentUser.name}! ✦`, 'success');
  updateCartCount();
  if (currentUser.role === 'admin') navigate('/admin');
}

async function completeSignupAfterOTP() {
  const password = document.getElementById('signup-password-step').value;
  const confirmPassword = document.getElementById('signup-confirm-password-step').value;
  const err = document.getElementById('signup-password-step-error');

  if (!window.pendingAuth || window.pendingAuth.type !== 'signup') {
    err.textContent = 'Signup session expired. Please start again.';
    return;
  }
  if (!password) { err.textContent = 'Please enter password'; return; }
  if (password.length < 6) { err.textContent = 'Password must be at least 6 characters'; return; }
  if (password !== confirmPassword) { err.textContent = 'Passwords do not match'; return; }

  const payload = { ...window.pendingAuth, password };
  const finalResp = await api('/api/signup', { method: 'POST', body: payload });
  if (finalResp.error) { err.textContent = finalResp.error; return; }

  currentUser = finalResp.user;
  updateHeader();
  closeAuthModal();
  toast(`Welcome ${currentUser.name}! ✦`, 'success');
  updateCartCount();
}

function resendEmailOTP() {
  if (window.pendingAuth && window.pendingAuth.email) {
    sendEmailOTP(window.pendingAuth.email, 'auth-otp-step', 'otp-error');
  }
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

async function buyNow(productId) {
  if (!currentUser) { openAuthModal(); return; }
  await addToCart(productId, false);
  navigate('/checkout');
  toast('Proceeding to checkout! 🛒', 'success');
}

// ── DISCOUNT POPUP ────────────────────────────────────────
function closePopup() {
  document.getElementById('discount-popup').style.display = 'none';
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  sessionStorage.setItem('popupShown', '1');
}
async function claimDiscount() {
  const email = document.getElementById('popup-email')?.value;
  if (!email) { toast('Please enter your email', 'error'); return; }
  const btn = document.querySelector('.popup-form .btn-primary');
  const form = document.querySelector('.popup-form');
  
  btn.textContent = 'Claiming...'; btn.disabled = true;
  const r = await api('/api/discount/email', { method: 'POST', body: { email } });
  
  if (r.error) { 
    toast(r.error, 'error'); 
    btn.textContent = 'Claim My Discount 🎁'; 
    btn.disabled = false; 
    return; 
  }
  
  // Hide form and show result
  if (form) form.style.display = 'none';
  const result = document.getElementById('popup-result');
  result.innerHTML = `<div style="text-align:center;padding:1rem;">🎉 Thank you! Your code:<br/><strong style="color:var(--rose-dark);font-size:1.6rem;display:block;margin:10px 0;">WELCOME10</strong> — 10% OFF applied!</div>`;
  setTimeout(closePopup, 5000);
}

// ── HEADER SCROLL ─────────────────────────────────────────
function initHeader() {
  const h = document.getElementById('site-header');
  const headerInner = document.querySelector('.header-inner');
  const mainNav = document.getElementById('main-nav');
  const headerActions = document.querySelector('.header-actions');
  const navClose = document.getElementById('nav-close-btn');

  function syncMobileHeaderLayout() {
    if (!headerInner || !mainNav || !headerActions || !navClose) return;
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      if (!mainNav.contains(headerActions)) {
        headerActions.classList.add('mobile-nav-actions');
        navClose.insertAdjacentElement('afterend', headerActions);
      }
    } else {
      if (!headerInner.contains(headerActions)) {
        headerActions.classList.remove('mobile-nav-actions');
        headerInner.appendChild(headerActions);
      }
    }
  }

  syncMobileHeaderLayout();
  window.addEventListener('resize', syncMobileHeaderLayout, { passive: true });

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

// ── MOBILE NAV DROPDOWN TOGGLE ────────────────────────────
function toggleNavDropdown(e) {
  e.stopPropagation();
  const isMobile = window.innerWidth <= 768;
  const dd = document.getElementById('nav-collections-dd');
  const arrow = document.getElementById('coll-arrow');
  if (isMobile) {
    // On mobile: toggle open/close
    const isOpen = dd.classList.contains('mob-open');
    dd.classList.toggle('mob-open', !isOpen);
    if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
  } else {
    // On desktop: navigate directly
    navigate('/products');
  }
}
// Close mobile dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dd = document.getElementById('nav-collections-dd');
  if (dd && !dd.contains(e.target)) {
    dd.classList.remove('mob-open');
    const arrow = document.getElementById('coll-arrow');
    if (arrow) arrow.style.transform = '';
  }
});

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
  const stockStatus = p.stock < 5 && p.stock > 0 ? '⚡ Only ' + p.stock + ' left!' : '';
  const isFeatured = p.featured ? '⭐ Trending' : '';
  const badge = isFeatured || stockStatus || (p.discount > 30 ? '🔥 Hot Deal' : '');
  
  return `
  <div class="product-card reveal" style="border-radius:16px !important;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08) !important;transition:transform .3s ease,box-shadow .3s ease !important;background:#fff;border:1px solid rgba(201,106,138,.08);" onmouseover="this.style.transform='translateY(-6px)';this.style.boxShadow='0 12px 32px rgba(201,106,138,.15) !important';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 16px rgba(0,0,0,.08) !important';">
    <div class="product-img-wrap" onclick="navigate('/product/${p.id}')" style="position:relative;overflow:hidden;aspect-ratio:1/1.15;cursor:pointer;">
      <img class="product-img" src="${p.images[0]}" alt="${p.name}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;transition:transform .5s ease !important;display:block;"/>
      <img class="product-img img-hover" src="${secondaryImg}" alt="${p.name}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;opacity:0;transition:opacity .4s ease !important;display:block;"/>
      
      ${p.discount ? `<span class="product-badge" style="position:absolute;top:12px;left:12px;background:linear-gradient(135deg,#c9748f,#9b4065);color:#fff;padding:6px 12px;border-radius:8px;font-weight:700;font-size:.75rem;z-index:2;">✦ ${p.discount}% OFF ✦</span>` : ''}
      
      ${badge ? `<span style="position:absolute;bottom:12px;left:12px;background:var(--gold);color:var(--dark);padding:6px 12px;border-radius:8px;font-weight:600;font-size:.75rem;z-index:2;">${badge}</span>` : ''}
      
      <button class="product-wish" onclick="event.stopPropagation(); toggleWishlist('${p.id}',this)" title="Wishlist" style="position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.95);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:3;transition:transform .2s;font-size:.9rem;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fas fa-heart" style="color:#ddd;"></i></button>
    </div>
    
    <div class="product-body" style="padding:1rem 1rem 1.2rem;">
      <div class="product-name" onclick="navigate('/product/${p.id}')" style="font-weight:600;font-size:.95rem;color:var(--dark);cursor:pointer;line-height:1.3;margin-bottom:.5rem;transition:color .2s;" onmouseover="this.style.color='var(--rose)'" onmouseout="this.style.color='var(--dark)'">${p.name}</div>
      
      <div class="product-rating" style="margin-bottom:.6rem;">
        <span class="stars" style="font-size:.85rem;">${renderStars(p.rating || 0)}</span>
        ${p.reviews?.length ? `<span class="rating-count" style="font-size:.75rem;color:var(--gray);margin-left:.5rem;">(${p.reviews.length})</span>` : ''}
      </div>
      
      <div class="product-price" style="margin-bottom:.75rem;">
        <span class="price-current" style="font-size:1.2rem;font-weight:700;color:var(--rose);">₹${Math.round(p.price)}</span>
        ${p.mrp ? `<span class="price-mrp" style="font-size:.85rem;color:var(--gray);text-decoration:line-through;margin-left:.5rem;">₹${Math.round(p.mrp)}</span>` : ''}
        ${p.discount ? `<span class="price-off" style="font-size:.75rem;color:var(--gold);margin-left:.5rem;font-weight:600;">Save ${p.discount}%</span>` : ''}
      </div>
      
      <div style="margin-bottom:0.75rem; padding:0.75rem; background:var(--beige); border-radius:8px; font-size:.8rem; color:var(--gray);">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:4px;">
          <i class="fas fa-truck-fast" style="color:var(--rose);"></i>
          <span><strong>Free</strong> delivery above ₹999</span>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem;">
          <i class="fas fa-tag" style="color:var(--gold);"></i>
          <span>Standard delivery in 3-5 days</span>
        </div>
      </div>
      
      <div class="product-actions" style="margin-top:1rem;display:flex;gap:.5rem;flex-direction:column;">
        <button class="btn-primary btn-sm" onclick="addToCart('${p.id}')" style="flex:1;padding:10px;border-radius:8px;border:none;background:linear-gradient(135deg,#c9748f,#9b4065);color:#fff;font-weight:600;cursor:pointer;transition:transform .2s;display:flex;align-items:center;justify-content:center;gap:.5rem;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          <i class="fas fa-shopping-bag"></i> Add to Cart
        </button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;">
          <button class="btn-outline btn-sm" onclick="navigate('/product/${p.id}')" style="padding:10px;border-radius:8px;border:2px solid var(--rose);background:#fff;color:var(--rose);font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:.5rem;" onmouseover="this.style.background='var(--rose-light)'" onmouseout="this.style.background='#fff'">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn-gold btn-sm" onclick="event.stopPropagation(); buyNow('${p.id}')" style="padding:10px;border-radius:8px;border:none;background:linear-gradient(135deg,#c9954c,#a67a38);color:#fff;font-weight:600;cursor:pointer;transition:transform .2s;display:flex;align-items:center;justify-content:center;gap:.5rem;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            <i class="fas fa-bolt"></i> Buy Now
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderFallbackCollectionCards(container) {
  const fallbackCollections = shuffleArray([
    { name: 'Earrings', slug: 'earrings', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80' },
    { name: 'Necklace Sets', slug: 'necklace', image: 'https://images.unsplash.com/photo-1617038220319-9c7b6f4f59ff?auto=format&fit=crop&w=900&q=80' },
    { name: 'Rings', slug: 'rings', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80' },
    { name: 'Bridal Sets', slug: 'sets', image: 'https://images.unsplash.com/photo-1617038220319-33d1c2d2c5b8?auto=format&fit=crop&w=900&q=80' },
    { name: 'Bangles', slug: 'bangles', image: 'https://images.unsplash.com/photo-1617038220319-3f6e0adf8c5e?auto=format&fit=crop&w=900&q=80' },
    { name: 'Bracelets', slug: 'bracelets', image: 'https://images.unsplash.com/photo-1611652022419-8a3f7f0de1c7?auto=format&fit=crop&w=900&q=80' },
  ]);

  container.innerHTML = fallbackCollections.map((c, i) => `
    <div class="cat-card reveal" style="animation-delay:${i * 0.05}s" onclick="navigate('/products?category=${c.slug}')">
      <img class="cat-img" src="${c.image}" alt="${c.name}" onerror="this.src='/images/hero.png'"/>
      <div class="cat-overlay"></div>
      <div class="cat-content"><div class="cat-name">${c.name}</div><button class="cat-btn">Shop Now</button></div>
    </div>
  `).join('');
  initScrollReveal();
}

function renderFallbackFeaturedCards(container) {
  const fallbackFeatured = shuffleArray([
    { title: 'Rose Glow Earrings', slug: 'earrings', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80' },
    { title: 'Royal Necklace Set', slug: 'necklace', image: 'https://images.unsplash.com/photo-1617038220319-9c7b6f4f59ff?auto=format&fit=crop&w=900&q=80' },
    { title: 'Bridal Ring Collection', slug: 'rings', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80' },
    { title: 'Statement Bangles', slug: 'bangles', image: 'https://images.unsplash.com/photo-1617038220319-3f6e0adf8c5e?auto=format&fit=crop&w=900&q=80' },
  ]);

  container.innerHTML = fallbackFeatured.map((item, i) => `
    <div class="product-card reveal" style="border-radius:16px !important;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08) !important;transition:transform .3s ease,box-shadow .3s ease !important;background:#fff;border:1px solid rgba(201,106,138,.08);" onclick="navigate('/products?category=${item.slug}')">
      <div class="product-img-wrap" style="position:relative;overflow:hidden;aspect-ratio:1/1.15;cursor:pointer;">
        <img class="product-img" src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block;"/>
        <span class="product-badge" style="position:absolute;top:12px;left:12px;background:linear-gradient(135deg,#c9748f,#9b4065);color:#fff;padding:6px 12px;border-radius:8px;font-weight:700;font-size:.75rem;z-index:2;">✦ Featured ✦</span>
      </div>
      <div class="product-body" style="padding:1rem 1rem 1.2rem;">
        <div class="product-name" style="font-weight:600;font-size:.95rem;color:var(--dark);line-height:1.3;margin-bottom:.5rem;">${item.title}</div>
        <div class="product-price" style="margin-bottom:.75rem;">
          <span class="price-current" style="font-size:1.2rem;font-weight:700;color:var(--rose);">Explore Collection</span>
        </div>
        <button class="btn-primary btn-sm" style="width:100%;padding:10px;border-radius:8px;border:none;background:linear-gradient(135deg,#c9748f,#9b4065);color:#fff;font-weight:600;cursor:pointer;">View Collection</button>
      </div>
    </div>
  `).join('');
  initScrollReveal();
}

// ── HOME PAGE ─────────────────────────────────────────────
function normalizeSettings(settings) {
  if (Array.isArray(settings)) {
    const normalized = {};
    settings.forEach(item => {
      if (item && item.key !== undefined) normalized[item.key] = item.value;
    });
    return normalized;
  }
  return settings && typeof settings === 'object' ? settings : {};
}

function applyCmsDesign(cms) {
  const root = document.documentElement;
  const setVar = (key, cssVar, fallback) => {
    const value = cms[key];
    root.style.setProperty(cssVar, value && String(value).trim() ? String(value).trim() : fallback);
  };

  setVar('themeRose', '--rose', '#c9748f');
  setVar('themeRoseDark', '--rose-dark', '#a85070');
  setVar('themeRoseLight', '--rose-light', '#fbe4e9');
  setVar('themeGold', '--gold', '#b39031');
  setVar('themeGoldLight', '--gold-light', '#d4af37');
  setVar('themeBeige', '--beige', '#fdf6f0');
  setVar('themeDark', '--dark', '#1f1f38');

  const radius = cms.themeRadius || '16px';
  root.style.setProperty('--radius', String(radius));
}

async function renderHome() {
  const app = document.getElementById('app');

  // Fetch CMS settings
  let cms = {};
  try {
    const settings = await api('/api/settings');
    cms = normalizeSettings(settings);
  } catch(e) {}

  applyCmsDesign(cms);

  const g = (k, def) => cms[k] || def || '';
  const isOn = (k) => cms[k] === true || cms[k] === 'true' || cms[k] === undefined;

  // Hero media
  const heroMediaType = g('heroMediaType', 'image');
  const heroImage = g('heroImage', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=100');
  const heroVideo = g('heroVideoUrl', '');
  const heroBackground = heroMediaType === 'video' && heroVideo
    ? ''
    : `background: url('${heroImage}') center/cover no-repeat;`;

  app.innerHTML = `
  <section class="hero-premium" style="${heroBackground} justify-content: center; text-align: center; border-radius:0; position:relative;">
    ${heroMediaType === 'video' && heroVideo ? `<video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;"><source src="${heroVideo}" type="video/mp4"></video>` : ''}
    <div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4)); z-index:1;"></div>
    
    ${isOn('showOfferBanner') ? `<div style="position:absolute;top:0;left:0;right:0;background:linear-gradient(90deg,rgba(201,149,76,.95) 0%,rgba(242,208,122,.85) 50%,rgba(201,149,76,.95) 100%);padding:12px;z-index:3;color:var(--dark);font-weight:700;font-size:.9rem;letter-spacing:.05em;text-transform:uppercase;text-align:center;">
      ${g('offerBanner', '🎁 LIMITED OFFER: FLAT 50% OFF ON SELECTED ITEMS + FREE DELIVERY!')}
    </div>` : ''}
    
    <div class="hero-p-centered reveal" style="position:relative; z-index:2; padding: 60px 5% 0; margin-top:20px;">
      <div class="hero-badge" style="color:var(--gold-light);background:rgba(0,0,0,0.3); border:1.5px solid rgba(201,168,76,.4);padding:12px 28px;border-radius:99px;display:inline-block;margin-bottom:1.5rem;letter-spacing:.25em;font-size:.85rem;backdrop-filter:blur(8px);font-weight:600;">${g('heroBadge', '✦ PREMIUM COLLECTION 2026 ✦')}</div>
      <h1 class="hero-p-title" style="margin-bottom:1.5rem; font-size: clamp(2.5rem, 7vw, 5rem); line-height:1.15; text-shadow: 0 4px 20px rgba(0,0,0,0.5);">${g('heroTitle', 'Luxury Redefined')}<br/><span style="color:var(--gold-light); font-family:'Playfair Display',serif; font-style:italic;">${g('heroSubtitle', 'For The Modern Woman')}</span></h1>
      <p class="hero-p-sub" style="max-width:700px; margin: 0 auto 1.5rem; color:#fff; font-size:1.15rem; line-height:1.7; font-weight:500; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">${g('heroDescription', 'Premium artificial jewellery starting at just ₹99. Look expensive, spend smart. 4.8⭐ trusted by 50K+ customers.')}</p>
      
      <div class="hero-btns" style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap; margin-bottom:2rem;">
        <button class="btn-gold" style="padding:18px 42px; font-size:1rem; font-weight:700;box-shadow:0 8px 25px rgba(201,149,76,.4);" onclick="navigate('/products')">${g('heroButton1Text', '🛍️ Shop Now & Save')}</button>
        <button class="btn-outline" style="padding:18px 42px; font-size:1rem; color:#fff; border-color:rgba(255,255,255,.7); border-width:2px;" onclick="navigate('/products?category=earrings')">${g('heroButton2Text', 'View Collections')}</button>
      </div>
    </div>
  </section>

  ${isOn('showTrustHub') ? `<!-- TRUST HUB -->
  <div class="trust-hub" style="background:linear-gradient(135deg, rgba(201,106,138,.08) 0%, rgba(201,149,76,.08) 100%);">
    <div class="trust-item"><i class="fas fa-truck-fast"></i> <span><strong>Free</strong> Delivery</span></div>
    <div class="trust-item"><i class="fas fa-wallet"></i> <span><strong>Cash on</strong> Delivery</span></div>
    <div class="trust-item"><i class="fas fa-rotate-left"></i> <span><strong>7-Day</strong> Returns</span></div>
    <div class="trust-item"><i class="fas fa-shield-check"></i> <span><strong>100%</strong> Authentic</span></div>
  </div>` : ''}

  ${isOn('showPromo') ? `<section class="promo-limited-banner">
    <div class="promo-content reveal-left">
      <div class="hero-badge" style="background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.2); color:#fff; margin-bottom:1rem;">✦ LIMITED EDITION 2026 ✦</div>
      <h2 style="font-family:'Playfair Display',serif; font-size:2.8rem; margin-bottom:1rem; line-height:1.2;">${g('promoTitle', 'Exclusive Seasonal Drop')}<br/><span style="color:var(--gold-light);">${g('promoSubtitle', 'Sale Ends In')}</span></h2>
      <div class="promo-timer" id="promo-timer">
        <div class="timer-box"><span class="timer-val" id="t-days">00</span><span class="timer-label">Days</span></div>
        <div class="timer-box"><span class="timer-val" id="t-hours">00</span><span class="timer-label">Hours</span></div>
        <div class="timer-box"><span class="timer-val" id="t-mins">00</span><span class="timer-label">Mins</span></div>
        <div class="timer-box"><span class="timer-val" id="t-secs">00</span><span class="timer-label">Secs</span></div>
      </div>
      <p style="color:rgba(255,255,255,0.7); max-width:400px; margin-bottom:2rem;">${g('promoDescription', 'Our most awaited collection is here. Limited quantities available.')}</p>
      <button class="btn-gold" onclick="navigate('/products')">${g('promoButtonText', 'Explore Collection')} <i class="fas fa-arrow-right"></i></button>
    </div>
    <div class="promo-image reveal-right" style="flex:1; max-width:400px; position:relative; z-index:2;">
      ${g('promoMediaType') === 'video' && g('promoVideoUrl') 
        ? `<video autoplay muted loop playsinline style="width:100%; border-radius:24px; box-shadow:0 30px 60px rgba(0,0,0,0.5);"><source src="${g('promoVideoUrl')}" type="video/mp4"></video>`
        : `<img src="${g('promoImage', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800')}" style="width:100%; border-radius:24px; box-shadow:0 30px 60px rgba(0,0,0,0.5); transform:rotate(2deg);" alt="Promo"/>`
      }
    </div>
  </section>` : ''}

  ${isOn('showCollections') ? `<section class="categories" style="padding:4rem 5%;${g('homeCollectionsBg') ? `background:${g('homeCollectionsBg')};` : ''}">
    <div class="section-header reveal">
      <div class="section-eyebrow">Shop by Category</div>
      <h2 class="section-title">Exclusive Collections</h2>
      <div class="divider"></div>
    </div>
    <div class="categories-grid" id="home-categories-grid">
      <div style="grid-column:1/-1;text-align:center;color:var(--gray);">Loading exclusive collections...</div>
    </div>
  </section>` : ''}

  ${isOn('showFeaturedProducts') ? `<!-- FEATURED PRODUCTS -->
  <section style="background:${g('homeFeaturedBg', 'var(--beige)')};">
    <div class="section-header reveal">
      <div class="section-eyebrow">Bestsellers</div>
      <h2 class="section-title">🔥 Trending Now</h2>
      <div class="divider"></div>
    </div>
    <div class="products-grid" id="featured-grid"></div>
    <div style="text-align:center;margin-top:3rem;"><button class="btn-outline" onclick="navigate('/products')">View All Collections <i class="fas fa-arrow-right"></i></button></div>
  </section>` : ''}

  ${isOn('showTestimonials') ? `<!-- TESTIMONIALS -->
  <section class="testimonials" style="${g('homeTestimonialsBg') ? `background:${g('homeTestimonialsBg')};` : ''}">
    <div class="section-header reveal">
      <div class="section-eyebrow" style="color:var(--gold-light);">Happy Customers</div>
      <h2 class="section-title">What Our Customers Say</h2>
      <div class="divider"></div>
    </div>
    <div class="testi-grid" id="testi-grid">
      <div style="grid-column:1/-1;text-align:center;color:var(--gray);">Loading reviews...</div>
    </div>
  </section>` : ''}`;

  createParticles();
  initScrollReveal();
  
  // Load content sections in parallel (non-blocking)
  if (isOn('showCollections')) loadHomeCategories().catch(e => console.log('Cat load error:', e));
  if (isOn('showFeaturedProducts')) loadFeaturedProducts().catch(e => console.log('Product load error:', e));
  if (isOn('showTestimonials')) loadTestimonials().catch(e => console.log('Testi load error:', e));
  if (isOn('showPromo')) startOfferTimer();
  
  // Show discount popup after delay (non-blocking, detached from page load)
  if (!sessionStorage.getItem('popupShown')) {
    setTimeout(() => {
      const popup = document.getElementById('discount-popup');
      if (popup) {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }
    }, 5000);
  }
}

// ── DATA LOADERS ──────────────────────────────────────────
async function loadTestimonials() {
  const container = document.getElementById('testi-grid');
  if (!container) return;
  try {
    let t = await api('/api/testimonials');
    if (t && t.hidden) {
      const parentSection = container.closest('.testimonials');
      if (parentSection) parentSection.style.display = 'none';
      return;
    }
    if (!t || t.length === 0) {
      t = [
        { name: 'Anjali Sharma', city: 'Delhi', rating: 5, comment: 'The jewelry is absolutely stunning! The finish and quality are even better than in the photos. Highly recommended! ✦' },
        { name: 'Priya Verma', city: 'Mumbai', rating: 5, comment: 'Ordered a necklace set for a wedding, and I received so many compliments. Fast delivery too! 💎' },
        { name: 'Surbhi Gupta', city: 'Chandigarh', rating: 5, comment: 'Love the premium packaging and the rounded design. Feels very high-end. Great experience. ✨' },
        { name: 'Megha Jain', city: 'Jaipur', rating: 4, comment: 'Beautiful earrings, very lightweight and elegant. Will definitely shop again for the bridal collection.' }
      ];
    }
    const testiHTML = t.map(testi => `
      <div class="testi-card">
        <div class="testi-stars">${'★'.repeat(testi.rating || 5)}</div>
        <p class="testi-text">"${testi.comment}"</p>
        <div class="testi-author">
          <div class="testi-avatar">${testi.name[0]}</div>
          <div><div class="testi-name">${testi.name}</div><div class="testi-loc">${testi.city || ''}</div></div>
        </div>
      </div>`).join('');
    container.innerHTML = `<div class="testi-marquee-container"><div class="testi-marquee-inner">${testiHTML}${testiHTML}${testiHTML}</div></div>`;
  } catch (e) { container.innerHTML = '<div style="text-align:center;color:var(--gray);">Luxury Social Proof Incoming...</div>'; }
}

async function loadHomeCategories() {
  const container = document.getElementById('home-categories-grid');
  if (!container) return;
  try {
    const cats = await api('/api/categories');
    let categories = Array.isArray(cats) ? cats : [];

    if (categories.length === 0) {
      const products = await api('/api/products');
      const byCategory = new Map();
      if (Array.isArray(products)) {
        products.forEach(product => {
          if (!product || !product.category || byCategory.has(product.category)) return;
          byCategory.set(product.category, {
            name: product.category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
            slug: product.category,
            image: product.images?.[0] || '/images/hero.png'
          });
        });
      }
      categories = [...byCategory.values()];
    }

    if (categories.length === 0) {
      renderFallbackCollectionCards(container);
      return;
    }
    container.innerHTML = shuffleArray(categories).map((c, i) => `
      <div class="cat-card reveal" style="animation-delay:${i * 0.05}s" onclick="navigate('/products?category=${c.slug}')">
        <img class="cat-img" src="${c.image}" alt="${c.name}" onerror="this.src='/images/hero.png'"/>
        <div class="cat-overlay"></div>
        <div class="cat-content"><div class="cat-name">${c.name}</div><button class="cat-btn">Shop Now</button></div>
      </div>
    `).join('');
    initScrollReveal();
  } catch (e) {
    const products = await api('/api/products');
    if (Array.isArray(products) && products.length > 0) {
      const byCategory = new Map();
      products.forEach(product => {
        if (!product || !product.category || byCategory.has(product.category)) return;
        byCategory.set(product.category, {
          name: product.category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
          slug: product.category,
          image: product.images?.[0] || '/images/hero.png'
        });
      });
      const categories = [...byCategory.values()];
      if (categories.length > 0) {
        container.innerHTML = shuffleArray(categories).map((c, i) => `
          <div class="cat-card reveal" style="animation-delay:${i * 0.05}s" onclick="navigate('/products?category=${c.slug}')">
            <img class="cat-img" src="${c.image}" alt="${c.name}" onerror="this.src='/images/hero.png'"/>
            <div class="cat-overlay"></div>
            <div class="cat-content"><div class="cat-name">${c.name}</div><button class="cat-btn">Shop Now</button></div>
          </div>
        `).join('');
        initScrollReveal();
        return;
      }
    }
    renderFallbackCollectionCards(container);
  }
}

/* ── TRACK ORDER PAGE ─────────────────────────────────────── */
function renderTrack() {
  document.getElementById('app').innerHTML = `
  <div class="track-page reveal animate-pop-in">
    <div class="section-eyebrow">Order Status</div>
    <h1 class="page-title" style="margin-bottom:0.5rem;">Track Your Order</h1>
    <p style="color:var(--gray);margin-bottom:2rem;">Enter your Order ID (starts with LEN) to get real-time tracking updates.</p>
    <div class="track-search">
      <input id="track-input" placeholder="LEN-XXXXXXXX" onkeydown="if(event.key==='Enter')trackOrder()"/>
      <button class="btn-primary" onclick="trackOrder()"><i class="fas fa-search"></i></button>
    </div>
    <div id="track-result"></div>
  </div>`;

  const qs = new URLSearchParams(location.search);
  const orderId = qs.get('orderId') || qs.get('id') || '';
  if (orderId) {
    const input = document.getElementById('track-input');
    if (input) input.value = orderId;
    trackOrder();
  }
}

async function trackOrder() {
  const id = document.getElementById('track-input')?.value?.trim();
  if (!id) { toast('Please enter Order ID', 'error'); return; }
  const order = await api('/api/orders/track/' + id);
  const el = document.getElementById('track-result');
  if (order.error) { el.innerHTML = `<div style="color:#ef4444;padding:1.5rem;background:#fee2e2;border-radius:var(--radius);margin-top:1rem;">${order.error}</div>`; return; }
  const statusLabels = { placed:'Order Placed', confirmed:'Confirmed', shipped:'Shipped', out_for_delivery:'Out for Delivery', delivered:'Delivered ✓', cancelled:'Cancelled' };
  const trackingId = order.awbCode || order.trackingNumber || order.shiprocketShipmentId || '';
  let trackingLink = '';
  try {
    const cfg = await api('/api/delivery/tracking-config');
    if (!cfg.error && trackingId) {
      const tpl = cfg.trackingUrlTemplate || '';
      if (tpl && tpl.includes('{{id}}')) {
        trackingLink = tpl.replace('{{id}}', encodeURIComponent(trackingId));
      } else if ((cfg.provider || '').toLowerCase() === 'shiprocket') {
        trackingLink = `https://shiprocket.co/tracking/${encodeURIComponent(trackingId)}`;
      } else if ((cfg.provider || '').toLowerCase() === 'delhivery') {
        trackingLink = `https://www.delhivery.com/track-v2/package/${encodeURIComponent(trackingId)}`;
      }
    }
  } catch (e) {}

  el.innerHTML = `
  <div class="order-status-card animate-pop-in">
    <div class="order-id-display">ORDER ID: ${order.id}</div>
    <span class="product-badge" style="position:static;display:inline-block;margin-bottom:1rem;">${statusLabels[order.status] || order.status}</span>
    <p style="font-size:.875rem;color:var(--gray);">Estimated Delivery: <strong>${formatDate(order.estimatedDelivery)}</strong></p>
    ${trackingId ? `<p style="font-size:.875rem;color:var(--gray);">Tracking ID: <strong style="font-family:monospace;">${trackingId}</strong></p>` : ''}
    ${trackingLink ? `<p style="margin:.5rem 0 1rem;"><a href="${trackingLink}" target="_blank" rel="noopener" class="btn-outline btn-sm" style="display:inline-flex;align-items:center;gap:.4rem;"><i class="fas fa-up-right-from-square"></i> Open Delivery Tracking</a></p>` : ''}
    <div class="timeline">
      ${(order.timeline||[]).map(t=>`<div class="timeline-item ${t.done?'done':''}"><div class="timeline-dot"><i class="fas fa-${t.done?'check':'circle'}" style="font-size:.65rem;"></i></div><div class="timeline-content"><div class="timeline-label">${t.label}</div><div class="timeline-date">${t.date?formatDate(t.date):''}</div></div></div>`).join('')}
    </div>
  </div>`;
}

/* ── CONTACT PAGE ─────────────────────────────────────────── */
function renderContact() {
  document.getElementById('app').innerHTML = `
  <div class="container animate-pop-in" style="padding:4rem 0;">
    <h1 class="section-title" style="text-align:center;">Contact Us</h1>
    <div class="divider"></div>
    <p style="text-align:center;color:var(--gray);margin-bottom:4rem;">Reach out for bridal inquiries, bulk orders, or support.</p>
    <div class="contact-layout">
      <div>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.8rem;margin-bottom:2rem;color:var(--rose-dark);">Store Locations</h3>
        <div class="contact-info-card">
          <div class="contact-icon-circle" style="background:var(--rose-light);color:var(--rose-dark);"><i class="fas fa-map-marker-alt"></i></div>
          <div><h4>Flagship Store</h4><p style="color:var(--gray);font-size:.9rem;">197 Sarakpur, Barara, Ambala, Haryana</p></div>
        </div>
        <div class="contact-info-card">
          <div class="contact-icon-circle" style="background:#e0f2fe;color:#0284c7;"><i class="fas fa-phone"></i></div>
          <div><h4>Contact Support</h4><p style="color:var(--gray);font-size:.9rem;">+91 7404217625<br/>Support available 10AM - 7PM</p></div>
        </div>
        <div class="contact-info-card" onclick="window.open('https://wa.me/917404217625')" style="cursor:pointer;">
          <div class="contact-icon-circle" style="background:var(--gold-light);color:var(--gold-dark);"><i class="fab fa-whatsapp"></i></div>
          <div><h4>WhatsApp Support</h4><p style="color:var(--rose-dark);font-weight:600;font-size:.9rem;">Immediate Response ↗</p></div>
        </div>
      </div>
      <div class="glass-card" style="padding:2.5rem;background:#fff;border:1px solid var(--border);">
        <h3 style="font-family:'Playfair Display',serif;font-size:1.8rem;margin-bottom:1.5rem;">Send an Inquiry</h3>
        <div class="form-group"><label>Full Name</label><input id="contact-name" placeholder="Name"/></div>
        <div class="form-group"><label>Email Address</label><input id="contact-email" type="email" placeholder="example@domain.com"/></div>
        <div class="form-group"><label>Your Message</label><textarea id="contact-message" rows="4" placeholder="How can we help?"></textarea></div>
        <button class="btn-primary full-width" onclick="submitContact()"><i class="fas fa-paper-plane"></i> Send Message</button>
      </div>
    </div>
  </div>`;
  initScrollReveal();
}

async function submitContact() {
  const n = document.getElementById('contact-name').value;
  const e = document.getElementById('contact-email').value;
  const m = document.getElementById('contact-message').value;
  if(!n || !e || !m) { toast('Please fill all fields', 'error'); return; }
  const resp = await api('/api/contact', { method: 'POST', body: { name:n, email:e, message:m } });
  if(resp.success) {
    toast('Thank you! Our concierge will contact you within 24 hours. 💌', 'success');
    navigate('/');
  } else {
    toast(resp.error || 'Something went wrong', 'error');
  }
}

async function startOfferTimer() {
  const timerEl = document.getElementById('promo-timer');
  if (!timerEl) return;
  
  const s = normalizeSettings(await api('/api/settings'));
  const end = s.saleEndDate ? new Date(s.saleEndDate) : new Date(Date.now() + 86400000);

  function updateTimer() {
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) {
      ['t-days','t-hours','t-mins','t-secs'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '00'; });
      return;
    }
    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
    const d = document.getElementById('t-days');   if(d) d.textContent = String(days).padStart(2,'0');
    const h = document.getElementById('t-hours');  if(h) h.textContent = String(hours).padStart(2,'0');
    const m = document.getElementById('t-mins');   if(m) m.textContent = String(minutes).padStart(2,'0');
    const sec = document.getElementById('t-secs'); if(sec) sec.textContent = String(seconds).padStart(2,'0');
  }
  updateTimer(); 
  setInterval(updateTimer, 1000);
}

function createParticles() {
  const container = document.getElementById('particles'); if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    p.style.cssText = `left:${Math.random() * 100}%;width:${2 + Math.random() * 4}px;height:${2 + Math.random() * 4}px;animation-duration:${8 + Math.random() * 12}s;animation-delay:${Math.random() * 8}s;opacity:${0.3 + Math.random() * 0.5}`;
    container.appendChild(p);
  }
}

async function loadFeaturedProducts() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  const renderFallbackProducts = async (message) => {
    const fallback = await api('/api/products');
    if (Array.isArray(fallback) && fallback.length > 0) {
      grid.innerHTML = shuffleArray(fallback).slice(0, 4).map(productCardHTML).join('');
      initScrollReveal();
      return;
    }
    renderFallbackFeaturedCards(grid);
  };

  try {
    const r = await api('/api/products?featured=true');
    console.log('Featured products response:', r);
    if (r && Array.isArray(r) && r.length > 0) {
      grid.innerHTML = shuffleArray(r).map(productCardHTML).join('');
      initScrollReveal();
    } else if (Array.isArray(r) && r.length === 0) {
      await renderFallbackProducts('');
    } else {
      console.error('Invalid response format:', r);
      await renderFallbackProducts('');
    }
  } catch (e) {
    console.error('Featured products error:', e);
    await renderFallbackProducts('');
  }
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
    const s = normalizeSettings(await api('/api/settings'));
    const wb = document.getElementById('whatsapp-btn');
    if (wb && s.whatsappNumber) wb.href = 'https://wa.me/' + s.whatsappNumber + '?text=Hi%20Lencho%20India!';
  } catch (e) { }
}

// ── SOCIAL SYNC ───────────────────────────────────────────
async function syncSocialLinks() {
  const s = normalizeSettings(await api('/api/settings'));
  if (s.error) return;
  
  const fb = document.querySelector('.social-icon i.fa-facebook-f')?.parentElement;
  const insta = document.querySelector('.social-icon i.fa-instagram')?.parentElement;
  const tw = document.querySelector('.social-icon i.fa-twitter')?.parentElement;
  const wa = document.querySelector('.social-icon i.fa-whatsapp')?.parentElement;

  if (s.facebookLink && fb) fb.href = s.facebookLink;
  if (s.instagramLink && insta) insta.href = s.instagramLink;
  if (s.twitterLink && tw) tw.href = s.twitterLink;
  if (s.whatsappLink && wa) wa.href = s.whatsappLink;
  else if (s.whatsappNumber && wa) wa.href = `https://wa.me/${s.whatsappNumber}`;
}

// ── INIT ──────────────────────────────────────────────────
window.onload = async () => {
  try {
    // ✨ PARALLEL INITIALIZATION: Run non-blocking tasks together
    const initPromises = [];
    
    // Critical path: Load user + init header (fast)
    initPromises.push(loadUser().catch(e => console.error('loadUser error:', e)));
    
    // Non-critical async tasks (run in background, don't block rendering)
    initPromises.push(updateCartCount().catch(e => console.error('updateCartCount error:', e)));
    initPromises.push(syncSocialLinks().catch(e => console.error('syncSocialLinks error:', e)));
    initPromises.push(loadPublicSettings().catch(e => console.error('loadPublicSettings error:', e)));
    
    // Render page IMMEDIATELY (don't wait for all promises)
    navigate(location.pathname + location.search, false);
    if (typeof initHeader === 'function') initHeader();
    
    // Hide loading screen fast (after minimal delay)
    const ls = document.getElementById('loading-screen');
    setTimeout(() => {
      if (ls) ls.classList.add('hidden');
    }, 300); // Reduced from 1000ms
    
    // Wait for background tasks to complete (non-blocking)
    await Promise.allSettled(initPromises);
  } catch (e) {
    console.error('Init Error:', e);
    navigate(location.pathname + location.search, false);
  }
};

// ── GOOGLE OAUTH ─────────────────────────────────────────────
const GOOGLE_CLIENT_ID = '1074667694021-1b9v8blpaq6l6ik0na3fq6c8prg9hm3q.apps.googleusercontent.com';
let googleAuthInFlight = false;

function signInWithGoogle(event) {
  if (googleAuthInFlight) return;
  const btn = event && event.currentTarget ? event.currentTarget : null;
  googleAuthInFlight = true;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Connecting...'; }
  
  // Load Google Identity Services library
  if (!window.google || !window.google.accounts) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => doGoogleSignIn(btn);
    script.onerror = () => {
      toast('Could not load Google SDK. Check internet/adblock.', 'error');
      console.error('Google SDK failed to load from https://accounts.google.com/gsi/client');
      resetBtn(btn);
    };
    document.head.appendChild(script);
  } else {
    doGoogleSignIn(btn);
  }
}

function doGoogleSignIn(btn) {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
      toast('Google Client ID missing/invalid', 'error');
      console.error('Invalid GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
      resetBtn(btn);
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          console.error('Google token callback error:', tokenResponse);
          if (tokenResponse.error !== 'popup_closed_by_user') {
            toast('Google: ' + (tokenResponse.error_description || tokenResponse.error), 'error');
          }
          resetBtn(btn);
          return;
        }
        try {
          const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          });
          if (!resp.ok) {
            const failText = await resp.text();
            console.error('Google userinfo failed:', resp.status, failText);
            toast(`Google profile fetch failed (${resp.status})`, 'error');
            resetBtn(btn);
            return;
          }
          const profile = await resp.json();
          await completeGoogleLogin(profile, btn);
        } catch(e) {
          console.error('Google profile request error:', e);
          toast('Failed to get Google profile', 'error');
          resetBtn(btn);
        }
      },
      error_callback: (err) => {
        const t = err?.type || '';
        console.error('Google OAuth error callback:', err, 'origin:', window.location.origin);
        if (!t.includes('popup_closed') && !t.includes('access_denied')) {
          toast('Google error: ' + t, 'error');
        }
        resetBtn(btn);
      }
    });
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } catch (e) {
    toast('Google login failed: ' + e.message, 'error');
    resetBtn(btn);
  }
}

function handleGoogleCredential(response, btn) {
  // Decode the JWT credential to get user info
  try {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    completeGoogleLogin({
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub
    }, btn);
  } catch(e) {
    toast('Failed to process Google credential', 'error');
    resetBtn(btn);
  }
}

function resetBtn(btn) {
  googleAuthInFlight = false;
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg> Continue with Google`;
  }
}

async function completeGoogleLogin(profile, btn) {
  const { email, name, picture, sub: googleId } = profile;
  if (!email) { toast('Could not get email from Google', 'error'); resetBtn(btn); return; }
  
  const result = await api('/api/auth/google', {
    method: 'POST',
    body: { email, name, picture, googleId }
  });
  
  if (result.error) {
    console.error('Backend Google auth failed:', result.error, 'profile:', profile);
    toast(result.error, 'error');
    resetBtn(btn);
    return;
  }
  
  currentUser = result.user;
  const sessionUser = await api('/api/me');
  if (sessionUser && sessionUser.user) currentUser = sessionUser.user;
  googleAuthInFlight = false;
  updateHeader();
  closeAuthModal();
  await updateCartCount();
  toast(`🎉 Welcome, ${result.user.name}! ✦`, 'success');
  
  if (currentUser.role === 'admin') {
    navigate('/admin');
  } else {
    navigate('/dashboard');
  }
}
