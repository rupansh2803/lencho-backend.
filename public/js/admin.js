/* ── ADMIN PANEL ───────────────────────────────────────────── */
async function renderAdmin() {
  // Agar login nahi, toh admin login form dikhao
  if (!currentUser || currentUser.role !== 'admin') {
    showAdminLogin();
    return;
  }
  buildAdminPanel();
}

function showAdminLogin() {
  const footer = document.getElementById('site-footer');
  if (footer) footer.style.display = 'none';
  document.getElementById('app').innerHTML = `
  <div style="min-height:100vh;background:var(--dark);display:flex;align-items:center;justify-content:center;padding:2rem;">
    <div style="background:#fff;border-radius:24px;padding:2.5rem;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:var(--rose);letter-spacing:.2em;margin-bottom:.5rem;">✦ LENCHO ✦</div>
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;margin-bottom:.4rem;">Admin Login</h2>
        <p style="color:var(--gray);font-size:.875rem;">Enter admin credentials to continue</p>
      </div>
      <div class="form-group"><label>Email Address</label><input type="email" id="adm-email" placeholder="admin@example.com"/></div>
      <div class="form-group"><label>Password</label><input type="password" id="adm-pass" placeholder="Password" onkeydown="if(event.key==='Enter')adminLogin()"/></div>
      <div id="adm-err" style="color:#ef4444;font-size:.8rem;margin-bottom:.75rem;min-height:20px;"></div>
      <button class="btn-primary full-width" onclick="adminLogin()">
        <i class="fas fa-shield-alt"></i> Login to Admin Panel
      </button>
      <button class="btn-outline full-width" style="margin-top:.75rem;" onclick="navigate('/')">
        <i class="fas fa-arrow-left"></i> Back to Website
      </button>
    </div>
  </div>`;
}

async function adminLogin() {
  const email = document.getElementById('adm-email')?.value;
  const pass = document.getElementById('adm-pass')?.value;
  const err = document.getElementById('adm-err');
  if (!email || !pass) { err.textContent = 'Please enter email and password'; return; }
  err.textContent = '';
  const r = await api('/api/login', { method: 'POST', body: { email, password: pass } });
  if (r.error) { err.textContent = r.error; return; }
  if (r.user.role !== 'admin') { err.textContent = 'This account does not have admin access'; return; }
  currentUser = r.user;
  updateHeader();
  toast('Admin Panel Khul Gaya! ✦', 'success');
  buildAdminPanel();
}

function buildAdminPanel() {
  // Hide the main site header & footer on admin panel
  const siteHeader = document.getElementById('site-header');
  const siteFooter = document.getElementById('site-footer');
  const marquee = document.querySelector('.marquee-strip');
  if (siteHeader) siteHeader.style.display = 'none';
  if (siteFooter) siteFooter.style.display = 'none';
  if (marquee) marquee.style.display = 'none';

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="admin-layout">
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="admin-logo">✦ LENCHO<br/><span style="font-size:.7rem;opacity:.6;letter-spacing:.05em;">Admin Panel</span></div>
      <nav class="admin-menu">
        <div class="admin-menu-item active" id="am-dashboard" onclick="adminTab('dashboard')"><i class="fas fa-chart-line" style="width:20px;"></i> Dashboard</div>
        <div class="admin-menu-item" id="am-orders" onclick="adminTab('orders')"><i class="fas fa-shopping-bag" style="width:20px;"></i> Orders</div>
        <div class="admin-menu-item" id="am-products" onclick="adminTab('products')"><i class="fas fa-gem" style="width:20px;"></i> Products</div>
        <div class="admin-menu-item" id="am-add-product" onclick="adminTab('add-product')"><i class="fas fa-plus-circle" style="width:20px;"></i> Add Product</div>
        <div class="admin-menu-item" id="am-users" onclick="adminTab('users')"><i class="fas fa-users" style="width:20px;"></i> Users</div>
        <div class="admin-menu-item" id="am-gst" onclick="adminTab('gst')"><i class="fas fa-file-invoice" style="width:20px;"></i> GST Report</div>
        <div class="admin-menu-item" id="am-discounts" onclick="adminTab('discounts')"><i class="fas fa-percent" style="width:20px;"></i> Discounts</div>
        <div class="admin-menu-item" id="am-settings" onclick="adminTab('settings')"><i class="fas fa-cog" style="width:20px;"></i> Settings</div>
        <div style="border-top:1px solid rgba(255,255,255,.1);margin-top:1rem;padding-top:1rem;">
          <div class="admin-menu-item" onclick="exitAdmin()"><i class="fas fa-home" style="width:20px;"></i> View Site</div>
          <div class="admin-menu-item" style="color:#ef9e9e;" onclick="handleLogout()"><i class="fas fa-sign-out-alt" style="width:20px;"></i> Logout</div>
        </div>
      </nav>
    </aside>
    <main class="admin-main" id="admin-main">
      <div id="admin-content"></div>
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
  document.querySelectorAll('.admin-menu-item').forEach(m => m.classList.remove('active'));
  const el = document.getElementById('am-' + tab);
  if (el) el.classList.add('active');
  const tabs = { dashboard: adminDashboard, orders: adminOrders, products: adminProducts, 'add-product': adminAddProduct, users: adminUsers, gst: adminGST, discounts: adminDiscounts, settings: adminSettings };
  if (tabs[tab]) tabs[tab]();
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
  const partners = ['Shiprocket','Delhivery','BlueDart','Ecom Express','XpressBees','Others'];
  
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">Manage Orders (${orders.length})</h1></div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Partner</th><th>Tracking</th><th>Actions</th></tr></thead>
      <tbody>${orders.map(o=>`
      <tr>
        <td><b style="color:var(--rose-dark);">${o.id}</b></td>
        <td>${formatDate(o.createdAt)}</td>
        <td>${o.userName}</td>
        <td>${o.items.length} item${o.items.length>1?'s':''}</td>
        <td><b>${formatCurrency(o.grandTotal)}</b></td>
        <td id="status-${o.id}"><span class="order-status-badge status-${o.status}" style="font-size:.7rem;">${o.status.replace('_',' ')}</span></td>
        <td>
           <select id="dp-${o.id}" style="padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;">
             <option value="">Partner</option>
             ${partners.map(p=>`<option value="${p}" ${o.deliveryPartner===p?'selected':''}>${p}</option>`).join('')}
           </select>
        </td>
        <td><input id="tn-${o.id}" value="${o.trackingNumber||''}" placeholder="Track#" style="width:70px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;"/></td>
        <td>
          <div style="display:flex;gap:4px;">
            <select id="new-status-${o.id}" style="padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:.75rem;">${statusOpts}</select>
            <button class="btn-primary btn-sm" onclick="updateOrderStatus('${o.id}')">Update</button>
            <button class="btn-outline btn-sm" onclick="adminViewInvoice('${o.id}')"><i class="fas fa-file-invoice"></i></button>
          </div>
        </td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
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
  <div class="admin-header"><h1 class="admin-page-title">Products (${products.length})</h1><button class="btn-primary" onclick="adminTab('add-product')"><i class="fas fa-plus"></i> Add Product</button></div>
  <div class="admin-table-wrap">
    <table>
      <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>MRP</th><th>Stock</th><th>Featured</th><th>Actions</th></tr></thead>
      <tbody>${products.map(p=>`
      <tr>
        <td><img src="${p.images[0]}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;"/></td>
        <td><b>${p.name}</b></td>
        <td style="text-transform:capitalize;">${p.category}</td>
        <td>${formatCurrency(p.price)}</td>
        <td style="color:var(--gray);text-decoration:line-through;">${formatCurrency(p.mrp)}</td>
        <td><span style="color:${p.stock>10?'#22c55e':p.stock>0?'#f59e0b':'#ef4444'};font-weight:600;">${p.stock}</span></td>
        <td>${p.featured?'<span style="color:#22c55e;">✓</span>':'<span style="color:#aaa;">—</span>'}</td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="btn-outline btn-sm" onclick="adminEditProduct('${p.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn-danger btn-sm" onclick="adminDeleteProduct('${p.id}','${p.name.replace(/'/g,'\\\'')}')" style="background:#fee2e2;color:#ef4444;border:1px solid #fca5a5;padding:6px 10px;border-radius:6px;"><i class="fas fa-trash"></i></button>
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

function adminAddProduct(product = null) {
  const isEdit = !!product;
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">${isEdit?'Edit':'Add'} Product</h1></div>
  <div class="admin-form">
    <div class="form-grid">
      <div class="form-group"><label>Product Name *</label><input id="p-name" value="${product?.name||''}" placeholder="e.g. Rose Gold Hoop Earrings"/></div>
      <div class="form-group"><label>Category *</label>
        <select id="p-cat">
          <option value="earrings" ${product?.category==='earrings'?'selected':''}>💍 Earrings (Jhumke / Studs / Hoops)</option>
          <option value="necklace" ${product?.category==='necklace'?'selected':''}>📿 Necklace (Haar / Set)</option>
          <option value="toe-rings" ${product?.category==='toe-rings'?'selected':''}>🦶 Toe Rings (Bichiye)</option>
          <option value="rings" ${product?.category==='rings'?'selected':''}>💍 Rings (Angoothi)</option>
          <option value="chains" ${product?.category==='chains'?'selected':''}>⛓️ Chains (Chain / Mangalsutra)</option>
          <option value="payal" ${product?.category==='payal'?'selected':''}>🔔 Payal (Anklets)</option>
          <option value="bangles" ${product?.category==='bangles'?'selected':''}>🔮 Bangles (Choodi / Kangan)</option>
          <option value="bracelets" ${product?.category==='bracelets'?'selected':''}>📿 Bracelets</option>
          <option value="maang-tikka" ${product?.category==='maang-tikka'?'selected':''}>✨ Maang Tikka</option>
          <option value="nose-pin" ${product?.category==='nose-pin'?'selected':''}>💫 Nose Pin (Nath)</option>
          <option value="hair-accessories" ${product?.category==='hair-accessories'?'selected':''}>🌸 Hair Accessories</option>
          <option value="sets" ${product?.category==='sets'?'selected':''}>🎁 Bridal / Full Sets</option>
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

/* ── ADMIN SETTINGS ──────────────────────────────────────────── */
function adminSettings() {
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header"><h1 class="admin-page-title">⚙️ Admin Settings</h1></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
    <!-- Change Credentials -->
    <div class="admin-form">
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--border);">🔐 Change Login Credentials</h3>
      <div class="form-group"><label>Current Password *</label><input type="password" id="set-cur-pass" placeholder="Apna current password daalo"/></div>
      <div class="form-group"><label>New Email (optional)</label><input type="email" id="set-new-email" placeholder="New email address" value="${currentUser?.email||''}"/></div>
      <div class="form-group"><label>Display Name</label><input id="set-name" placeholder="Admin name" value="${currentUser?.name||''}"/></div>
      <div class="form-group"><label>New Password (optional)</label><input type="password" id="set-new-pass" placeholder="New password (min 6 chars)"/></div>
      <div class="form-group"><label>Confirm New Password</label><input type="password" id="set-conf-pass" placeholder="Confirm new password"/></div>
      <div id="set-err" style="color:#ef4444;font-size:.8rem;margin-bottom:.75rem;min-height:20px;"></div>
      <button class="btn-primary" onclick="saveAdminCredentials()"><i class="fas fa-save"></i> Save Credentials</button>
    </div>
    <!-- Info Box -->
    <div>
      <div class="admin-form" style="background:linear-gradient(135deg,#1a1a2e,#2d1b33);color:#fff;">
        <h3 style="color:var(--gold-light);font-family:'Cormorant Garamond',serif;font-size:1.2rem;margin-bottom:1rem;">✦ Current Admin Info</h3>
        <div style="display:flex;flex-direction:column;gap:.75rem;font-size:.875rem;">
          <div><span style="color:rgba(255,255,255,.5);">Name:</span> <b style="color:#fff;">${currentUser?.name}</b></div>
          <div><span style="color:rgba(255,255,255,.5);">Email:</span> <b style="color:#fff;">${currentUser?.email}</b></div>
          <div><span style="color:rgba(255,255,255,.5);">Role:</span> <span style="background:#c9748f;color:#fff;padding:2px 10px;border-radius:99px;font-size:.75rem;">Admin</span></div>
        </div>
        <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,.1);">
          <p style="color:rgba(255,255,255,.5);font-size:.8rem;line-height:1.6;">⚠️ Credentials badalne ke baad dobara login karna hoga. Email aur password dono yaad rakhein.</p>
        </div>
      </div>
      <div class="admin-form" style="margin-top:1.5rem;">
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;margin-bottom:1rem;">📦 Quick Stats</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;" id="quick-stats"><div style="color:var(--gray);">Loading...</div></div>
      </div>
    </div>
  </div>`;
  // Load quick stats
  api('/api/admin/stats').then(s => {
    const el = document.getElementById('quick-stats');
    if (el && s.totalOrders !== undefined) el.innerHTML = `
      <div style="text-align:center;padding:1rem;background:var(--light-gray);border-radius:8px;"><div style="font-size:1.4rem;font-weight:700;color:var(--rose-dark);">${s.totalOrders}</div><div style="font-size:.75rem;color:var(--gray);">Total Orders</div></div>
      <div style="text-align:center;padding:1rem;background:var(--light-gray);border-radius:8px;"><div style="font-size:1.4rem;font-weight:700;color:var(--rose-dark);">${s.totalUsers}</div><div style="font-size:.75rem;color:var(--gray);">Customers</div></div>
      <div style="text-align:center;padding:1rem;background:var(--light-gray);border-radius:8px;"><div style="font-size:1.4rem;font-weight:700;color:var(--rose-dark);">${formatCurrency(s.totalRevenue)}</div><div style="font-size:.75rem;color:var(--gray);">Revenue</div></div>
      <div style="text-align:center;padding:1rem;background:var(--light-gray);border-radius:8px;"><div style="font-size:1.4rem;font-weight:700;color:var(--rose-dark);">${s.totalProducts||'—'}</div><div style="font-size:.75rem;color:var(--gray);">Products</div></div>`;
  });
}

async function saveAdminCredentials() {
  const curPass = document.getElementById('set-cur-pass')?.value;
  const newEmail = document.getElementById('set-new-email')?.value;
  const name = document.getElementById('set-name')?.value;
  const newPass = document.getElementById('set-new-pass')?.value;
  const confPass = document.getElementById('set-conf-pass')?.value;
  const err = document.getElementById('set-err');
  if (!curPass) { err.textContent = 'Current password required'; return; }
  if (newPass && newPass !== confPass) { err.textContent = 'New passwords do not match'; return; }
  if (newPass && newPass.length < 6) { err.textContent = 'Password minimum 6 characters hona chahiye'; return; }
  err.textContent = '';
  const r = await api('/api/admin/change-credentials', { method: 'PUT', body: { currentPassword: curPass, newEmail, newPassword: newPass || undefined, name } });
  if (r.error) { err.textContent = r.error; return; }
  currentUser = { ...currentUser, name: r.user.name, email: r.user.email };
  updateHeader();
  toast('✦ Credentials updated! Please note new login details.', 'success');
  adminSettings();
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

