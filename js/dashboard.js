// ============================================================
// dashboard.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

async function fetchBuyerStats(userId) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total_amount, status, created_at, order_items(quantity)')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;

  return {
    totalOrders: orders.length,
    totalSpent,
    activeOrders,
    recentOrders: orders
  };
}

async function fetchBuyerCartCount(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId);

  if (error) return 0;
  return data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

async function fetchFarmerStats(farmerId) {
  const [{ data: items }, { data: products }, { data: pendingOrders }] = await Promise.all([
    supabase
      .from('order_items')
      .select('quantity, unit_price, subtotal, orders(status)')
      .eq('farmer_id', farmerId),
    supabase
      .from('products')
      .select('id, is_active, stock_qty')
      .eq('farmer_id', farmerId),
    supabase
      .from('order_items')
      .select('id, orders!inner(status)')
      .eq('farmer_id', farmerId)
      .eq('orders.status', 'placed')
  ]);

  const totalRevenue = items?.reduce((sum, i) => sum + Number(i.subtotal), 0) || 0;
  const totalSold = items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const activeListings = products?.filter(p => p.is_active && p.stock_qty > 0).length || 0;
  const totalListings = products?.length || 0;
  const pendingCount = pendingOrders?.length || 0;

  return {
    totalRevenue,
    totalSold,
    activeListings,
    totalListings,
    pendingOrders: pendingCount
  };
}

async function fetchFarmerRecentOrders(farmerId, limit = 5) {
  const { data, error } = await supabase
    .from('order_items')
    .select('id, quantity, subtotal, unit_price, product:products(name), order:orders(id, status, created_at, buyer:user_profiles(full_name))')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false, foreignTable: 'orders' })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function fetchFarmerProducts(farmerId, limit = 3) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock_qty, price, image_url, is_active')
    .eq('farmer_id', farmerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    Utils.showLoader?.();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }

    const { user, profile } = currentUser;
    const isFarmer = profile.role === 'farmer';

    // Update header
    const dashboardTitle = document.getElementById('dashboard-title');
    const dashboardRole = document.getElementById('dashboard-role');
    if (dashboardTitle) {
      dashboardTitle.textContent = isFarmer ? 'Seller Dashboard' : 'My Dashboard';
    }
    if (dashboardRole) {
      dashboardRole.textContent = isFarmer 
        ? `Welcome back, ${profile.full_name}! Manage your products and orders.`
        : `Welcome back, ${profile.full_name}! Browse fresh produce and track your orders.`;
    }

    // Show appropriate dashboard
    const farmerDashboard = document.getElementById('farmer-dashboard');
    const buyerDashboard = document.getElementById('buyer-dashboard');

    if (isFarmer && farmerDashboard) {
      farmerDashboard.style.display = 'block';
      await loadFarmerDashboard(user.id);
    } else if (buyerDashboard) {
      buyerDashboard.style.display = 'block';
      await loadBuyerDashboard(user.id);
    }

  } catch (err) {
    Utils.showToast('Failed to load dashboard', 'error');
    console.error(err);
  } finally {
    Utils.hideLoader?.();
  }
});

async function loadFarmerDashboard(farmerId) {
  try {
    // Fetch stats
    const stats = await fetchFarmerStats(farmerId);

    // Update stat cards
    const stat1Val = document.getElementById('stat1Val');
    const stat2Val = document.getElementById('stat2Val');
    const stat3Val = document.getElementById('stat3Val');
    const stat4Val = document.getElementById('stat4Val');

    if (stat1Val) stat1Val.textContent = Utils.formatCurrency(stats.totalRevenue);
    if (stat2Val) stat2Val.textContent = stats.activeListings.toString();
    if (stat3Val) stat3Val.textContent = stats.totalSold.toString();
    if (stat4Val) stat4Val.textContent = stats.pendingOrders.toString();

    // Load recent orders
    const recentOrders = await fetchFarmerRecentOrders(farmerId, 5);
    const ordersTable = document.getElementById('farmer-recent-orders');
    if (ordersTable) {
      if (recentOrders.length === 0) {
        ordersTable.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">No orders received yet.</td></tr>`;
      } else {
        ordersTable.innerHTML = recentOrders.map(o => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 12px;"><strong>#${o.order?.id?.slice(0, 8) || 'N/A'}</strong></td>
            <td style="padding: 12px;">${o.product?.name || 'Unknown'}</td>
            <td style="padding: 12px;">${new Date(o.order?.created_at).toLocaleDateString()}</td>
            <td style="padding: 12px;">${Utils.formatCurrency(o.subtotal)}</td>
            <td style="padding: 12px;"><span class="status-badge status-${o.order?.status?.toLowerCase() || 'placed'}">${o.order?.status || 'Placed'}</span></td>
          </tr>
        `).join('');
      }
    }

    // Load products preview
    const products = await fetchFarmerProducts(farmerId, 3);
    const productsGrid = document.getElementById('farmer-products-grid');
    if (productsGrid) {
      if (products.length === 0) {
        productsGrid.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--text-muted); grid-column: 1 / -1;">
            <i class="fa-solid fa-wheat-awn" style="font-size: 3rem; margin-bottom: 16px;"></i>
            <p>No products listed yet. <a href="add-product.html" style="color: var(--primary);">Add your first product</a></p>
          </div>
        `;
      } else {
        productsGrid.innerHTML = products.map(p => `
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid var(--border);">
            <img src="${p.image_url || 'https://via.placeholder.com/400x120?text=No+Image'}" alt="${p.name}" style="width:100%; height:140px; object-fit:cover;">
            <div style="padding: 16px;">
              <h4 style="margin-bottom: 4px; font-size: 1.1rem; color: var(--text-main);">${p.name}</h4>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 12px;">${p.stock_qty} in stock</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">${Utils.formatCurrency(p.price)}</span>
                <a href="my-products.html" style="color: var(--primary); font-size: 0.9rem; font-weight: 500;">Edit</a>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load farmer dashboard:', err);
    Utils.showToast('Failed to load some dashboard data', 'error');
  }
}

async function loadBuyerDashboard(userId) {
  try {
    // Fetch stats
    const stats = await fetchBuyerStats(userId);
    const cartCount = await fetchBuyerCartCount(userId);

    // Update stat cards
    const stat1Val = document.getElementById('buyer-stat1Val');
    const stat2Val = document.getElementById('buyer-stat2Val');
    const stat3Val = document.getElementById('buyer-stat3Val');
    const stat4Val = document.getElementById('buyer-stat4Val');

    if (stat1Val) stat1Val.textContent = Utils.formatCurrency(stats.totalSpent);
    if (stat2Val) stat2Val.textContent = stats.totalOrders.toString();
    if (stat3Val) stat3Val.textContent = stats.activeOrders.toString();
    if (stat4Val) stat4Val.textContent = cartCount.toString();

    // Load recent orders
    const ordersTable = document.getElementById('buyer-recent-orders');
    if (ordersTable) {
      if (stats.recentOrders.length === 0) {
        ordersTable.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">No orders placed yet. <a href="products.html" style="color: var(--primary);">Start shopping</a></td></tr>`;
      } else {
        ordersTable.innerHTML = stats.recentOrders.slice(0, 5).map(o => `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 12px;"><strong>#${o.id.slice(0, 8)}</strong></td>
            <td style="padding: 12px;">${new Date(o.created_at).toLocaleDateString()}</td>
            <td style="padding: 12px;">${o.order_items?.length || 0} items</td>
            <td style="padding: 12px;">${Utils.formatCurrency(o.total_amount)}</td>
            <td style="padding: 12px;"><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
          </tr>
        `).join('');
      }
    }

    // Load recommendations
    const recs = await fetchRecommendedProducts(3);
    const recsGrid = document.getElementById('buyer-recommendations-grid');
    if (recsGrid) {
      recsGrid.innerHTML = recs.map(p => `
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid var(--border);">
          <img src="${p.image_url || 'https://via.placeholder.com/400x140?text=No+Image'}" alt="${p.name}" style="width:100%; height:140px; object-fit:cover;">
          <div style="padding: 16px;">
            <h4 style="margin-bottom: 4px; font-size: 1.05rem;">
              <a href="product-details.html?id=${p.id}" style="color: var(--text-main); text-decoration: none;">${p.name}</a>
            </h4>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 12px;">
              <i class="fa-solid fa-wheat-awn"></i> ${p.user_profiles?.full_name || 'Unknown Farm'}
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: var(--primary);">${Utils.formatCurrency(p.price)}<span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400;">/${p.unit}</span></span>
              <button onclick="addToCart('${p.id}')" style="background: var(--primary); color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer;">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load buyer dashboard:', err);
    Utils.showToast('Failed to load some dashboard data', 'error');
  }
}
