// ── PRODUCT DETAIL ────────────────────────────────────────
async function renderProductDetail(id) {
  const app = document.getElementById('app');
  const p = await api(`/api/products/${id}`);
  if (p.error) return app.innerHTML = `<div class="container" style="padding:10rem 0;text-align:center;"><h2>Product Not Found</h2><button class="btn-primary" onclick="navigate('/products')">Back to Shop</button></div>`;

  const discountVal = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  app.innerHTML = `
  <div class="product-detail-container container reveal">
    <div class="product-detail-grid">
      <!-- TOP: IMAGES - HORIZONTAL THUMBS AT TOP -->
      <div class="product-gallery">
        <div class="gallery-thumbs-top">
          ${p.images.map((img, i) => `
            <div class="thumb-item ${i === 0 ? 'active' : ''}" onclick="setThumb(this, '${img}')">
              <img src="${img}" alt="Thumbnail ${i + 1}"/>
            </div>
          `).join('')}
        </div>
        <div class="gallery-main">
          <img id="main-product-img" src="${p.images[0]}" alt="${p.name}"/>
          ${discountVal ? `<span class="badge-large">${discountVal}% OFF</span>` : ''}
        </div>
      </div>

      <!-- RIGHT: PRODUCT DETAILS - AMAZON STYLE -->
      <div class="product-info-amazon">
        <h1 class="product-title">${p.name}</h1>
        
        <div class="rating-and-reviews">
          <span class="stars">${renderStars(p.rating||0)}</span>
          ${p.reviews?.length ? `<span class="review-count">${p.reviews.length} ${p.reviews.length === 1 ? 'review' : 'reviews'}</span>` : '<span class="review-count">No reviews yet</span>'}
        </div>

        <div class="price-section">
          <span class="price-current">${formatCurrency(p.price)}</span>
          ${p.mrp ? `<span class="price-mrp">${formatCurrency(p.mrp)}</span>` : ''}
          ${discountVal ? `<span class="discount-badge">${discountVal}% OFF</span>` : ''}
        </div>

        <div class="delivery-info-amazon">
          <div class="delivery-row">
            <i class="fas fa-shipping-fast"></i>
            <span>Free delivery above ₹999 | Standard: 3-5 days</span>
          </div>
          <div class="delivery-row">
            <i class="fas fa-undo"></i>
            <span>7-Day Returns | Easy exchange</span>
          </div>
          <div class="delivery-row">
            <i class="fas fa-shield-alt"></i>
            <span>100% Authentic | GST Invoice Available</span>
          </div>
        </div>

        <div class="stock-info">
          <strong>Availability:</strong> 
          <span class="${p.stock > 10 ? 'stock-available' : p.stock > 0 ? 'stock-limited' : 'stock-unavailable'}">
            ${p.stock > 10 ? '✓ In Stock' : p.stock > 0 ? `⚠ Only ${p.stock} left` : '✗ Out of Stock'}
          </span>
        </div>

        <div class="product-actions">
          <button class="btn-add-to-cart" onclick="addToCart('${p.id}')" ${p.stock===0?'disabled':''}>
            <i class="fas fa-shopping-bag"></i> Add to Cart
          </button>
          <button class="btn-wishlist-large" onclick="toggleWishlist('${p.id}',this)">
            <i class="fas fa-heart"></i> Wishlist
          </button>
        </div>

        <div class="product-specs">
          <div class="spec-row">
            <span class="spec-label">Category:</span>
            <span class="spec-value">${p.category}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">Style:</span>
            <span class="spec-value">Premium Handcrafted</span>
          </div>
        </div>

        <!-- PREMIUM ACCORDION SECTION -->
        <div class="specs-accordion" style="margin-top:2rem;border-top:1px solid var(--border);">
          <div class="spec-item active" style="border-bottom:1px solid var(--border);">
            <div class="spec-header" onclick="toggleSpec(this)" style="padding:15px 0;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:700;font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--dark);">
              <span>✦ Description</span>
              <i class="fas fa-chevron-down" style="font-size:.8rem;transition:transform .3s;"></i>
            </div>
            <div class="spec-body" style="padding-bottom:15px;color:var(--gray);line-height:1.6;font-size:.95rem;">
              ${p.description || 'No description available.'}
            </div>
          </div>
          <div class="spec-item" style="border-bottom:1px solid var(--border);">
            <div class="spec-header" onclick="toggleSpec(this)" style="padding:15px 0;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:700;font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--dark);">
              <span>✦ Product Information</span>
              <i class="fas fa-chevron-down" style="font-size:.8rem;transition:transform .3s;"></i>
            </div>
            <div class="spec-body" style="padding-bottom:15px;display:none;">
              <table class="details-table" style="width:100%;font-size:.9rem;border-collapse:collapse;">
                <tr style="border-bottom:1px solid #f9f9f9;"><td style="padding:8px 0;color:var(--gray);width:40%;">Category</td><td style="padding:8px 0;font-weight:600;text-transform:capitalize;">${p.category}</td></tr>
                <tr style="border-bottom:1px solid #f9f9f9;"><td style="padding:8px 0;color:var(--gray);">Material</td><td style="padding:8px 0;font-weight:600;">Premium Alloy / Gold Plated</td></tr>
                <tr style="border-bottom:1px solid #f9f9f9;"><td style="padding:8px 0;color:var(--gray);">Occasion</td><td style="padding:8px 0;font-weight:600;">Wedding / Party / Festive</td></tr>
                <tr><td style="padding:8px 0;color:var(--gray);">Finish</td><td style="padding:8px 0;font-weight:600;">High Gloss Premium</td></tr>
              </table>
            </div>
          </div>
          <div class="spec-item" style="border-bottom:1px solid var(--border);">
            <div class="spec-header" onclick="toggleSpec(this)" style="padding:15px 0;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:700;font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--dark);">
              <span>✦ Shipping & Returns</span>
              <i class="fas fa-chevron-down" style="font-size:.8rem;transition:transform .3s;"></i>
            </div>
            <div class="spec-body" style="padding-bottom:15px;display:none;color:var(--gray);font-size:.9rem;line-height:1.6;">
              <ul style="padding-left:1.5rem;margin:5px 0;">
                <li>Free shipping on all orders above ₹999.</li>
                <li>Estimated delivery time: 3-5 business days across India.</li>
                <li>7-day easy returns and exchange policy.</li>
                <li>GST invoice will be provided with the package.</li>
              </ul>
            </div>
          </div>
        </div>

        ${p.description ? `
          <div class="about-section">
            <h3>About This Item</h3>
            <ul class="about-list">
              <li>Premium artificial jewellery with authentic gemstone designs</li>
              <li>Anti-allergic & skin-friendly composition</li>
              <li>Lightweight and comfortable for all-day wear</li>
              <li><strong>${p.name}</strong> - Perfect for weddings, parties, and daily wear</li>
              <li>Handcrafted with precision and love</li>
              <li>7-Day Returns | Easy exchange policy available</li>
              <li>GST Invoice provided with every order</li>
            </ul>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- REVIEWS SECTION BELOW -->
    <div class="reviews-section">
      <h2>Customer Reviews</h2>
      <div id="reviews-list">`
      + (p.reviews && p.reviews.length ? p.reviews.map(r=>`
        <div class="review-card">
          <div class="review-header">
            <span class="reviewer-name">${r.userName}</span>
            <div class="stars" style="font-size:.85rem;">${renderStars(r.rating)}</div>
            <span class="review-date">${formatDate(r.date)}</span>
          </div>
          <p class="review-text">${r.comment}</p>
        </div>`).join('') : '<p style="color:var(--gray);">No reviews yet. Be the first to review!</p>')
      + `</div>
      <div class="add-review">
        <h3>Write a Review</h3>
        <div class="form-group"><label>Rating</label>
          <div id="star-picker" style="display:flex;gap:.5rem;font-size:1.5rem;color:#ddd;cursor:pointer;">
            ${[1,2,3,4,5].map(n=>`<span onclick="setReviewRating(${n})" onmouseover="hoverRating(${n})" onmouseout="resetRatingHover()" data-val="${n}">★</span>`).join('')}
          </div>
          <input type="hidden" id="review-rating" value="5"/>
        </div>
        <div class="form-group"><label>Your Review</label><textarea id="review-comment" rows="3" placeholder="Share your experience..." style="resize:none;"></textarea></div>
        <button class="btn-primary" onclick="submitReview('${p.id}')">Submit Review</button>
        <div style="text-align:center;padding:1rem;background:var(--beige);border-radius:10px;color:var(--rose-dark);cursor:pointer;margin-top:1rem;" onclick="showAddReview('${p.id}')">Write a Review</div>
      </div>
    </div>

    <!-- RECOMMENDED PRODUCTS SECTION -->
    <div style="margin-top:5rem;">
      <div class="section-header reveal">
        <h2 class="section-title">Recommended For You</h2>
        <div class="divider"></div>
        <p class="section-desc">Handpicked styles to complete your look</p>
      </div>
      <div class="products-grid" id="recommended-grid">
         <div style="grid-column:1/-1;text-align:center;color:var(--gray);">Looking for matching styles...</div>
      </div>
    </div>
  </div>`;

  window.scrollTo(0, 0);
  initScrollReveal();
  loadRecommended(p.category, p.id);
}

async function loadRecommended(category, currentId) {
  const grid = document.getElementById('recommended-grid');
  if (!grid) return;
  try {
    const products = await api('/api/products');
    if (products && products.length > 0) {
      const filtered = products.filter(item => item.id !== currentId).slice(0, 4);
      grid.innerHTML = filtered.map(item => `
        <div class="product-card reveal" onclick="navigate('/product/${item.id}')">
          <div class="product-img-wrap">
            <img class="product-img" src="${item.images[0]}" alt="${item.name}"/>
            ${item.discount ? `<div class="product-badge">${item.discount}% OFF</div>` : ''}
          </div>
          <div class="product-body">
            <div class="product-name">${item.name}</div>
            <div class="product-price">
               <span class="price-current">${formatCurrency(item.price)}</span>
               <span class="price-mrp">${formatCurrency(item.mrp)}</span>
            </div>
            <button class="btn-primary full-width">View Details</button>
          </div>
        </div>
      `).join('');
      initScrollReveal();
    } else {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;">More products coming soon!</div>';
    }
  } catch (err) {
    console.error('Recommended error:', err);
  }
}

function setThumb(el, src) {
  document.querySelectorAll('.gallery-thumbs-top .thumb-item').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('main-product-img').src = src;
}

function setReviewRating(n) {
  document.getElementById('review-rating').value = n;
  document.querySelectorAll('#star-picker span').forEach((s, i) => {
    s.style.color = i < n ? 'var(--gold)' : '#ddd';
  });
}
function hoverRating(n) {
  document.querySelectorAll('#star-picker span').forEach((s, i) => {
    s.style.color = i < n ? 'var(--gold-light)' : '#ddd';
  });
}
function resetRatingHover() {
  const val = parseInt(document.getElementById('review-rating')?.value || 5);
  document.querySelectorAll('#star-picker span').forEach((s, i) => {
    s.style.color = i < val ? 'var(--gold)' : '#ddd';
  });
}

async function submitReview(productId) {
  if (!currentUser) { openAuthModal(); return; }
  const rating = parseInt(document.getElementById('review-rating').value);
  const comment = document.getElementById('review-comment').value;
  if (!comment.trim()) { toast('Please write a review', 'error'); return; }
  const r = await api(`/api/products/${productId}/review`, { method: 'POST', body: { rating, comment } });
  if (r.error) { toast(r.error, 'error'); return; }
  toast('Review submitted! ✦', 'success');
  renderProductDetail(productId);
}

async function buyNow(productId) {
  if (!currentUser) { openAuthModal(); return; }
  await addToCart(productId, false);
  navigate('/checkout');
}

/* ── CART PAGE ────────────────────────────────────────────── */
async function renderCart() {
  if (!currentUser) { openAuthModal(); navigate('/'); return; }
  const app = document.getElementById('app');
  app.innerHTML = '<div class="page-wrap"><div style="text-align:center;padding:3rem;color:var(--gray);">Loading cart...</div></div>';
  const r = await api('/api/cart');
  const items = r.items || [];
  if (!items.length) {
    app.innerHTML = `<div class="page-wrap"><h1 class="page-title">My Cart</h1><div class="empty-state"><div class="empty-icon">🛍️</div><h3>Your cart is empty</h3><p>Add some beautiful jewellery to your cart!</p><button class="btn-primary" onclick="navigate('/products')">Shop Now</button></div></div>`;
    return;
  }
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 49;
  let discount = 0;
  app.innerHTML = `
  <div class="page-wrap">
    <h1 class="page-title">My Cart <span style="font-size:1.2rem;color:var(--gray);">(${items.length} items)</span></h1>
    <div class="cart-layout">
      <div>
        <div class="cart-items" id="cart-items-list">
          ${items.map(i => `
          <div class="cart-item" id="ci-${i.productId}">
            <img class="cart-item-img" src="${i.product.images[0]}" alt="${i.product.name}" onclick="navigate('/product/${i.productId}')" style="cursor:pointer;"/>
            <div class="cart-item-info">
              <div class="cart-item-name">${i.product.name}</div>
              <div class="cart-item-cat">${i.product.category}</div>
              <div class="qty-control" style="margin-top:.5rem;">
                <button class="qty-btn" onclick="updateQty('${i.productId}',${i.quantity-1})"><i class="fas fa-minus" style="font-size:.7rem;"></i></button>
                <span class="qty-num">${i.quantity}</span>
                <button class="qty-btn" onclick="updateQty('${i.productId}',${i.quantity+1})"><i class="fas fa-plus" style="font-size:.7rem;"></i></button>
              </div>
              <button class="cart-remove" onclick="removeFromCart('${i.productId}')"><i class="fas fa-trash" style="font-size:.8rem;"></i> Remove</button>
            </div>
            <div class="cart-item-price">${formatCurrency(i.product.price * i.quantity)}</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="cart-summary">
        <div class="summary-title">Order Summary</div>
        <div class="summary-row"><span>Subtotal (${items.length} items)</span><span>${formatCurrency(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span style="color:${shipping===0?'#22c55e':'inherit'}">${shipping===0?'FREE':formatCurrency(shipping)}</span></div>
        <div class="summary-row" id="discount-row" style="display:none;color:#22c55e;"><span>Discount</span><span id="discount-amt">-₹0</span></div>
        <div class="coupon-row">
          <input id="coupon-input" placeholder="Coupon code" style="text-transform:uppercase;"/>
          <button class="btn-primary btn-sm" onclick="applyCoupon(${subtotal})">Apply</button>
        </div>
        <div id="coupon-msg" style="font-size:.8rem;margin-bottom:.5rem;"></div>
        <div class="summary-row"><span class="summary-total">Grand Total</span><span class="summary-total" id="grand-total">${formatCurrency(subtotal+shipping)}</span></div>
        ${subtotal < 999 ? `<p style="font-size:.75rem;color:var(--gray);margin:.75rem 0;">Add ${formatCurrency(999-subtotal)} more for FREE shipping!</p>` : ''}
        <button class="btn-primary full-width" style="margin-top:.75rem;" onclick="navigate('/checkout')">Proceed to Checkout <i class="fas fa-arrow-right"></i></button>
        <button class="btn-outline full-width" style="margin-top:.5rem;" onclick="navigate('/products')">Continue Shopping</button>
      </div>
    </div>
  </div>`;
}

async function updateQty(productId, qty) {
  await api('/api/cart/update', { method: 'PUT', body: { productId, quantity: qty } });
  updateCartCount();
  renderCart();
}

async function removeFromCart(productId) {
  await api(`/api/cart/${productId}`, { method: 'DELETE' });
  toast('Item removed from cart', 'info');
  updateCartCount();
  renderCart();
}

async function applyCoupon(amount) {
  const code = document.getElementById('coupon-input').value;
  const r = await api('/api/coupon/validate', { method: 'POST', body: { code, amount } });
  const msg = document.getElementById('coupon-msg');
  if (r.error) { msg.style.color = '#ef4444'; msg.textContent = r.error; return; }
  msg.style.color = '#22c55e';
  msg.textContent = `✓ Coupon applied! Saved ${formatCurrency(r.discountAmt)}`;
  document.getElementById('discount-row').style.display = 'flex';
  document.getElementById('discount-amt').textContent = '-' + formatCurrency(r.discountAmt);
  const subtotal = amount;
  const shipping = subtotal >= 999 ? 0 : 49;
  document.getElementById('grand-total').textContent = formatCurrency(subtotal + shipping - r.discountAmt);
  sessionStorage.setItem('coupon', JSON.stringify({ code, discountAmt: r.discountAmt }));
}

/* ── CHECKOUT PAGE ────────────────────────────────────────── */
function ensureRazorpayLoaded() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-sdk="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => reject(new Error('Razorpay SDK failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.defer = true;
    script.dataset.razorpaySdk = '1';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.head.appendChild(script);
  });
}

async function renderCheckout() {
  if (!currentUser) { openAuthModal(); navigate('/'); return; }
  const r = await api('/api/cart');
  const items = r.items || [];
  if (!items.length) { navigate('/cart'); return; }
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const gst = items.reduce((s, i) => s + (i.product.price * (i.product.gstRate||3)/100 * i.quantity), 0);
  const shipping = subtotal >= 999 ? 0 : 49;
  const couponData = JSON.parse(sessionStorage.getItem('coupon') || 'null');
  const discount = couponData?.discountAmt || 0;
  const grand = subtotal + gst + shipping - discount;
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="page-wrap">
    <h1 class="page-title">Checkout</h1>
    <div class="checkout-layout">
      <div>
        <div class="checkout-section">
          <h3><i class="fas fa-map-marker-alt" style="color:var(--rose);margin-right:.5rem;"></i> Delivery Address</h3>
          <div class="form-row">
            <div class="form-group"><label>Full Name</label><input id="co-name" value="${currentUser.name||''}" placeholder="Full name"/></div>
            <div class="form-group"><label>Phone</label><input id="co-phone" type="tel" value="${currentUser.phone||''}" placeholder="+91 9876543210"/></div>
          </div>
          <div class="form-group"><label>Address Line 1</label><input id="co-addr1" placeholder="House no., Building, Street"/></div>
          <div class="form-group"><label>Address Line 2</label><input id="co-addr2" placeholder="Area, Colony, Landmark"/></div>
          <div class="form-row">
            <div class="form-group"><label>City</label><input id="co-city" placeholder="City"/></div>
            <div class="form-group"><label>State</label><input id="co-state" placeholder="State"/></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>PIN Code</label><input id="co-pin" placeholder="400001"/></div>
            <div class="form-group"><label>Country</label><input id="co-country" value="India" readonly/></div>
          </div>
        </div>
        <div class="checkout-section">
          <h3><i class="fas fa-credit-card" style="color:var(--rose);margin-right:.5rem;"></i> Payment Method</h3>
          <div class="payment-options">
            <div class="payment-option selected" id="pay-online" onclick="selectPayment('online')">
              <input type="radio" name="pay" checked/><span class="pay-icon">✨</span><label>Online Payment (UPI, Cards, Netbanking)</label>
            </div>
            <div class="payment-option" id="pay-cod" onclick="selectPayment('cod')">
              <input type="radio" name="pay"/><span class="pay-icon">💵</span><label>Cash on Delivery (COD)</label>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="cart-summary" style="position:sticky;top:90px;">
          <div class="summary-title">Order Summary</div>
          <div class="checkout-order-items">
            ${items.map(i=>`<div class="co-item"><img src="${i.product.images[0]}" alt="${i.product.name}"/><div class="co-item-info"><div class="co-item-name">${i.product.name}</div><div class="co-item-meta">Qty: ${i.quantity}</div></div><div class="co-item-price">${formatCurrency(i.product.price*i.quantity)}</div></div>`).join('')}
          </div>
          <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
          <div class="summary-row"><span>GST (3%)</span><span>${formatCurrency(gst)}</span></div>
          <div class="summary-row"><span>Shipping</span><span style="color:${shipping===0?'#22c55e':'inherit'}">${shipping===0?'FREE':formatCurrency(shipping)}</span></div>
          ${discount?`<div class="summary-row" style="color:#22c55e;"><span>Discount (${couponData.code})</span><span>-${formatCurrency(discount)}</span></div>`:''}
          <div class="summary-row"><span class="summary-total">Grand Total</span><span class="summary-total">${formatCurrency(grand)}</span></div>
          <button class="btn-gold full-width" style="margin-top:1rem;" onclick="placeOrder()"><i class="fas fa-check-circle"></i> Place Order</button>
          <p style="font-size:.75rem;color:var(--gray);text-align:center;margin-top:.75rem;"><i class="fas fa-lock"></i> 100% Secure & Encrypted</p>
        </div>
      </div>
    </div>
  </div>`;
}

let selectedPayment = 'online';
function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('pay-' + method).classList.add('selected');
  document.getElementById('pay-' + method).querySelector('input').checked = true;
}

async function placeOrder() {
  const name = document.getElementById('co-name')?.value;
  const phone = document.getElementById('co-phone')?.value;
  const addr1 = document.getElementById('co-addr1')?.value;
  const city = document.getElementById('co-city')?.value;
  const state = document.getElementById('co-state')?.value;
  const pin = document.getElementById('co-pin')?.value;
  if (!name || !phone || !addr1 || !city || !state || !pin) { toast('Please fill all address fields', 'error'); return; }
  
  const r = await api('/api/cart');
  const items = r.items || [];
  const couponData = JSON.parse(sessionStorage.getItem('coupon') || 'null');
  const address = `${name}, ${addr1}, ${document.getElementById('co-addr2')?.value||''}, ${city}, ${state} - ${pin}, India. Ph: ${phone}`;
  const orderItems = items.map(i => ({ productId: i.productId, quantity: i.quantity }));

  // 1. Create Order record (status: pending if online)
  const result = await api('/api/orders', { method: 'POST', body: { address, paymentMethod: selectedPayment, items: orderItems, couponCode: couponData?.code } });
  if (result.error) { toast(result.error, 'error'); return; }
  
  const order = result.order;

  if (selectedPayment === 'cod') {
    handleOrderSuccess(order);
  } else {
    // 2. Handle Razorpay
    try {
      await ensureRazorpayLoaded();
      const publicSettings = await api('/api/settings/public');
      // Create Razorpay Order
      const rzpOrder = await api('/api/razorpay/order', { method: 'POST', body: { amount: order.grandTotal, receipt: order.id } });
      
      const options = {
        key: publicSettings.razorpayKeyId || 'rzp_test_6oE5E0WwH6wX9z',
        amount: rzpOrder.amount,
        currency: "INR",
        name: "Lencho India",
        description: `Order #${order.id}`,
        image: "/favicon.svg",
        order_id: rzpOrder.id,
        handler: async function (response) {
          // 3. Verify Payment
          const verify = await api('/api/razorpay/verify', { 
            method: 'POST', 
            body: { ...response, orderId: order.id } 
          });
          if (verify.success) {
            handleOrderSuccess(order);
          } else {
            toast('Payment verification failed. Contact support.', 'error');
          }
        },
        prefill: { name: currentUser.name, email: currentUser.email, contact: currentUser.phone },
        theme: { color: "#c9748f" }
      };
      const rzp1 = new Razorpay(options);
      rzp1.open();
    } catch (err) {
      toast('Payment gateway initialization failed', 'error');
      console.error(err);
    }
  }
}

function handleOrderSuccess(order) {
  sessionStorage.removeItem('coupon');
  updateCartCount();
  toast('Order placed successfully! 🎉', 'success', 5000);
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="page-wrap" style="text-align:center;padding-top:80px;">
    <div style="font-size:5rem;margin-bottom:1.5rem;animation:popIn .5s ease;">✅</div>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:2.5rem;margin-bottom:1rem;">Order Placed!</h1>
    <p style="color:var(--gray);font-size:1.1rem;margin-bottom:.5rem;">Your order <strong style="color:var(--rose-dark);">${order.id}</strong> is confirmed!</p>
    <p style="color:var(--gray);margin-bottom:2rem;">Expected delivery: ${formatDate(order.estimatedDelivery)}</p>
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
      <button class="btn-primary" onclick="navigate('/dashboard')">My Orders</button>
      <button class="btn-outline" onclick="navigate('/track')">Track Order</button>
      <button class="btn-outline" onclick="navigate('/products')">Shop More</button>
    </div>
  </div>`;
}

/* ── ORDER TRACKING ───────────────────────────────────────── */
function renderTrack() {
  document.getElementById('app').innerHTML = `
  <div class="track-page">
    <div class="section-eyebrow">Order Status</div>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:2.5rem;">Track Your Order</h1>
    <p style="color:var(--gray);margin-bottom:0;">Enter your Order ID to get real-time tracking updates</p>
    <div class="track-search">
      <input id="track-input" placeholder="Enter Order ID (e.g. LEN12345678)" onkeydown="if(event.key==='Enter')trackOrder()"/>
      <button class="btn-primary" onclick="trackOrder()"><i class="fas fa-search"></i></button>
    </div>
    <div id="track-result"></div>
  </div>`;
}

async function trackOrder() {
  const id = document.getElementById('track-input')?.value?.trim();
  if (!id) { toast('Please enter Order ID', 'error'); return; }
  const order = await api('/api/orders/track/' + id);
  const el = document.getElementById('track-result');
  if (order.error) { el.innerHTML = `<div style="color:#ef4444;padding:1.5rem;background:#fee2e2;border-radius:var(--radius);margin-top:1rem;">${order.error}</div>`; return; }
  const statusClass = 'status-' + order.status;
  const statusLabels = { placed:'Order Placed', confirmed:'Confirmed', shipped:'Shipped', out_for_delivery:'Out for Delivery', delivered:'Delivered ✓', cancelled:'Cancelled' };
  el.innerHTML = `
  <div class="order-status-card">
    <div class="order-id-display">ORDER ID: ${order.id}</div>
    <span class="order-status-badge ${statusClass}">${statusLabels[order.status] || order.status}</span>
    ${order.deliveryPartner ? `<p style="font-size:.875rem;color:var(--gray);margin-bottom:1rem;"><i class="fas fa-truck"></i> ${order.deliveryPartner} ${order.trackingNumber?'· Tracking: '+order.trackingNumber:''}</p>` : ''}
    <p style="font-size:.875rem;color:var(--gray);">Estimated Delivery: <strong>${formatDate(order.estimatedDelivery)}</strong></p>
    <div class="timeline">
      ${(order.timeline||[]).map(t=>`
      <div class="timeline-item ${t.done?'done':''}">
        <div class="timeline-dot"><i class="fas fa-${t.done?'check':'circle'}" style="font-size:.65rem;"></i></div>
        <div class="timeline-content"><div class="timeline-label">${t.label}</div><div class="timeline-date">${t.date?formatDate(t.date):''}</div></div>
      </div>`).join('')}
      ${['confirmed','shipped','out_for_delivery','delivered'].filter(s=>!(order.timeline||[]).find(t=>t.status===s)).map(s=>`
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content"><div class="timeline-label" style="color:var(--gray);">${statusLabels[s]}</div></div>
      </div>`).join('')}
    </div>
    ${order.status==='delivered'?`<div style="margin-top:1.5rem;padding:1rem;background:#dcfce7;border-radius:var(--radius-sm);text-align:center;color:#166534;font-weight:600;">🎉 Your order has been delivered! We hope you love it!</div>`:''}
  </div>`;
}

/* ── CONTACT PAGE ─────────────────────────────────────────── */
function renderContact() {
  document.getElementById('app').innerHTML = `
  <div class="page-wrap">
    <h1 style="font-family:'Playfair Display',serif;font-size:2.8rem;text-align:center;margin-bottom:.5rem;">Contact Us</h1>
    <p style="text-align:center;color:var(--gray);margin-bottom:3rem;">We would love to hear from you. Get in touch with us!</p>
    
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:2.5rem;background:#fff;padding:3rem;border-radius:24px;box-shadow:var(--shadow-md);">
      
      <!-- Contact Info Left -->
      <div>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.8rem;margin-bottom:1.5rem;color:var(--rose-dark);">Get in Touch</h3>
        <p style="color:var(--gray);line-height:1.8;margin-bottom:2rem;">Have questions about our collections, your order, or just want to say hi? We're here to help.</p>
        
        <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;">
          <div style="width:40px;height:40px;background:var(--rose-light);color:var(--rose-dark);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;"><i class="fas fa-map-marker-alt"></i></div>
          <div>
            <h4 style="font-size:1.05rem;margin-bottom:.25rem;">Our Store</h4>
            <p style="color:var(--gray);font-size:.9rem;">197 Sarakpur<br/>Barara, Ambala<br/>Haryana, India</p>
          </div>
        </div>
        
        <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;">
          <div style="width:40px;height:40px;background:var(--gold-light);color:var(--gold-dark);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;"><i class="fas fa-envelope"></i></div>
          <div>
            <h4 style="font-size:1.05rem;margin-bottom:.25rem;">Email Us</h4>
            <p style="color:var(--gray);font-size:.9rem;"><a href="mailto:lencho.official01@gmail.com" style="color:var(--rose);">lencho.official01@gmail.com</a><br/>Support: <a href="mailto:support@lenchoindia.com" style="color:var(--rose);">support@lenchoindia.com</a></p>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;gap:1rem;">
          <div style="width:40px;height:40px;background:#e0f2fe;color:#0284c7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;"><i class="fas fa-phone-alt"></i></div>
          <div>
            <h4 style="font-size:1.05rem;margin-bottom:.25rem;">Call Us</h4>
            <p style="color:var(--gray);font-size:.9rem;">+91 7404217625<br/>Mon-Sat: 10:00 AM - 7:00 PM</p>
          </div>
        </div>
      </div>
      
      <!-- Contact Form Right -->
      <div>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.8rem;margin-bottom:1.5rem;color:var(--rose-dark);">Send a Message</h3>
        <div class="form-group"><label>Your Name *</label><input type="text" placeholder="Enter your name" id="contact-name"/></div>
        <div class="form-group"><label>Email Address *</label><input type="email" placeholder="example@domain.com" id="contact-email"/></div>
        <div class="form-group"><label>Phone Number (Optional)</label><input type="tel" placeholder="+91 00000 00000" id="contact-phone"/></div>
        <div class="form-group"><label>Your Message *</label><textarea rows="4" placeholder="How can we help you?" id="contact-message" style="resize:vertical;"></textarea></div>
        <button class="btn-primary full-width" onclick="submitContact()"><i class="fas fa-paper-plane" style="margin-right:.5rem;"></i> Send Message</button>
      </div>

    </div>
  </div>`;
  initScrollReveal();
}

async function submitContact() {
  console.log('✦ Inquiry Submitted');
  const n = document.getElementById('contact-name').value;
  const e = document.getElementById('contact-email').value;
  const p = document.getElementById('contact-phone').value;
  const m = document.getElementById('contact-message').value;
  if(!n || !e || !m) { toast('Please fill in name, email and message.', 'error'); return; }
  
  const b = document.querySelector('.track-page button') || { disabled: false, textContent: '' };
  const resp = await api('/api/contact', { method: 'POST', body: { name: n, email: e, phone: p, message: m } });
  
  if (resp.error) {
    toast(resp.error, 'error');
  } else {
    toast('Your message has been sent successfully! We will get back to you soon. 💌', 'success');
    // Clear form
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-email').value = '';
    document.getElementById('contact-message').value = '';
    document.getElementById('contact-phone').value = '';
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

function toggleSpec(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('i');
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

// ── LEGAL PAGE SHARED STYLE ──────────────────────────────────
function legalPageHTML(title, eyebrow, content) {
  return `
  <div style="min-height:70vh; padding:8rem 5% 5rem; max-width:860px; margin:0 auto;">
    <div style="text-align:center; margin-bottom:3rem;">
      <div style="display:inline-block; background:linear-gradient(135deg,var(--rose),var(--dark-rose)); color:#fff; padding:6px 22px; border-radius:99px; font-size:.78rem; letter-spacing:.2em; font-weight:700; margin-bottom:1rem; text-transform:uppercase;">${eyebrow}</div>
      <h1 style="font-family:'Playfair Display',serif; font-size:clamp(2rem,5vw,3rem); color:var(--dark); margin-bottom:0;">${title}</h1>
      <div style="width:60px; height:3px; background:linear-gradient(90deg,var(--rose),var(--gold)); margin:1rem auto 0; border-radius:99px;"></div>
    </div>
    <div style="background:#fff; border-radius:24px; padding:2.5rem 3rem; box-shadow:0 8px 40px rgba(0,0,0,.07); line-height:1.9; color:#444; font-size:1rem;">
      ${content}
    </div>
    <div style="text-align:center; margin-top:2.5rem;">
      <button class="btn-primary" onclick="navigate('/')" style="padding:14px 36px;">← Back to Home</button>
    </div>
  </div>`;
}

// ── TERMS & CONDITIONS ────────────────────────────────────────
function renderTerms() {
  const app = document.getElementById('app');
  app.innerHTML = legalPageHTML('Terms & Conditions', 'Legal', `
    <p style="color:#888; font-size:.88rem; margin-bottom:1.5rem;">Last Updated: April 2026</p>
    <p>Welcome to <strong>Lencho</strong> — India's premium artificial jewellery brand. By accessing or using our website (<a href="/" style="color:var(--rose);">lencho.in</a>), you agree to the following terms and conditions. Please read them carefully.</p>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">1. Use of Website</h3>
    <ul style="padding-left:1.5rem;">
      <li>You must be at least 18 years old to place orders, or have parental consent.</li>
      <li>You agree to provide accurate, current, and complete information when placing orders.</li>
      <li>You must not misuse our website, attempt to hack, overload, or damage our systems.</li>
    </ul>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">2. Orders & Payments</h3>
    <ul style="padding-left:1.5rem;">
      <li>All prices on Lencho are listed in Indian Rupees (₹) and include applicable taxes.</li>
      <li>We reserve the right to cancel or refuse any order at our discretion, including fraudulent or fake orders.</li>
      <li>Prices and product availability are subject to change without prior notice.</li>
      <li>Payments must be made through approved methods listed on our checkout page.</li>
    </ul>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">3. Returns & Refunds</h3>
    <ul style="padding-left:1.5rem;">
      <li>We offer a 7-day easy return policy on all delivered products.</li>
      <li>Products must be returned in their original condition with original packaging.</li>
      <li>Refunds will be processed within 5–7 business days of receiving the return.</li>
    </ul>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">4. Intellectual Property</h3>
    <p>All content on this website — including images, logos, text, designs — is the exclusive property of Lencho. Reproduction or redistribution without written permission is prohibited.</p>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">5. Governing Law</h3>
    <p>These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of courts in India.</p>

    <p style="margin-top:2rem; padding:1rem; background:#fdf5f7; border-radius:12px; border-left:4px solid var(--rose); font-size:.9rem;">By using our website, you agree to follow these terms and conditions. If you do not agree, please discontinue use of the website.</p>
  `);
  window.scrollTo(0,0);
}

// ── PRIVACY POLICY ────────────────────────────────────────────
function renderPrivacy() {
  const app = document.getElementById('app');
  app.innerHTML = legalPageHTML('Privacy Policy', 'Your Privacy', `
    <p style="color:#888; font-size:.88rem; margin-bottom:1.5rem;">Last Updated: April 2026</p>
    <p>At <strong>Lencho</strong>, we deeply respect your privacy. This policy explains how we collect, use, and protect your personal information when you shop with us.</p>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">1. Information We Collect</h3>
    <ul style="padding-left:1.5rem;">
      <li><strong>Personal Details:</strong> Name, email address, phone number, and delivery address when you create an account or place an order.</li>
      <li><strong>Payment Info:</strong> We do not store card details. Payments are processed securely through trusted payment gateways.</li>
      <li><strong>Usage Data:</strong> We may collect browsing data (pages visited, time spent) to improve your shopping experience.</li>
    </ul>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">2. How We Use Your Information</h3>
    <ul style="padding-left:1.5rem;">
      <li>To process and deliver your orders.</li>
      <li>To send order confirmations, shipping updates, and OTP verifications via email.</li>
      <li>To personalise your shopping experience on Lencho.</li>
      <li>To respond to your queries and customer support requests.</li>
    </ul>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">3. Data Security</h3>
    <p>We implement industry-standard security measures to protect your personal data. Your password is encrypted and we never store it in plain text.</p>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">4. Data Sharing</h3>
    <ul style="padding-left:1.5rem;">
      <li>We do <strong>not</strong> sell your personal data to third parties.</li>
      <li>Data may be shared only with trusted delivery partners to fulfil your orders.</li>
      <li>We may disclose information if required by law or government authority.</li>
    </ul>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">5. Cookies</h3>
    <p>We use cookies to maintain your session and improve site performance. You can disable cookies in your browser settings, but this may affect some website features.</p>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">6. Your Rights</h3>
    <p>You may request deletion of your account and personal data by contacting us at <a href="mailto:lencho.official01@gmail.com" style="color:var(--rose);">lencho.official01@gmail.com</a>.</p>

    <p style="margin-top:2rem; padding:1rem; background:#fdf5f7; border-radius:12px; border-left:4px solid var(--rose); font-size:.9rem;">By using our website, you consent to the practices described in this Privacy Policy.</p>
  `);
  window.scrollTo(0,0);
}

// ── DISCLAIMER ────────────────────────────────────────────────
function renderDisclaimer() {
  const app = document.getElementById('app');
  app.innerHTML = legalPageHTML('Disclaimer', 'Important Notice', `
    <p style="color:#888; font-size:.88rem; margin-bottom:1.5rem;">Last Updated: April 2026</p>
    <p>The information provided on the <strong>Lencho</strong> website is for general informational and shopping purposes only. Please read this disclaimer carefully.</p>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">1. Product Accuracy</h3>
    <ul style="padding-left:1.5rem;">
      <li>We strive to ensure all product information, descriptions, and pricing are accurate. However, errors may occasionally occur.</li>
      <li>Product colours may appear slightly different on your screen due to monitor settings and photography lighting.</li>
      <li>Product images are for representation purposes only and actual product may have minor visual differences.</li>
    </ul>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">2. No Warranty</h3>
    <p>Lencho provides artificial jewellery products "as is" without any warranty of specific durability or fitness for a particular purpose beyond what is described on the product page.</p>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">3. Limitation of Liability</h3>
    <ul style="padding-left:1.5rem;">
      <li>Lencho is not responsible for any direct, indirect, or incidental damages arising from use of our website.</li>
      <li>We are not liable for delays caused by courier partners, natural events, or circumstances beyond our control.</li>
    </ul>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">4. External Links</h3>
    <p>Our website may contain links to third-party websites. Lencho is not responsible for the content or privacy practices of those external sites.</p>

    <h3 style="color:var(--dark); margin-top:2rem; font-family:'Playfair Display',serif;">5. Changes to This Disclaimer</h3>
    <p>We reserve the right to update this disclaimer at any time. Changes will be reflected on this page with a revised date.</p>

    <p style="margin-top:2rem; padding:1rem; background:#fdf5f7; border-radius:12px; border-left:4px solid var(--rose); font-size:.9rem;">By continuing to use this website, you accept this disclaimer in full. For any queries, contact us at <a href="mailto:lencho.official01@gmail.com" style="color:var(--rose);">lencho.official01@gmail.com</a>.</p>
  `);
  window.scrollTo(0,0);
}
