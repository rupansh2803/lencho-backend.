async function renderAdmin() {
  try {
    const siteHeader = document.getElementById('site-header');
    const siteFooter = document.getElementById('site-footer');
    if (siteHeader) siteHeader.style.display = 'none';
    if (siteFooter) siteFooter.style.display = 'none';

    // 1. Check if setup is required
    const status = await api('/api/admin/check-setup');
    if (status.error) throw new Error(status.error);
    
    if (status.setupRequired) {
      await showAdminSetup();
      return;
    }

    // 2. Normal Login Flow
    if (!currentUser || currentUser.role !== 'admin') {
      await showAdminLogin();
      return;
    }
    buildAdminPanel();
  } catch (err) {
    console.error('Admin Boot Error:', err);
    document.getElementById('app').innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;background:var(--dark);">
        <div style="background:#fff;padding:2.5rem;border-radius:24px;max-width:400px;text-align:center;">
          <h2 style="color:var(--rose-dark);margin-bottom:1rem;">System Boot Error</h2>
          <p style="color:var(--gray);margin-bottom:1.5rem;">The admin module failed to initialize. This usually happens due to connection issues or security conflicts.</p>
          <div style="background:#fef2f2;color:#991b1b;padding:10px;border-radius:8px;font-size:.8rem;margin-bottom:1.5rem;font-family:monospace;">${err.message}</div>
          <button class="btn-primary full-width" onclick="location.reload()">Reload Admin Panel</button>
        </div>
      </div>`;
  }
}

function showAdminSetup() {
  document.getElementById('app').innerHTML = `
  <div style="min-height:100vh;background:var(--dark);display:flex;align-items:center;justify-content:center;padding:2rem;">
    <div style="background:#fff;border-radius:24px;padding:2.5rem;max-width:500px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:var(--rose);letter-spacing:.2em;margin-bottom:.5rem;">✦ LENCHO ✦</div>
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;margin-bottom:.4rem;">Master Admin Setup</h2>
        <p style="color:var(--gray);font-size:.875rem;">Create the primary administrative account</p>
      </div>
      <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div class="form-group"><label>Full Name</label><input type="text" id="setup-name" placeholder="Name"/></div>
        <div class="form-group"><label>Phone Number</label><input type="text" id="setup-phone" placeholder="987xxxxxx"/></div>
      </div>
      <div class="form-group"><label>Email Address</label><input type="email" id="setup-email" placeholder="admin@lencho.in"/></div>
      <div class="form-group"><label>Password</label><input type="password" id="setup-pass" placeholder="Password"/></div>
      <div class="form-group">
        <label>Security Question: Birthplace</label>
        <input type="text" id="setup-answer" placeholder="Your birthplace (for recovery)"/>
      </div>
      <div id="setup-err" style="color:#ef4444;font-size:.8rem;margin-bottom:.75rem;"></div>
      <button class="btn-primary full-width" onclick="handleAdminSetup()">
        <i class="fas fa-check-circle"></i> Complete Master Registration
      </button>
    </div>
  </div>`;
}

async function handleAdminSetup() {
  const body = {
    name: document.getElementById('setup-name').value,
    phone: document.getElementById('setup-phone').value,
    email: document.getElementById('setup-email').value,
    password: document.getElementById('setup-pass').value,
    securityQuestion: 'Birthplace',
    securityAnswer: document.getElementById('setup-answer').value
  };
  const r = await api('/api/admin/setup', { method: 'POST', body });
  if (r.error) { document.getElementById('setup-err').textContent = r.error; return; }
  toast('Admin account created! Logging in...', 'success');
  renderAdmin();
}

async function showAdminLogin() {
  const captcha = await api('/api/captcha');
  document.getElementById('app').innerHTML = `
  <div style="min-height:100vh;background:var(--dark);display:flex;align-items:center;justify-content:center;padding:2rem;">
    <div style="background:#fff;border-radius:24px;padding:2.5rem;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:var(--rose);letter-spacing:.2em;margin-bottom:.5rem;">✦ LENCHO ✦</div>
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;margin-bottom:.4rem;">Admin Login</h2>
        <p style="color:var(--gray);font-size:.875rem;">Secure biometric/credential login</p>
      </div>
      <div class="form-group"><label>Email Address</label><input type="email" id="adm-email" placeholder="admin@example.com"/></div>
      <div class="form-group"><label>Password</label><input type="password" id="adm-pass" placeholder="Password"/></div>
      
      <div style="background:var(--beige);padding:1rem;border-radius:12px;margin-bottom:1.5rem;">
        <label style="font-size:.7rem;text-transform:uppercase;color:var(--gray);display:block;margin-bottom:5px;">Hacker Shield: Solve Math</label>
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="font-weight:700;font-size:1.2rem;color:var(--rose-dark);background:#fff;padding:5px 15px;border-radius:8px;border:1px solid #eee;">${captcha.question}</div>
          <input type="number" id="adm-captcha" style="width:70px;text-align:center;" placeholder="?"/>
        </div>
      </div>

      <div id="adm-err" style="color:#ef4444;font-size:.8rem;margin-bottom:.75rem;min-height:20px;"></div>
    </div>
  </div>`;
}

async function adminLogin() {
  const email = document.getElementById('adm-email')?.value;
  const pass = document.getElementById('adm-pass')?.value;
  const captcha = document.getElementById('adm-captcha')?.value;
  const err = document.getElementById('adm-err');
  
  if (!email || !pass || !captcha) { err.textContent = 'Please fill all fields'; return; }
  
  const r = await api('/api/login', { method: 'POST', body: { email, password: pass, captchaAnswer: captcha } });
  if (r.error) { 
    err.textContent = r.error; 
    showAdminLogin(); // Refresh captcha
    return; 
  }
  currentUser = r.user;
  updateHeader();
  toast('Admin Authorization Granted! ✦', 'success');
  buildAdminPanel();
}

function buildAdminPanel() {
  const siteHeader = document.getElementById('site-header');
  const siteFooter = document.getElementById('site-footer');
  const marquee = document.querySelector('.marquee-strip');
  if (siteHeader) siteHeader.style.display = 'none';
  if (siteFooter) siteFooter.style.display = 'none';
  if (marquee) marquee.style.display = 'none';

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="admin-layout light-theme">
    <button class="admin-mob-toggle" onclick="document.getElementById('admin-sidebar').classList.toggle('open')"><i class="fas fa-bars"></i></button>
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="admin-logo">✦ LENCHO<br/><span style="font-size:.7rem;opacity:.6;letter-spacing:.05em;">Admin Panel</span></div>
      <nav class="admin-menu">
        <div class="admin-menu-item active" id="am-dashboard" onclick="adminTab('dashboard')"><i class="fas fa-chart-line" style="width:20px;"></i> Dashboard</div>
        <div class="admin-menu-item" id="am-orders" onclick="adminTab('orders')"><i class="fas fa-shopping-bag" style="width:20px;"></i> Orders</div>
        <div class="admin-menu-item" id="am-products" onclick="adminTab('products')"><i class="fas fa-gem" style="width:20px;"></i> Products</div>
        <div class="admin-menu-item" id="am-collections" onclick="adminTab('collections')"><i class="fas fa-layer-group" style="width:20px;"></i> Collections</div>
        <div class="admin-menu-item" id="am-inquiries" onclick="adminTab('inquiries')"><i class="fas fa-envelope-open-text" style="width:20px;"></i> Inquiries</div>
        <div class="admin-menu-item" id="am-users" onclick="adminTab('users')"><i class="fas fa-users" style="width:20px;"></i> Users</div>
        <div class="admin-menu-item" id="am-gst" onclick="adminTab('gst')"><i class="fas fa-file-invoice" style="width:20px;"></i> GST Hub</div>
        <div class="admin-menu-item" id="am-testimonials" onclick="adminTab('testimonials')"><i class="fas fa-comment-dots" style="width:20px;"></i> Testimonials</div>
        <div class="admin-menu-item" id="am-settings" onclick="adminTab('settings')"><i class="fas fa-cog" style="width:20px;"></i> Store Settings</div>
        <div style="border-top:1px solid rgba(0,0,0,.05);margin-top:1rem;padding-top:1rem;">
          <div class="admin-menu-item" onclick="exitAdmin()"><i class="fas fa-home" style="width:20px;"></i> View Site</div>
          <div class="admin-menu-item" style="color:#ef4444;" onclick="handleLogout()"><i class="fas fa-sign-out-alt" style="width:20px;"></i> Logout</div>
        </div>
      </nav>
    </aside>
    <main class="admin-main" id="admin-main">
      <div id="admin-content" style="padding:1.5rem;"></div>
    </main>
  </div>`;
  adminTab('dashboard');
}

function exitAdmin() {
  // Restore header/footer when leaving admin
  const siteHeader = document.getElementById('site-header');
  const siteFooter = document.getElementById('site-footer');
  const marquee = document.querySelector('.marquee-strip');
  if (siteHeader) siteHeader.style.display = '';
  if (siteFooter) siteFooter.style.display = '';
  if (marquee) marquee.style.display = '';
  navigate('/');
}


function adminTab(tab) {
  document.querySelectorAll('.admin-menu-item').forEach(e => e.classList.remove('active'));
  const btn = document.getElementById('am-' + tab);
  if (btn) btn.classList.add('active');
  const sidebar = document.getElementById('admin-sidebar');
  if (sidebar) sidebar.classList.remove('open'); // Close mobile menu

  if (tab === 'dashboard') adminDashboard();
  if (tab === 'orders') adminOrders();
  if (tab === 'products') adminProducts();
  if (tab === 'collections') adminCollections();
  if (tab === 'inquiries') adminInquiries();
  if (tab === 'users') adminUsers();
  if (tab === 'gst') adminGST();
  if (tab === 'testimonials') adminTestimonials();
  if (tab === 'settings') adminSettings();
}

async function adminInquiries() {
  const inquiries = await api('/api/admin/inquiries');
  document.getElementById('admin-content').innerHTML = `
    <div class="admin-header">
      <h1 class="admin-page-title">Customer Inquiries (${inquiries.length})</h1>
      <button class="btn-outline" onclick="adminTab('inquiries')"><i class="fas fa-sync"></i> Refresh</button>
    </div>
    <div class="admin-table-wrap">
      <table>
        <thead><tr><th>Details</th><th>Message</th><th>Received At</th><th>Actions</th></tr></thead>
        <tbody>${inquiries.map(iq => `
          <tr>
            <td style="min-width:180px;">
              <div style="font-weight:700;">${iq.name}</div>
              <div style="font-size:.7rem;color:var(--gray);">${iq.email}</div>
            </td>
            <td><div style="font-size:.85rem;max-width:400px;line-height:1.4;">${iq.message}</div></td>
            <td style="white-space:nowrap;font-size:.75rem;">${new Date(iq.createdAt).toLocaleString()}</td>
            <td>
              <button class="btn-sm btn-danger" onclick="deleteInquiry('${iq._id}')"><i class="fas fa-trash"></i></button>
              <a href="mailto:${iq.email}" class="btn-sm btn-primary" style="text-decoration:none;"><i class="fas fa-reply"></i> Reply</a>
            </td>
          </tr>
        `).join('')}</tbody>
      </table>
    </div>`;
}

async function deleteInquiry(id) {
  if(!confirm('Delete this inquiry?')) return;
  await api('/api/admin/inquiries/'+id, { method:'DELETE' });
  adminInquiries();
}

async function adminDashboard() {
  const s = await api('/api/admin/stats');
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">Dashboard Overview</h1><span style="font-size:.875rem;color:var(--gray);">${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span></div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">Total Revenue</div><div class="stat-value">${formatCurrency(s.totalRevenue)}</div><div class="stat-change">↑ All time</div></div>
    <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-label">Total Orders</div><div class="stat-value">${s.totalOrders}</div><div class="stat-change">Today: ${s.todayOrders}</div></div>
    <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-label">Customers</div><div class="stat-value">${s.totalUsers}</div><div class="stat-change">Registered users</div></div>
    <div class="stat-card"><div class="stat-icon">🏷️</div><div class="stat-label">Total GST Collected</div><div class="stat-value">${formatCurrency(s.totalGstCollected)}</div><div class="stat-change">All orders</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem;">
    <div class="stat-card">
      <div class="stat-label">Today's Revenue</div>
      <div class="stat-value">${formatCurrency(s.todayRevenue)}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:1rem;">
        ${Object.entries(s.statusCounts||{}).map(([k,v])=>`<div style="text-align:center;padding:.5rem;background:var(--light-gray);border-radius:8px;"><div style="font-size:1.2rem;font-weight:700;">${v}</div><div style="font-size:.7rem;color:var(--gray);text-transform:capitalize;">${k.replace('_',' ')}</div></div>`).join('')}
      </div>
    </div>
    <div class="admin-table-wrap">
      <div class="admin-table-header"><h3>Recent Orders</h3><button class="btn-primary btn-sm" onclick="adminTab('orders')">View All</button></div>
      <table><thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${(s.recentOrders||[]).map(o=>`<tr><td style="font-weight:600;color:var(--rose-dark);">${o.id}</td><td>${o.userName}</td><td>${formatCurrency(o.grandTotal)}</td><td><span class="order-status-badge status-${o.status}" style="font-size:.7rem;">${o.status}</span></td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>`;
}

async function adminOrders() {
  const orders = await api('/api/admin/orders');
  const statusOpts = ['placed','confirmed','shipped','out_for_delivery','delivered','cancelled'].map(s=>`<option value="${s}">${s.replace('_',' ')}</option>`).join('');
  
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header">
    <h1 class="admin-page-title">Manage Orders (${orders.length})</h1>
    <div style="font-size: .8rem; color: var(--gray);">Integration: <span style="color:#22c55e;">● Shiprocket Active</span></div>
  </div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Amount</th><th>Status</th><th>Logistics (SR)</th><th>AWB / Tracking</th><th>Actions</th></tr></thead>
      <tbody>${orders.map(o=>`
      <tr>
        <td><b style="color:var(--rose-dark);">${o.id}</b><br/><span style="font-size:.65rem;color:var(--gray);text-transform:uppercase;">${o.paymentMethod}</span></td>
        <td>${formatDate(o.createdAt)}</td>
        <td>${o.userName}</td>
        <td><b>${formatCurrency(o.grandTotal)}</b></td>
        <td id="status-${o.id}"><span class="order-status-badge status-${o.status}" style="font-size:.7rem;">${o.status.replace('_',' ')}</span></td>
        <td>
          <select id="new-status-${o.id}" style="padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;">${statusOpts}</select>
        </td>
        <td>
          <div style="font-size:.75rem;font-weight:700;">${o.awbCode || o.trackingNumber || '—'}</div>
          <div style="font-size:.65rem;color:var(--gray);">${o.deliveryPartner || 'SR Auto'}</div>
        </td>
        <td>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap;">
            <button class="btn-sm" onclick="updateOrderStatus('${o.id}')" title="Change Status"><i class="fas fa-edit"></i></button>
            <button class="btn-sm btn-outline" onclick="adminViewInvoice('${o.id}')" title="Invoice"><i class="fas fa-file-invoice"></i></button>
            <button class="btn-sm" onclick="window.open('/api/admin/orders/${o.id}/label-branded')" title="Generate Branded Label" style="background:#fef3c7;color:#92400e;border-color:#f59e0b;"><i class="fas fa-print"></i> Label</button>
            ${o.awbCode ? `<button class="btn-sm btn-gold" onclick="adminShiprocketLabel('${o.id}')" title="SR Label"><i class="fas fa-download"></i> SR</button>` : `<button class="btn-sm" onclick="adminShiprocketShip('${o.id}')" title="Ship with Shiprocket" style="background:#e0f2fe;color:#0369a1;"><i class="fas fa-shipping-fast"></i> Ship</button>`}
          </div>
        </td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

async function adminShiprocketShip(id) {
  if (!confirm('Sync this order with Shiprocket and generate AWB?')) return;
  toast('Initiating Shiprocket Sync...', 'info');
  const r = await api(`/api/admin/orders/${id}/shiprocket`, { method: 'POST' });
  if (r.error) { toast(r.error, 'error'); return; }
  toast('AWB Generated: ' + r.awb, 'success');
  adminOrders();
}

async function adminShiprocketLabel(id) {
  const r = await api(`/api/admin/orders/${id}/label`);
  if (r.error) { toast(r.error, 'error'); return; }
  if (r.label_url) window.open(r.label_url, '_blank');
  else toast('Label URL not generated yet', 'error');
}

async function updateOrderStatus(orderId) {
  const status = document.getElementById('new-status-' + orderId)?.value;
  const deliveryPartner = document.getElementById('dp-' + orderId)?.value;
  const trackingNumber = document.getElementById('tn-' + orderId)?.value;
  const r = await api('/api/admin/orders/' + orderId + '/status', { method: 'PUT', body: { status, deliveryPartner, trackingNumber } });
  if (r.error) { toast(r.error, 'error'); return; }
  toast(`Order ${orderId} updated to "${status}"`, 'success');
  const el = document.getElementById('status-' + orderId);
  if (el) el.innerHTML = `<span class="order-status-badge status-${status}" style="font-size:.7rem;">${status.replace('_',' ')}</span>`;
}

async function adminViewInvoice(orderId) { await downloadInvoice(orderId); }

async function adminProducts() {
  const products = await api('/api/products');
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">Catalog Inventory (${products.length})</h1><button class="btn-primary" onclick="adminTab('add-product')"><i class="fas fa-plus"></i> Add New Product</button></div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>HSN Code</th><th>GST %</th><th>Featured</th><th>Actions</th></tr></thead>
      <tbody>${products.map(p=>`
      <tr>
        <td><img src="${p.images[0]}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid #eee;"/></td>
        <td><div style="font-weight:700;">${p.name}</div><div style="font-size:.7rem;color:var(--gray);">${p.id.substring(0,8)}...</div></td>
        <td style="text-transform:capitalize;"><span class="product-badge" style="position:static;font-size:0.7rem;padding:3px 8px;">${p.category}</span></td>
        <td><div style="font-weight:700;">${formatCurrency(p.price)}</div><div style="font-size:.7rem;color:var(--gray);text-decoration:line-through;">${formatCurrency(p.mrp)}</div></td>
        <td><span style="color:${p.stock>10?'#22c55e':p.stock>0?'#f59e0b':'#ef4444'};font-weight:700;background:${p.stock>10?'#f0fdf4':'#fffbeb'};padding:4px 8px;border-radius:6px;">${p.stock}</span></td>
        <td><code>${p.hsn || '7117'}</code></td>
        <td><span style="font-weight:600;color:var(--rose);">${p.gstRate || 18}%</span></td>
        <td>${p.featured?'<i class="fas fa-star" style="color:var(--gold);"></i>':'<span style="color:#aaa;">—</span>'}</td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="btn-outline btn-sm" onclick="adminEditProduct('${p.id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn-danger btn-sm" onclick="adminDeleteProduct('${p.id}','${p.name.replace(/'/g,'\\\'')}')" style="background:#fee2e2;color:#ef4444;border:1px solid #fca5a5;padding:6px 10px;border-radius:6px;" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

async function adminDeleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  const r = await api('/api/products/' + id, { method: 'DELETE' });
  if (r.error) { toast(r.error, 'error'); return; }
  toast('Product deleted', 'info');
  adminProducts();
}

async function adminAddProduct(product = null) {
  const isEdit = !!product;
  const cats = await api('/api/categories');
  const catOptions = cats.length > 0 
    ? cats.map(c => `<option value="${c.slug}" ${product?.category===c.slug?'selected':''}>${c.name}</option>`).join('')
    : `<option value="others">Jewelry</option>`;

  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">${isEdit?'Edit':'Add'} Product</h1></div>
  <div class="admin-form">
    <div class="form-grid">
      <div class="form-group"><label>Product Name *</label><input id="p-name" value="${product?.name||''}" placeholder="e.g. Rose Gold Hoop Earrings"/></div>
      <div class="form-group"><label>Category Collection *</label>
        <select id="p-cat">
          ${catOptions}
        </select>
      </div>
      <div class="form-group"><label>Selling Price (₹) *</label><input id="p-price" type="number" value="${product?.price||''}" placeholder="599"/></div>
      <div class="form-group"><label>MRP (₹) *</label><input id="p-mrp" type="number" value="${product?.mrp||''}" placeholder="999"/></div>
      <div class="form-group"><label>Discount (%)</label><input id="p-discount" type="number" value="${product?.discount||''}" placeholder="40"/></div>
      <div class="form-group"><label>Stock Quantity *</label><input id="p-stock" type="number" value="${product?.stock||''}" placeholder="50"/></div>
      <div class="form-group"><label>GST Rate (%)</label><input id="p-gst" type="number" value="${product?.gstRate||3}" placeholder="3"/></div>
      <div class="form-group"><label>HSN Code</label><input id="p-hsn" value="${product?.hsn||'7117'}" placeholder="7117"/></div>
    </div>
    <div class="form-group"><label>Description *</label><textarea id="p-desc" rows="4" placeholder="Product description...">${product?.description||''}</textarea></div>
    <div class="form-group">
      <label>Featured Product</label>
      <select id="p-featured"><option value="false" ${!product?.featured?'selected':''}>No</option><option value="true" ${product?.featured?'selected':''}>Yes – Show on Homepage</option></select>
    </div>
    <div class="form-group">
      <label>Product Images (max 5)</label>
      <input type="file" id="p-images" accept="image/*" multiple onchange="previewImages(this)"/>
      <div class="img-preview-grid" id="img-preview">
        ${product?.images?.map(img=>`<img class="img-preview" src="${img}" alt=""/>`).join('')||''}
      </div>
    </div>
    <div style="display:flex;gap:1rem;">
      <button class="btn-primary" onclick="${isEdit?`saveEditProduct('${product.id}')`:'saveNewProduct()'}">${isEdit?'Save Changes':'Add Product ✦'}</button>
      <button class="btn-outline" onclick="adminTab('products')">Cancel</button>
    </div>
  </div>`;
}

function previewImages(input) {
  const preview = document.getElementById('img-preview');
  preview.innerHTML = '';
  Array.from(input.files).slice(0,5).forEach(f => {
    const img = document.createElement('img');
    img.className = 'img-preview';
    img.src = URL.createObjectURL(f);
    preview.appendChild(img);
  });
}

async function saveNewProduct() {
  const fd = new FormData();
  fd.append('name', document.getElementById('p-name').value);
  fd.append('category', document.getElementById('p-cat').value);
  fd.append('price', document.getElementById('p-price').value);
  fd.append('mrp', document.getElementById('p-mrp').value);
  fd.append('discount', document.getElementById('p-discount').value);
  fd.append('stock', document.getElementById('p-stock').value);
  fd.append('gstRate', document.getElementById('p-gst').value);
  fd.append('hsn', document.getElementById('p-hsn').value);
  fd.append('description', document.getElementById('p-desc').value);
  fd.append('featured', document.getElementById('p-featured').value);
  const files = document.getElementById('p-images').files;
  Array.from(files).forEach(f => fd.append('images', f));
  const res = await fetch('/api/products', { method: 'POST', body: fd });
  const r = await res.json();
  if (r.error) { toast(r.error, 'error'); return; }
  toast('Product added successfully! ✦', 'success');
  adminTab('products');
}

async function adminEditProduct(id) {
  const p = await api('/api/products/' + id);
  if (p.error) { toast(p.error, 'error'); return; }
  adminAddProduct(p);
  // Override save button
  setTimeout(() => {
    document.querySelector('.admin-form .btn-primary').onclick = () => saveEditProduct(id);
  }, 100);
}

async function saveEditProduct(id) {
  const fd = new FormData();
  fd.append('name', document.getElementById('p-name').value);
  fd.append('category', document.getElementById('p-cat').value);
  fd.append('price', document.getElementById('p-price').value);
  fd.append('mrp', document.getElementById('p-mrp').value);
  fd.append('discount', document.getElementById('p-discount').value);
  fd.append('stock', document.getElementById('p-stock').value);
  fd.append('gstRate', document.getElementById('p-gst').value);
  fd.append('hsn', document.getElementById('p-hsn').value);
  fd.append('description', document.getElementById('p-desc').value);
  fd.append('featured', document.getElementById('p-featured').value);
  const files = document.getElementById('p-images').files;
  Array.from(files).forEach(f => fd.append('images', f));
  const res = await fetch('/api/products/' + id, { method: 'PUT', body: fd });
  const r = await res.json();
  if (r.error) { toast(r.error, 'error'); return; }
  toast('Product updated! ✦', 'success');
  adminTab('products');
}

async function adminUsers() {
  const users = await api('/api/admin/users');
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">Users (${users.length})</h1></div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody>${users.map(u=>`
      <tr>
        <td><b>${u.name}</b></td>
        <td>${u.email}</td>
        <td>${u.phone||'—'}</td>
        <td><span style="padding:3px 10px;border-radius:99px;font-size:.7rem;font-weight:600;background:${u.role==='admin'?'#ede9fe':'#dcfce7'};color:${u.role==='admin'?'#6d28d9':'#166534'};">${u.role}</span></td>
        <td>${formatDate(u.createdAt)}</td>
        <td>${u.role!=='admin'?`<button class="btn-danger btn-sm" onclick="deleteUser('${u.id}','${u.name.replace(/'/g,'\\\'')}')" style="padding:5px 10px;border-radius:6px;background:#fee2e2;color:#ef4444;border:1px solid #fca5a5;cursor:pointer;font-size:.75rem;">Remove</button>`:'<span style="color:#888;">Protected</span>'}</td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

async function deleteUser(id, name) {
  if (!confirm(`Remove user "${name}"?`)) return;
  const r = await api('/api/admin/users/' + id, { method: 'DELETE' });
  if (r.error) { toast(r.error, 'error'); return; }
  toast('User removed', 'info');
  adminUsers();
}

async function adminGST() {
  const now = new Date();
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">GST Report & Tax Invoice</h1></div>
  <div class="admin-form" style="margin-bottom:1.5rem;">
    <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap;">
      <div class="form-group" style="margin-bottom:0;"><label>Month</label><select id="gst-month">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i+1===now.getMonth()+1?'selected':''}>${new Date(2000,i).toLocaleString('en-IN',{month:'long'})}</option>`).join('')}</select></div>
      <div class="form-group" style="margin-bottom:0;"><label>Year</label><select id="gst-year">${[2025,2026,2027].map(y=>`<option value="${y}" ${y===now.getFullYear()?'selected':''}>${y}</option>`).join('')}</select></div>
      <button class="btn-primary" onclick="loadGSTReport()"><i class="fas fa-search"></i> Generate Report</button>
      <button class="btn-outline" onclick="downloadGSTReport()"><i class="fas fa-download"></i> Download CSV</button>
    </div>
  </div>
  <div id="gst-report-content"><p style="color:var(--gray);text-align:center;padding:2rem;">Select month and year, then click Generate Report</p></div>`;
}

let lastGSTData = null;
async function loadGSTReport() {
  const month = document.getElementById('gst-month').value;
  const year = document.getElementById('gst-year').value;
  const r = await api(`/api/admin/gst-report?month=${month}&year=${year}`);
  lastGSTData = r;
  const el = document.getElementById('gst-report-content');
  if (!r.report.length) { el.innerHTML = '<p style="text-align:center;color:var(--gray);padding:2rem;">No orders found for this period</p>'; return; }
  el.innerHTML = `
  <div class="admin-table-wrap">
    <div class="admin-table-header">
      <h3>${r.count} Orders – ${new Date(2000,parseInt(document.getElementById('gst-month').value)-1).toLocaleString('en-IN',{month:'long'})} ${year}</h3>
    </div>
    <table class="gst-report-table">
      <thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Taxable Amt</th><th>CGST</th><th>SGST</th><th>Total GST</th><th>Grand Total</th><th>Payment</th><th>Invoice</th></tr></thead>
      <tbody>
        ${r.report.map(row=>`
        <tr>
          <td><b>${row.orderId}</b></td>
          <td>${row.date}</td>
          <td>${row.customerName}</td>
          <td>₹${row.taxableAmount.toFixed(2)}</td>
          <td style="color:#1d4ed8;">₹${row.cgst.toFixed(2)}</td>
          <td style="color:#1d4ed8;">₹${row.sgst.toFixed(2)}</td>
          <td style="color:#166534;font-weight:600;">₹${row.totalGst.toFixed(2)}</td>
          <td style="font-weight:600;">₹${row.grandTotal.toFixed(2)}</td>
          <td>${row.paymentMethod?.toUpperCase()}</td>
          <td><button class="btn-outline btn-sm" onclick="downloadInvoice('${row.orderId}')"><i class="fas fa-file-pdf"></i></button></td>
        </tr>`).join('')}
        <tr class="gst-total-row">
          <td colspan="3"><b>TOTALS (${r.count} orders)</b></td>
          <td>₹${r.totals.taxableAmount.toFixed(2)}</td>
          <td>₹${r.totals.cgst.toFixed(2)}</td>
          <td>₹${r.totals.sgst.toFixed(2)}</td>
          <td>₹${r.totals.totalGst.toFixed(2)}</td>
          <td>₹${r.totals.grandTotal.toFixed(2)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function downloadGSTReport() {
  if (!lastGSTData || !lastGSTData.report.length) { toast('Generate report first', 'error'); return; }
  const headers = ['Order ID','Date','Customer','Taxable Amount','CGST','SGST','Total GST','Grand Total','Payment'];
  const rows = lastGSTData.report.map(r => [r.orderId,r.date,r.customerName,r.taxableAmount.toFixed(2),r.cgst.toFixed(2),r.sgst.toFixed(2),r.totalGst.toFixed(2),r.grandTotal.toFixed(2),r.paymentMethod]);
  rows.push(['TOTAL','','',lastGSTData.totals.taxableAmount.toFixed(2),lastGSTData.totals.cgst.toFixed(2),lastGSTData.totals.sgst.toFixed(2),lastGSTData.totals.totalGst.toFixed(2),lastGSTData.totals.grandTotal.toFixed(2),'']);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `GST_Report_Lencho_${document.getElementById('gst-month').value}_${document.getElementById('gst-year').value}.csv`;
  a.click();
  toast('GST Report downloaded! ✦', 'success');
}

function adminSettings() {
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">⚙️ Admin Settings</h1></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
    <!-- Change Credentials -->
    <div class="admin-form">
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);">🔐 Change Login Credentials</h3>
      <div class="form-group"><label>Current Password *</label><input type="password" id="set-cur-pass" placeholder="Enter current password"/></div>
      <div class="form-group"><label>New Email (optional)</label><input type="email" id="set-new-email" placeholder="New email address" value="${currentUser?.email||''}"/></div>
      <div class="form-group"><label>Display Name</label><input id="set-name" placeholder="Admin name" value="${currentUser?.name||''}"/></div>
      <div class="form-group"><label>New Password (optional)</label><input type="password" id="set-new-pass" placeholder="New password (min 6 chars)"/></div>
      <div class="form-group"><label>Confirm New Password</label><input type="password" id="set-conf-pass" placeholder="Confirm new password"/></div>
      <div id="set-err" style="color:#ef4444;font-size:.8rem;margin-bottom:.75rem;min-height:20px;"></div>
      <button class="btn-primary" onclick="saveAdminCredentials()"><i class="fas fa-save"></i> Save Credentials</button>
    </div>

    <!-- Administrative Tools -->
    <div>
      <div class="admin-form" style="margin-bottom:1.5rem;">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);">🛠️ Administrative Tools</h3>
        <div style="background:#fee2e2;padding:1.5rem;border-radius:12px;border:1.5px solid #fca5a5;">
          <h4 style="color:#991b1b;margin-bottom:.5rem;">Clear System Data</h4>
          <p style="font-size:.8rem;color:#7f1d1d;margin-bottom:1rem;">Permanently delete Orders, Inquiries, Carts, and Wishlists. Use only to clear test data.</p>
          <button class="btn-danger" style="width:100%;font-weight:700;" onclick="clearTestData()"><i class="fas fa-trash-alt"></i> Clear All Test Data</button>
        </div>
      </div>
      
      <div class="admin-form" style="background:var(--grad-rose);color:#fff;">
        <h3 style="color:#fff;font-family:'Cormorant Garamond',serif;font-size:1.2rem;margin-bottom:1rem;">✦ Session Info</h3>
        <div style="display:flex;flex-direction:column;gap:.75rem;font-size:.875rem;">
          <div><span style="opacity:.7;">Login:</span> <b>${currentUser?.email}</b></div>
          <div><span style="opacity:.7;">Status:</span> <span style="background:#fff;color:var(--rose);padding:2px 10px;border-radius:99px;font-size:.7rem;font-weight:700;">ACTIVE ADMIN</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

async function clearTestData() {
  if(!confirm('🚨 WARNING: This will delete ALL orders and inquiries. Are you absolutely sure?')) return;
  const pass = prompt('Please enter your CURRENT ADMIN PASSWORD to confirm:');
  if(!pass) return;
  const r = await api('/api/admin/clear-data', { method:'PUT', body:{ password:pass } });
  if(r.success) { toast('System data cleared successfully!', 'success'); adminDashboard(); }
  else { toast(r.error || 'Failed to clear data', 'error'); }
}

async function saveAdminCredentials() {
  const currentPassword = document.getElementById('set-cur-pass').value;
  const newEmail = document.getElementById('set-new-email').value;
  const newPassword = document.getElementById('set-new-pass').value;
  const confirm = document.getElementById('set-conf-pass').value;
  const name = document.getElementById('set-name').value;
  
  if(!currentPassword) return document.getElementById('set-err').textContent = 'Current password required';
  if(newPassword && newPassword !== confirm) return document.getElementById('set-err').textContent = 'Passwords do not match';
  
  const r = await api('/api/admin/change-credentials', { method:'PUT', body: { currentPassword, newEmail, newPassword, name } });
  if(r.error) document.getElementById('set-err').textContent = r.error;
  else { toast('Credentials updated! Please login again.', 'success'); handleLogout(); }
}


async function adminDiscounts() {
  const items = await api('/api/admin/discounts');
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">Claimed Coupons (${items.length})</h1></div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>Email Address</th><th>Coupon Code</th><th>Claimed At</th></tr></thead>
      <tbody>${items.map(i=>`
      <tr>
        <td><b>${i.email}</b></td>
        <td><span style="background:var(--rose-light);color:var(--rose-dark);padding:4px 8px;border-radius:6px;font-weight:bold;font-size:12px;">${i.code}</span></td>
        <td>${formatDate(i.createdAt)}</td>
      </tr>`).join('')}
      ${!items.length ? '<tr><td colspan="3" style="text-align:center;color:var(--gray);">No coupons claimed yet.</td></tr>' : ''}
      </tbody>
    </table>
  </div>`;
}

// ── TESTIMONIALS MANAGEMENT ─────────────────────────────────
async function adminTestimonials() {
  document.getElementById('admin-content').innerHTML = `
    <div class="admin-header"><h1 class="admin-page-title">Manage Testimonials</h1><button class="btn-primary" onclick="showAddTestimonial()">+ Add Review</button></div>
    <div id="testi-list-container" class="admin-table-wrap">Loading...</div>
  `;
  const t = await api('/api/testimonials');
  const grid = document.getElementById('testi-list-container');
  grid.innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>City</th><th>Rating</th><th>Comment</th><th>Actions</th></tr></thead>
      <tbody>${t.map(item => `
        <tr>
          <td><b>${item.name}</b></td>
          <td>${item.city}</td>
          <td>${item.rating} ⭐</td>
          <td style="max-width:300px; font-size:.8rem;">${item.comment}</td>
          <td><button class="btn-danger btn-sm" onclick="deleteTestimonial('${item._id}')" style="background:#fee2e2;color:#ef4444;border:none;padding:5px 10px;border-radius:4px;"><i class="fas fa-trash"></i></button></td>
        </tr>
      `).join('')}</tbody>
    </table>
  `;
}

function showAddTestimonial() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card" style="padding:2rem;">
      <h3>Add Customer Reference</h3>
      <div class="form-group"><label>Customer Name</label><input id="nt-name" placeholder="e.g. Priya Sharma"/></div>
      <div class="form-group"><label>City</label><input id="nt-city" placeholder="e.g. Mumbai"/></div>
      <div class="form-group"><label>Rating</label><select id="nt-rating"><option value="5">5 Stars</option><option value="4">4 Stars</option></select></div>
      <div class="form-group"><label>Comment</label><textarea id="nt-comment" rows="3"></textarea></div>
      <div style="display:flex;gap:1rem;">
        <button class="btn-primary" onclick="saveTestimonial()">Add Testimonial</button>
        <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function saveTestimonial() {
  const body = {
    name: document.getElementById('nt-name').value,
    city: document.getElementById('nt-city').value,
    rating: document.getElementById('nt-rating').value,
    comment: document.getElementById('nt-comment').value
  };
  const r = await api('/api/admin/testimonials', { method: 'POST', body });
  if (r.error) { toast(r.error, 'error'); return; }
  toast('Reference added! ✦', 'success');
  document.querySelector('.modal-overlay').remove();
  adminTestimonials();
}

async function deleteTestimonial(id) {
  if (!confirm('Delete this testimonial?')) return;
  await api('/api/admin/testimonials/' + id, { method: 'DELETE' });
  adminTestimonials();
}

// ── COLLECTIONS (A-Z) ────────────────────────────────────────
async function adminCollections() {
  const cats = await api('/api/categories');
  const products = await api('/api/products');
  
  // Calculate counts
  const counts = products.reduce((acc, p) => { 
    acc[p.category] = (acc[p.category] || 0) + 1; 
    return acc; 
  }, {});

  document.getElementById('admin-content').innerHTML = `
    <div class="admin-header">
      <h1 class="admin-page-title">Product Collections (${cats.length})</h1>
      <button class="btn-primary" onclick="showAddCategory()"><i class="fas fa-plus"></i> New Collection</button>
    </div>
    
    <div class="stats-grid" style="margin-bottom:2rem;">
      <div class="stat-card"><div class="stat-label">Total Categories</div><div class="stat-value">${cats.length}</div></div>
      <div class="stat-card"><div class="stat-label">Active Slugs</div><div class="stat-value">${cats.filter(c=>c.slug).length}</div></div>
    </div>

    <div class="admin-table-wrap">
      <table>
        <thead><tr><th>Showcase</th><th>Name</th><th>Slug</th><th>Product Count</th><th>Actions</th></tr></thead>
        <tbody>${cats.map(c => `
            <td>
              <button class="btn-sm btn-outline" onclick="viewCategoryProducts('${c.slug}')"><i class="fas fa-boxes"></i> Inventory</button>
              <button class="btn-sm" onclick="deleteCategory('${c._id}')" style="background:#fee2e2;color:#ef4444;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join('')}</tbody>
      </table>
    </div>

    <div id="category-inventory" style="margin-top:3rem;display:none;">
      <div class="admin-header">
        <h2 id="inv-title" class="admin-page-title">Inventory: <span>All Products</span></h2>
        <button class="btn-outline" onclick="document.getElementById('category-inventory').style.display='none'">Close</button>
      </div>
      <div class="admin-table-wrap">
        <table id="inv-table">
          <thead><tr><th>Product</th><th>Original Price</th><th>Stock Status</th><th>Action</th></tr></thead>
          <tbody id="inv-body"></tbody>
        </table>
      </div>
    </div>
  `;
}

async function viewCategoryProducts(slug) {
  const products = await api('/api/products?category=' + slug);
  const container = document.getElementById('category-inventory');
  const body = document.getElementById('inv-body');
  const title = document.querySelector('#inv-title span');
  
  title.innerText = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'All Products';
  body.innerHTML = products.map(p => {
    let statusClass = 'status-instock';
    let statusText = 'IN STOCK';
    if(p.stock <= 0) { statusClass = 'status-outofstock'; statusText = 'OUT OF STOCK'; }
    else if(p.stock < 5) { statusClass = 'status-fewstock'; statusText = 'FEW STOCK ('+p.stock+')'; }
    
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:15px;">
            <img src="${p.image}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;"/>
            <div style="font-weight:600;">${p.name}</div>
          </div>
        </td>
        <td>${formatCurrency(p.price)}</td>
        <td><span class="stock-badge ${statusClass}">${statusText}</span></td>
        <td><button class="btn-sm" onclick="adminEditProduct('${p.id}')"><i class="fas fa-edit"></i> Edit</button></td>
      </tr>
    `;
  }).join('');
  
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
}

async function showAddCategory() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card">
      <h3>Add New Collection</h3>
      <div class="form-group"><label>Name (e.g. Earrings)</label><input id="nc-name" placeholder="Name"/></div>
      <div class="form-group"><label>Image URL</label><input id="nc-image" placeholder="Image URL"/></div>
      <div class="form-group"><label>Description</label><textarea id="nc-desc" rows="2"></textarea></div>
      <div style="display:flex;gap:1rem;">
        <button class="btn-primary" onclick="saveCategory()">Create Collection</button>
        <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function saveCategory() {
  const body = {
    name: document.getElementById('nc-name').value,
    image: document.getElementById('nc-image').value,
    description: document.getElementById('nc-desc').value
  };
  const r = await api('/api/admin/categories', { method: 'POST', body });
  if (r.error) { toast(r.error, 'error'); return; }
  toast('Collection Added! ✦', 'success');
  document.querySelector('.modal-overlay').remove();
  adminCollections();
}

async function deleteCategory(id) {
  if (!confirm('Delete this collection?')) return;
  await api('/api/admin/categories/' + id, { method: 'DELETE' });
  adminCollections();
}

// ── SECURITY SETTINGS ────────────────────────────────────────
async function adminSecuritySettings() {
  const u = currentUser;
  document.getElementById('admin-content').innerHTML = `
    <div class="admin-header"><h1 class="admin-page-title">Lock & Security Settings</h1></div>
    <div class="admin-form" style="max-width:600px;">
      <div class="form-group"><label>Full Name</label><input id="sec-name" value="${u.name}"/></div>
      <div class="form-group"><label>Email Address</label><input id="sec-email" value="${u.email}"/></div>
      <div class="form-group"><label>Phone Number</label><input id="sec-phone" value="${u.phone||''}"/></div>
      <div class="form-group"><label>Security Question: Birthplace</label><input id="sec-answer" value="${u.securityAnswer||''}" placeholder="Your answer"/></div>
      <div class="form-group"><label>New Password (Optional)</label><input id="sec-pass" type="password" placeholder="Leave blank to keep current"/></div>
      <button class="btn-primary" onclick="saveSecuritySettings()"><i class="fas fa-save"></i> Update Credentials</button>
    </div>
  `;
}

async function saveSecuritySettings() {
  const body = {
    name: document.getElementById('sec-name').value,
    email: document.getElementById('sec-email').value,
    phone: document.getElementById('sec-phone').value,
    securityAnswer: document.getElementById('sec-answer').value
  };
  const pass = document.getElementById('sec-pass').value;
  if (pass) body.password = pass;

  const r = await api('/api/profile', { method: 'PUT', body });
  if (r.error) { toast(r.error, 'error'); return; }
  currentUser = r.user;
  toast('Admin credentials saved successfully! ✦', 'success');
}

function showRecovery() {
  document.getElementById('app').innerHTML = `
  <div style="min-height:100vh;background:var(--dark);display:flex;align-items:center;justify-content:center;padding:2rem;">
    <div style="background:#fff;border-radius:24px;padding:2.5rem;max-width:400px;width:100%;">
      <h2 style="font-family:'Cormorant Garamond',serif;margin-bottom:1rem;">Account Recovery</h2>
      <div class="form-group"><label>Registered Email</label><input id="rec-email" type="email"/></div>
      <div class="form-group"><label>Security Question: Birthplace</label><input id="rec-answer" type="text"/></div>
      <div class="form-group"><label>New Password</label><input id="rec-pass" type="password"/></div>
      <div id="rec-err" style="color:#ef4444;font-size:.8rem;margin-bottom:1rem;"></div>
      <button class="btn-primary full-width" onclick="handleRecovery()">Reset Password</button>
      <button class="btn-outline full-width" style="margin-top:10px;" onclick="renderAdmin()">Back to Login</button>
    </div>
  </div>`;
}

async function handleRecovery() {
  const body = {
    email: document.getElementById('rec-email').value,
    securityAnswer: document.getElementById('rec-answer').value,
    newPassword: document.getElementById('rec-pass').value
  };
  const r = await api('/api/admin/forgot-password', { method: 'POST', body });
  if (r.error) { document.getElementById('rec-err').textContent = r.error; return; }
  toast('Password reset success! Please login.', 'success');
  renderAdmin();
}
