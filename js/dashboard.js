// ============================================================
// dashboard.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

// ── Buyer data fetchers ───────────────────────────────────────

async function fetchBuyerStats(userId) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total_amount, status, created_at, order_items(quantity)')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  const totalSpent   = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;

  return { totalOrders: orders.length, totalSpent, activeOrders, recentOrders: orders };
}

async function fetchBuyerCartCount(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId);

  if (error) return 0;
  return data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

// ── Farmer data fetchers ──────────────────────────────────────

async function fetchFarmerStats(farmerId) {
  const [{ data: items }, { data: products }, { data: pendingOrders }] = await Promise.all([
    supabase
      .from('order_items')
      .select('quantity, unit_price, subtotal, orders(status)')
      .eq('farmer_id', farmerId),
    supabase
      .from('products')
      .select('id, name, is_active, stock_qty, price, image_url, category')
      .eq('farmer_id', farmerId),
    supabase
      .from('order_items')
      .select('id, orders!inner(status)')
      .eq('farmer_id', farmerId)
      .eq('orders.status', 'placed'),
  ]);

  const totalRevenue   = items?.reduce((sum, i) => sum + Number(i.subtotal), 0)       || 0;
  const totalSold      = items?.reduce((sum, i) => sum + i.quantity, 0)               || 0;
  const activeListings = products?.filter(p => p.is_active && p.stock_qty > 0).length || 0;
  const totalListings  = products?.length                                              || 0;
  const pendingCount   = pendingOrders?.length                                         || 0;

  return { totalRevenue, totalSold, activeListings, totalListings, pendingOrders: pendingCount, products: products || [] };
}

async function fetchFarmerRecentOrders(farmerId, limit = 6) {
  const { data, error } = await supabase
    .from('order_items')
    .select('id, quantity, subtotal, unit_price, product:products(name, image_url), order:orders(id, status, created_at)')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false, foreignTable: 'orders' })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function fetchFarmerProducts(farmerId, limit = 3) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock_qty, price, image_url, is_active, category')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Fetch last 7 days of order revenue for the farmer
async function fetchRevenueTimeline(farmerId) {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('order_items')
    .select('subtotal, orders!inner(created_at, status)')
    .eq('farmer_id', farmerId)
    .gte('orders.created_at', since.toISOString())
    .neq('orders.status', 'cancelled');

  if (error) return Array(7).fill(0);

  // Bucket by day (last 7 days, index 0 = oldest)
  const buckets = Array(7).fill(0);
  (data || []).forEach(item => {
    const orderDate = new Date(item.orders.created_at);
    const daysAgo   = Math.floor((Date.now() - orderDate.getTime()) / 86400000);
    const idx       = 6 - daysAgo;
    if (idx >= 0 && idx < 7) buckets[idx] += Number(item.subtotal);
  });
  return buckets;
}

// Fetch sales aggregated by category
async function fetchCategoryBreakdown(farmerId) {
  const { data, error } = await supabase
    .from('order_items')
    .select('subtotal, products!inner(category)')
    .eq('farmer_id', farmerId);

  if (error) return {};

  const map = {};
  (data || []).forEach(item => {
    const cat = item.products?.category || 'other';
    map[cat]  = (map[cat] || 0) + Number(item.subtotal);
  });
  return map;
}

async function fetchRecommendedProducts(limit = 3) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, image_url, unit, user_profiles(full_name)')
    .eq('is_active', true)
    .gt('stock_qty', 0)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ── Chart helpers ─────────────────────────────────────────────

function buildDayLabels() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return days[d.getDay()];
  });
}

function renderRevenueChart(data) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  const isDark       = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const textColor    = isDark ? '#aaa' : '#888';

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: buildDayLabels(),
      datasets: [{
        label: 'Revenue (₹)',
        data,
        borderColor:     '#40916C',
        backgroundColor: 'rgba(64,145,108,0.12)',
        borderWidth:     2.5,
        pointBackgroundColor: '#2D6A4F',
        pointRadius:     4,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          },
        },
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor, font: { size: 11 },
            callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v),
          },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderCategoryChart(categoryMap) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const COLORS = ['#2D6A4F', '#40916C', '#52B788', '#F4A261', '#E76F51', '#4361EE', '#7B2FBE'];
  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);

  if (labels.length === 0) {
    ctx.parentNode.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding-top:60px;">No sales data yet.</p>';
    return;
  }

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [{
        data: values,
        backgroundColor: COLORS.slice(0, labels.length),
        borderWidth: 2,
        borderColor: 'transparent',
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 12 }, padding: 14, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ₹${ctx.parsed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          },
        },
      },
    },
  });
}

// ── Animated KPI counter ──────────────────────────────────────
function animateCounter(el, target, isRupee = false, duration = 900) {
  const start = 0;
  const step  = 16;
  let current = start;
  const increment = target / (duration / step);

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = isRupee
      ? '₹' + current.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : Math.round(current).toString();
  }, step);
}

// ── Load farmer dashboard ─────────────────────────────────────
async function loadFarmerDashboard(farmerId, profileName) {
  // Set greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const titleEl = document.getElementById('farmer-welcome-title');
  const subEl   = document.getElementById('farmer-welcome-sub');
  if (titleEl) titleEl.textContent = `${greeting}, ${profileName}! 🌱`;
  if (subEl)   subEl.textContent   = `Here's what's happening with your store today.`;

  try {
    // Fetch everything in parallel
    const [stats, recentOrders, timeline, categoryMap, topProducts] = await Promise.all([
      fetchFarmerStats(farmerId),
      fetchFarmerRecentOrders(farmerId, 6),
      fetchRevenueTimeline(farmerId),
      fetchCategoryBreakdown(farmerId),
      fetchFarmerProducts(farmerId, 5),
    ]);

    // ── KPI cards with animated counters ────────────────────
    const revenueEl  = document.getElementById('kpi-revenue');
    const pendingEl  = document.getElementById('kpi-pending');
    const listingsEl = document.getElementById('kpi-listings');
    const soldEl     = document.getElementById('kpi-sold');

    if (revenueEl)  animateCounter(revenueEl,  stats.totalRevenue,  true);
    if (pendingEl)  animateCounter(pendingEl,  stats.pendingOrders, false);
    if (listingsEl) animateCounter(listingsEl, stats.activeListings, false);
    if (soldEl)     animateCounter(soldEl,     stats.totalSold,     false);

    const totalListingsEl = document.getElementById('kpi-total-listings');
    if (totalListingsEl) totalListingsEl.textContent = stats.totalListings;

    const pendingBadge = document.getElementById('kpi-pending-badge');
    if (pendingBadge && stats.pendingOrders === 0) {
      pendingBadge.textContent = 'All clear ✓';
      pendingBadge.className   = 'kpi-badge kpi-trend-up';
    }

    // ── Charts ───────────────────────────────────────────────
    renderRevenueChart(timeline);
    renderCategoryChart(categoryMap);

    // ── Recent Orders table ──────────────────────────────────
    const ordersTableBody = document.getElementById('farmer-recent-orders');
    if (ordersTableBody) {
      if (recentOrders.length === 0) {
        ordersTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--text-muted);">No orders received yet.</td></tr>`;
      } else {
        ordersTableBody.innerHTML = recentOrders.map(o => {
          const status = (o.order?.status || 'placed').toLowerCase();
          return `
            <tr>
              <td><strong>#${(o.order?.id || '').slice(0, 8)}</strong><br><span style="font-size:0.75rem;color:var(--text-muted);">${new Date(o.order?.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</span></td>
              <td>${o.product?.name || 'Unknown'} <span style="color:var(--text-muted);font-size:0.82rem;">×${o.quantity}</span></td>
              <td><strong>${Utils.formatCurrency(o.subtotal)}</strong></td>
              <td><span class="sbadge sbadge-${status}">${status}</span></td>
            </tr>
          `;
        }).join('');
      }
    }

    // ── Top Products list ────────────────────────────────────
    const productsEl = document.getElementById('farmer-products-grid');
    if (productsEl) {
      if (topProducts.length === 0) {
        productsEl.innerHTML = `
          <div style="text-align:center;padding:36px;color:var(--text-muted);">
            <i class="fa-solid fa-wheat-awn" style="font-size:2.5rem;margin-bottom:12px;opacity:0.4;display:block;"></i>
            No products yet. <a href="add-product.html" style="color:var(--dash-green);font-weight:600;">Add your first</a>
          </div>
        `;
      } else {
        const maxStock = Math.max(...topProducts.map(p => p.stock_qty), 1);
        productsEl.innerHTML = topProducts.map(p => {
          const pct        = Math.round((p.stock_qty / maxStock) * 100);
          const fillColor  = p.stock_qty === 0 ? '#E76F51' : p.stock_qty <= 10 ? '#F4A261' : '#40916C';
          const noImg      = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='52' height='52'%3E%3Crect fill='%23f0f0f0' width='52' height='52' rx='10'/%3E%3Ctext fill='%23bbb' font-family='Arial' font-size='10' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImg%3C/text%3E%3C/svg%3E`;
          return `
            <div class="product-row">
              <img src="${p.image_url || noImg}" alt="${p.name}" class="product-thumb" onerror="this.src='${noImg}'">
              <div class="product-row-info">
                <div class="product-row-name">${p.name}</div>
                <div class="product-row-price">${Utils.formatCurrency(p.price)}</div>
              </div>
              <div class="stock-bar-wrap">
                <div class="stock-bar-track">
                  <div class="stock-bar-fill" style="width:${pct}%;background:${fillColor};"></div>
                </div>
                <div class="stock-label">${p.stock_qty} left</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

  } catch (err) {
    Utils.showToast('Failed to load some dashboard data', 'error');
  }
}

// ── Load buyer dashboard ──────────────────────────────────────
async function loadBuyerDashboard(userId) {
  try {
    const stats     = await fetchBuyerStats(userId);
    const cartCount = await fetchBuyerCartCount(userId);

    const s1 = document.getElementById('buyer-stat1Val');
    const s2 = document.getElementById('buyer-stat2Val');
    const s3 = document.getElementById('buyer-stat3Val');
    const s4 = document.getElementById('buyer-stat4Val');

    if (s1) s1.textContent = Utils.formatCurrency(stats.totalSpent);
    if (s2) s2.textContent = stats.totalOrders.toString();
    if (s3) s3.textContent = stats.activeOrders.toString();
    if (s4) s4.textContent = cartCount.toString();

    const ordersTable = document.getElementById('buyer-recent-orders');
    if (ordersTable) {
      if (stats.recentOrders.length === 0) {
        ordersTable.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--text-muted);">No orders yet. <a href="products.html" style="color:var(--primary);">Start shopping</a></td></tr>`;
      } else {
        ordersTable.innerHTML = stats.recentOrders.slice(0, 5).map(o => {
          const status = o.status.toLowerCase();
          return `
            <tr>
              <td><strong>#${o.id.slice(0, 8)}</strong></td>
              <td>${new Date(o.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
              <td>${o.order_items?.length || 0} items</td>
              <td><strong>${Utils.formatCurrency(o.total_amount)}</strong></td>
              <td><span class="sbadge sbadge-${status}">${status}</span></td>
            </tr>
          `;
        }).join('');
      }
    }

    const recs     = await fetchRecommendedProducts(3);
    const recsGrid = document.getElementById('buyer-recommendations-grid');
    if (recsGrid) {
      recsGrid.innerHTML = recs.map(p => `
        <div style="background:var(--bg-offset,#fff);border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);border:1px solid var(--border,#e8edf0);">
          <img src="${p.image_url || ''}" alt="${p.name}" style="width:100%;height:140px;object-fit:cover;">
          <div style="padding:16px;">
            <h4 style="margin-bottom:4px;font-size:1rem;"><a href="product-details.html?id=${p.id}" style="color:var(--text-main);text-decoration:none;">${p.name}</a></h4>
            <p style="color:var(--text-muted);font-size:0.84rem;margin-bottom:12px;"><i class="fa-solid fa-wheat-awn"></i> ${p.user_profiles?.full_name || 'Farm'}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:700;color:var(--primary);">${Utils.formatCurrency(p.price)}<span style="font-size:0.82rem;color:var(--text-muted);font-weight:400;">/${p.unit}</span></span>
              <button onclick="addToCart('${p.id}')" style="background:var(--primary);color:white;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    Utils.showToast('Failed to load dashboard data', 'error');
  }
}

// ── Bootstrap ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    Utils.showLoader?.();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }

    const { user, profile } = currentUser;
    const isFarmer          = profile.role === 'farmer';

    const farmerDash = document.getElementById('farmer-dashboard');
    const buyerDash  = document.getElementById('buyer-dashboard');

    if (isFarmer && farmerDash) {
      farmerDash.style.display = 'block';
      await loadFarmerDashboard(user.id, profile.full_name || 'Farmer');
    } else if (buyerDash) {
      buyerDash.style.display = 'block';

      const titleEl = document.getElementById('dashboard-title');
      const roleEl  = document.getElementById('dashboard-role');
      if (titleEl) titleEl.textContent = 'My Dashboard';
      if (roleEl)  roleEl.textContent  = `Welcome back, ${profile.full_name}! Browse fresh produce and track your orders.`;

      await loadBuyerDashboard(user.id);
    }

  } catch (err) {
    Utils.showToast('Failed to load dashboard', 'error');
  } finally {
    Utils.hideLoader?.();
  }
});
