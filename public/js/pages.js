// ── PRODUCT DETAIL ────────────────────────────────────────
async function renderProductDetail(id) {
  const app = document.getElementById('app');
  const p = await api(`/api/products/${id}`);
  if (p.error) return app.innerHTML = `<div class="container" style="padding:10rem 0;text-align:center;"><h2>Product Not Found</h2><button class="btn-primary" onclick="navigate('/products')">Back to Shop</button></div>`;

  const discountVal = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  app.innerHTML = `
  <div class="product-detail-container container reveal">
    <div class="product-detail-grid">
      <!-- LEFT: IMAGES -->
      <div class="product-gallery">
        <div class="main-img-wrap">
          <img id="main-product-img" src="${p.images[0]}" alt="${p.name}"/>
          ${discountVal ? `<span class="badge-large">${discountVal}% OFF</span>` : ''}
        </div>
        <div class="thumb-grid">
          ${p.images.map((img, i) => `
            <div class="thumb ${i === 0 ? 'active' : ''}" onclick="changeMainImg('${img}', this)">
              <img src="${img}" alt="Thumbnail ${i + 1}"/>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- RIGHT: INFO -->
      <div class="product-info">
          <span class="stars" style="font-size:1rem;">${renderStars(p.rating||0)}</span>
          ${p.reviews?.length ? `<span class="rating-count" style="margin-left:6px;">(${p.reviews.length} reviews)</span>` : ''}
        </div>
        <div class="product-price-lg">
          <span class="price-current">${formatCurrency(p.price)}</span>
          ${p.mrp?`<span class="price-mrp">${formatCurrency(p.mrp)}</span>`:''}
          ${p.discount?`<span class="price-off">${p.discount}% off</span>`:''}
        </div>
        <div class="product-description-wrap">
          <p class="product-description desc-collapsed" id="prod-desc">${p.description}</p>
          ${p.description && p.description.length > 150 ? `<span class="see-more-btn" onclick="toggleDesc(this)">See More</span>` : ''}
        </div>
        <div class="product-meta">
          <span><i class="fas fa-box" style="color:var(--rose);width:20px;"></i> <strong>Stock:</strong> ${p.stock > 10 ? 'In Stock' : p.stock > 0 ? `Only ${p.stock} left!` : 'Out of Stock'}</span>
          <span><i class="fas fa-tag" style="color:var(--rose);width:20px;"></i> <strong>Category:</strong> ${p.category}</span>
          <span><i class="fas fa-percent" style="color:var(--rose);width:20px;"></i> <strong>GST:</strong> ${p.gstRate}% (HSN: ${p.hsn})</span>
          <span><i class="fas fa-truck" style="color:var(--rose);width:20px;"></i> <strong>Delivery:</strong> Free on orders ₹999+</span>
        </div>
        <div class="product-ctas">
          <button class="btn-outline" onclick="addToCart('${p.id}')" ${p.stock===0?'disabled':''}>
            <i class="fas fa-shopping-bag"></i> Add to Cart
          </button>
          <button class="btn-gold" onclick="buyNow('${p.id}')" ${p.stock===0?'disabled':''}>
            <i class="fas fa-bolt"></i> Buy Now
          </button>
          <button class="btn-wishlist" onclick="toggleWishlist('${p.id}',this)">
            <i class="fas fa-heart"></i> Add to Wishlist
          </button>
        </div>
        <div style="margin-top:1.5rem;padding:1rem;background:var(--beige);border-radius:var(--radius-sm);font-size:.8rem;display:flex;gap:2rem;">
          <span><i class="fas fa-undo" style="color:var(--rose);"></i> 7-Day Returns</span>
          <span><i class="fas fa-shield-alt" style="color:var(--rose);"></i> 100% Authentic</span>
          <span><i class="fas fa-award" style="color:var(--rose);"></i> Premium Quality</span>
        </div>
      </div>
    </div>

    <!-- REVIEWS -->
    <div class="reviews-section">
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;margin-bottom:1.5rem;">Customer Reviews</h2>
      <div id="reviews-list">
        ${p.reviews && p.reviews.length ? p.reviews.map(r=>`
          <div class="review-card">
            <div class="review-header">
              <div><span class="reviewer-name">${r.userName}</span><div class="stars" style="font-size:.85rem;">${renderStars(r.rating)}</div></div>
              <span class="review-date">${formatDate(r.date)}</span>
            </div>
            <p class="review-text">${r.comment}</p>
          </div>`).join('') : '<p style="color:var(--gray);">No reviews yet. Be the first to review!</p>'}
      </div>
      <div class="add-review">
        <h3 style="font-family:\'Cormorant Garamond\',serif;font-size:1.3rem;margin-bottom:1rem;">Write a Review</h3>
        <div class="form-group"><label>Rating</label>
          <div id="star-picker" style="display:flex;gap:.5rem;font-size:1.5rem;color:#ddd;cursor:pointer;">
            ${[1,2,3,4,5].map(n=>`<span onclick="setReviewRating(${n})" onmouseover="hoverRating(${n})" onmouseout="resetRatingHover()" data-val="${n}">★</span>`).join('')}
          </div>
          <input type="hidden" id="review-rating" value="5"/>
        </div>
        <div class="form-group"><label>Your Review</label><textarea id="review-comment" rows="3" placeholder="Share your experience..." style="resize:none;"></textarea></div>
        <button class="btn-primary" onclick="submitReview('${p.id}')">Submit Review</button>
      </div>
    </div>
  </div>`;
  initScrollReveal();
}

function setThumb(el, src) {
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('main-img').src = src;
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
            <div class="payment-option selected" id="pay-upi" onclick="selectPayment('upi')">
              <input type="radio" name="pay" checked/><span class="pay-icon">📱</span><label>UPI (Google Pay, PhonePe, etc.)</label>
            </div>
            <div class="payment-option" id="pay-card" onclick="selectPayment('card')">
              <input type="radio" name="pay"/><span class="pay-icon">💳</span><label>Credit / Debit Card</label>
            </div>
            <div class="payment-option" id="pay-cod" onclick="selectPayment('cod')">
              <input type="radio" name="pay"/><span class="pay-icon">💵</span><label>Cash on Delivery (COD)</label>
            </div>
          </div>
          <div id="upi-field" style="margin-top:1rem;">
            <div class="form-group"><label>UPI ID</label><input id="upi-id" placeholder="yourname@upi"/></div>
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

let selectedPayment = 'upi';
function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('pay-' + method).classList.add('selected');
  document.getElementById('pay-' + method).querySelector('input').checked = true;
  document.getElementById('upi-field').style.display = method === 'upi' ? 'block' : 'none';
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
  const result = await api('/api/orders', { method: 'POST', body: { address, paymentMethod: selectedPayment, items: orderItems, couponCode: couponData?.code } });
  if (result.error) { toast(result.error, 'error'); return; }
  sessionStorage.removeItem('coupon');
  updateCartCount();
  toast('Order placed successfully! 🎉', 'success', 5000);
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="page-wrap" style="text-align:center;padding-top:80px;">
    <div style="font-size:5rem;margin-bottom:1.5rem;animation:popIn .5s ease;">✅</div>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:2.5rem;margin-bottom:1rem;">Order Placed!</h1>
    <p style="color:var(--gray);font-size:1.1rem;margin-bottom:.5rem;">Your order <strong style="color:var(--rose-dark);">${result.order.id}</strong> is confirmed!</p>
    <p style="color:var(--gray);margin-bottom:2rem;">Expected delivery: ${formatDate(result.order.estimatedDelivery)}</p>
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

function submitContact() {
  const n = document.getElementById('contact-name').value;
  const e = document.getElementById('contact-email').value;
  const m = document.getElementById('contact-message').value;
  if(!n || !e || !m) { toast('Please fill in name, email and message.', 'error'); return; }
  toast('Your message has been sent successfully! We will get back to you soon. 💌', 'success');
  // Clear form
  document.getElementById('contact-name').value = '';
  document.getElementById('contact-email').value = '';
  document.getElementById('contact-message').value = '';
  document.getElementById('contact-phone').value = '';
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
