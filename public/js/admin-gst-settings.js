/* ── GST REPORT ADMIN PANEL ──────────────────────────────────── */
async function adminGST() {
  const orders = await api('/api/admin/orders');
  window.lastGSTOrders = orders; // Store for export
  
  // Calculate GST data with proper CGST/SGST split
  const gstData = orders.reduce((acc, o) => {
    const taxableAmt = o.grandTotal ? Math.round((o.grandTotal || 0) / 1.18) : 0;
    const cgst = Math.round(taxableAmt * 0.09);
    const sgst = Math.round(taxableAmt * 0.09);
    return { 
      ...acc, 
      totalSales: (acc.totalSales || 0) + (o.grandTotal || 0), 
      totalCGST: (acc.totalCGST || 0) + cgst,
      totalSGST: (acc.totalSGST || 0) + sgst,
      totalGST: (acc.totalGST || 0) + cgst + sgst
    };
  }, {});
  
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header">
    <h1 class="admin-page-title">📊 GST Management System</h1>
    <span style="font-size:.875rem;color:var(--gray);">Track and file GST returns</span>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon">💰</div>
      <div class="stat-label">Total Sales</div>
      <div class="stat-value">₹${(gstData.totalSales || 0).toLocaleString('en-IN')}</div>
      <div class="stat-change">This period</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🏷️</div>
      <div class="stat-label">Total GST Due</div>
      <div class="stat-value">₹${(gstData.totalGST || 0).toLocaleString('en-IN')}</div>
      <div class="stat-change">CGST: ₹${(gstData.totalCGST || 0).toLocaleString('en-IN')} | SGST: ₹${(gstData.totalSGST || 0).toLocaleString('en-IN')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📋</div>
      <div class="stat-label">Total Orders</div>
      <div class="stat-value">${orders.length}</div>
      <div class="stat-change">Tracked orders</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-label">Ready for Filing</div>
      <div class="stat-value">${orders.filter(o => o.status === 'delivered').length}</div>
      <div class="stat-change">Completed orders</div>
    </div>
  </div>
  
  <div class="admin-table-wrap" style="margin-bottom:2rem;">
    <div class="admin-table-header">
      <h3>📊 GSTR-1 Export Data (Sales)</h3>
      <button class="btn-primary btn-sm" onclick="exportGSTExcel()">
        <i class="fas fa-download"></i> Export to Excel
      </button>
    </div>
    <table class="gst-report-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Order ID</th>
          <th>Customer</th>
          <th>State</th>
          <th>Taxable Amt</th>
          <th>CGST (9%)</th>
          <th>SGST (9%)</th>
          <th>Total GST</th>
          <th>Grand Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(o => {
          const taxableAmt = o.grandTotal ? Math.round((o.grandTotal || 0) / 1.18) : 0;
          const cgst = Math.round(taxableAmt * 0.09);
          const sgst = Math.round(taxableAmt * 0.09);
          const totalGst = cgst + sgst;
          const state = o.shippingAddress?.state || o.customerState || 'Unknown';
          return \`<tr>
            <td style="font-size:.8rem;">\${formatDate(o.createdAt)}</td>
            <td><b style="color:var(--rose-dark);font-size:.75rem;">\${o.id.substring(0,8)}...</b></td>
            <td>\${o.userName}</td>
            <td><span style="background:var(--light-gray);padding:0.25rem 0.5rem;border-radius:4px;font-size:.8rem;">\${state}</span></td>
            <td>₹\${taxableAmt.toLocaleString('en-IN')}</td>
            <td style="color:var(--rose);">₹\${cgst.toLocaleString('en-IN')}</td>
            <td style="color:var(--gold);">₹\${sgst.toLocaleString('en-IN')}</td>
            <td><b>₹\${totalGst.toLocaleString('en-IN')}</b></td>
            <td><b style="color:var(--rose-dark);">₹\${(o.grandTotal || 0).toLocaleString('en-IN')}</b></td>
            <td><span class="order-status-badge status-\${o.status}" style="font-size:.7rem;">\${o.status.replace('_',' ')}</span></td>
          </tr>\`;
        }).join('')}
      </tbody>
    </table>
  </div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem;">
    <div class="admin-table-wrap">
      <div class="admin-table-header"><h3>🔔 GST Filing Reminders</h3></div>
      <div style="padding:1.5rem;">
        <div style="margin-bottom:1rem;padding:1rem;background:#fffaf0;border-left:4px solid var(--gold);border-radius:8px;">
          <div style="font-weight:700;color:var(--gold);margin-bottom:.5rem;">GSTR-1 Filing</div>
          <div style="font-size:.85rem;color:var(--gray);">Due by: 11th of next month</div>
          <div style="font-size:.8rem;color:var(--gray);margin-top:.5rem;">Supplies made during the month</div>
        </div>
        <div style="padding:1rem;background:#f0faff;border-left:4px solid var(--rose);border-radius:8px;">
          <div style="font-weight:700;color:var(--rose);margin-bottom:.5rem;">GSTR-3B Filing</div>
          <div style="font-size:.85rem;color:var(--gray);">Due by: 20th of next month</div>
          <div style="font-size:.8rem;color:var(--gray);margin-top:.5rem;">Summary with ITC and payment</div>
        </div>
      </div>
    </div>
    
    <div class="admin-table-wrap">
      <div class="admin-table-header"><h3>📈 Monthly Summary</h3></div>
      <div style="padding:1.5rem;">
        <div style="display:grid;gap:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--light-gray);border-radius:8px;">
            <span style="font-size:.85rem;color:var(--gray);">Total Orders</span>
            <span style="font-weight:700;font-size:1.1rem;color:var(--rose-dark);">${orders.length}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--light-gray);border-radius:8px;">
            <span style="font-size:.85rem;color:var(--gray);">Total Sales</span>
            <span style="font-weight:700;font-size:1.1rem;color:var(--rose-dark);">₹${(gstData.totalSales || 0).toLocaleString('en-IN')}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--light-gray);border-radius:8px;">
            <span style="font-size:.85rem;color:var(--gray);">GST Payable</span>
            <span style="font-weight:700;font-size:1.1rem;color:var(--gold);">₹${(gstData.totalGST || 0).toLocaleString('en-IN')}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--light-gray);border-radius:8px;">
            <span style="font-size:.75rem;color:var(--gray);">CGST (9%) | SGST (9%)</span>
            <span style="font-weight:700;font-size:0.95rem;color:var(--dark);">₹${(gstData.totalCGST || 0).toLocaleString('en-IN')} | ₹${(gstData.totalSGST || 0).toLocaleString('en-IN')}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;background:var(--light-gray);border-radius:8px;">
            <span style="font-size:.85rem;color:var(--gray);">Avg Order Value</span>
            <span style="font-weight:700;font-size:1.1rem;color:var(--dark);">₹${orders.length > 0 ? Math.round((gstData.totalSales || 0) / orders.length).toLocaleString('en-IN') : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function exportGSTExcel() {
  const orders = window.lastGSTOrders || [];
  
  if (orders.length === 0) {
    toast('No orders to export!', 'warning');
    return;
  }
  
  // CSV Header
  let csvContent = 'Date,Order_ID,Customer,State,Taxable_Amount,CGST_9%,SGST_9%,Total_GST,Grand_Total,Payment_Status\n';
  
  // CSV Rows
  let totalTaxable = 0, totalCGST = 0, totalSGST = 0, totalGST = 0, totalRevenue = 0;
  
  orders.forEach(o => {
    const taxableAmt = o.grandTotal ? Math.round((o.grandTotal || 0) / 1.18) : 0;
    const cgst = Math.round(taxableAmt * 0.09);
    const sgst = Math.round(taxableAmt * 0.09);
    const totalGst = cgst + sgst;
    const state = o.shippingAddress?.state || o.customerState || 'Unknown';
    
    csvContent += `"${formatDate(o.createdAt)}","${o.id}","${o.userName}","${state}",${taxableAmt},${cgst},${sgst},${totalGst},${o.grandTotal || 0},"${o.status}"\n`;
    
    totalTaxable += taxableAmt;
    totalCGST += cgst;
    totalSGST += sgst;
    totalGST += totalGst;
    totalRevenue += (o.grandTotal || 0);
  });
  
  // Totals Row
  csvContent += `\n"TOTAL","","","",${totalTaxable},${totalCGST},${totalSGST},${totalGST},${totalRevenue},\n`;
  
  // State Summary
  csvContent += `\n\n--- STATE WISE SUMMARY ---\n`;
  csvContent += 'State,Total_Orders,Total_Sales,Total_GST\n';
  
  const stateData = {};
  orders.forEach(o => {
    const state = o.shippingAddress?.state || o.customerState || 'Unknown';
    const taxableAmt = o.grandTotal ? Math.round((o.grandTotal || 0) / 1.18) : 0;
    const gst = Math.round(taxableAmt * 0.18);
    
    if (!stateData[state]) stateData[state] = { orders: 0, sales: 0, gst: 0 };
    stateData[state].orders += 1;
    stateData[state].sales += (o.grandTotal || 0);
    stateData[state].gst += gst;
  });
  
  Object.entries(stateData)
    .sort((a, b) => b[1].sales - a[1].sales)
    .forEach(([state, data]) => {
      csvContent += `"${state}",${data.orders},${data.sales},${data.gst}\n`;
    });
  
  // Download File
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
  element.setAttribute('download', `GST_Report_${new Date().toISOString().split('T')[0]}.csv`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  toast(`✅ GST Report exported! (${orders.length} orders, ${Object.keys(stateData).length} states)`, 'success');
}

/* ── ADMIN SETTINGS ──────────────────────────────────────────── */
async function adminSettings() {
  const s = await api('/api/admin/settings');
  
  document.getElementById('admin-content').innerHTML = `
  <div class="admin-header">
    <h1 class="admin-page-title">⚙️ Business Settings</h1>
  </div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
    
    <!-- SHIPPING SETTINGS -->
    <div class="admin-form">
      <h3>🚚 Shipping Settings</h3>
      <div class="form-group">
        <label>Free Shipping Minimum Amount</label>
        <input type="number" id="s-free-ship" value="${s.freeShippingMin || 999}" placeholder="999"/>
      </div>
      <div class="form-group">
        <label>Standard Shipping Charge</label>
        <input type="number" id="s-ship-charge" value="${s.shippingCharge || 49}" placeholder="49"/>
      </div>
      <div class="form-group">
        <label>Delivery Days (Standard)</label>
        <input type="number" id="s-ship-days" value="${s.deliveryDays || 3}" placeholder="3"/>
      </div>
      <div class="form-group">
        <label>Delivery Note for Customers</label>
        <textarea id="s-ship-note" placeholder="E.g., Standard delivery in 3-5 days" style="resize:vertical;height:80px;">${s.shippingNote || ''}</textarea>
      </div>
      <button class="btn-primary" onclick="saveShippingSettings()">
        <i class="fas fa-save"></i> Save Shipping Settings
      </button>
    </div>
    
    <!-- GST SETTINGS -->
    <div class="admin-form">
      <h3>🏷️ GST Settings</h3>
      <div class="form-group">
        <label>Default GST Rate (%)</label>
        <input type="number" id="s-gst-rate" value="18" max="100" placeholder="18"/>
      </div>
      <div class="form-group">
        <label>GST Registration Number</label>
        <input type="text" id="s-gstin" value="${s.gstin || ''}" placeholder="27XXXXX1234X1ZX"/>
      </div>
      <div class="form-group">
        <label>HSN Code (Default)</label>
        <input type="text" id="s-hsn" value="${s.hsn || '7117'}" placeholder="7117"/>
      </div>
      <div class="form-group">
        <label>Business Name (for invoices)</label>
        <input type="text" id="s-business" value="${s.storeName || ''}" placeholder="Lencho India"/>
      </div>
      <button class="btn-primary" onclick="saveGSTSettings()">
        <i class="fas fa-save"></i> Save GST Settings
      </button>
    </div>
  </div>
  
  <!-- STORE CONTACT INFO -->
  <div class="admin-form" style="margin-top:2rem;max-width:100%;">
    <h3>📞 Store Contact Information</h3>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;">
      <div class="form-group">
        <label>Store Email</label>
        <input type="email" id="s-email" value="${s.storeEmail || ''}" placeholder="business@lencho.in"/>
      </div>
      <div class="form-group">
        <label>Store Phone</label>
        <input type="tel" id="s-phone" value="${s.storePhone || ''}" placeholder="+91-7404217625"/>
      </div>
      <div class="form-group">
        <label>WhatsApp Number</label>
        <input type="tel" id="s-whatsapp" value="${s.whatsappNumber || ''}" placeholder="919999999999"/>
      </div>
      <div class="form-group">
        <label>Store Address</label>
        <textarea id="s-address" placeholder="197 Sarakpur, Barara, Ambala" style="resize:vertical;height:80px;">${s.storeAddress || ''}</textarea>
      </div>
    </div>
    <button class="btn-primary" onclick="saveStoreSettings()">
      <i class="fas fa-save"></i> Save Store Settings
    </button>
  </div>`;
}

async function saveShippingSettings() {
  const data = {
    freeShippingMin: parseInt(document.getElementById('s-free-ship')?.value) || 999,
    shippingCharge: parseInt(document.getElementById('s-ship-charge')?.value) || 49,
    deliveryDays: parseInt(document.getElementById('s-ship-days')?.value) || 3,
    shippingNote: document.getElementById('s-ship-note')?.value || ''
  };
  const r = await api('/api/admin/settings', { method: 'POST', body: data });
  if (r.error) toast('Error saving settings: ' + r.error, 'error');
  else toast('✅ Shipping settings saved successfully!', 'success');
}

async function saveGSTSettings() {
  const data = {
    gstRate: parseInt(document.getElementById('s-gst-rate')?.value) || 18,
    gstin: document.getElementById('s-gstin')?.value || '',
    hsn: document.getElementById('s-hsn')?.value || '7117',
    storeName: document.getElementById('s-business')?.value || ''
  };
  const r = await api('/api/admin/settings', { method: 'POST', body: data });
  if (r.error) toast('Error saving settings: ' + r.error, 'error');
  else toast('✅ GST settings saved successfully!', 'success');
}

async function saveStoreSettings() {
  const data = {
    storeEmail: document.getElementById('s-email')?.value || '',
    storePhone: document.getElementById('s-phone')?.value || '',
    whatsappNumber: document.getElementById('s-whatsapp')?.value || '',
    storeAddress: document.getElementById('s-address')?.value || ''
  };
  const r = await api('/api/admin/settings', { method: 'POST', body: data });
  if (r.error) toast('Error saving settings: ' + r.error, 'error');
  else toast('✅ Store settings saved successfully!', 'success');
}
