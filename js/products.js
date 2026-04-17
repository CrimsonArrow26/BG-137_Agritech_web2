// ============================================================
// products.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

const CATEGORIES = ['vegetables', 'fruits', 'dairy', 'grains', 'herbs'];

async function fetchProducts(filters = {}) {
  let query = supabase
    .from('products')
    .select('id, name, description, category, price, unit, stock_qty, image_url, is_active, farmer_id, user_profiles(full_name, address)')
    .eq('is_active', true)
    .gt('stock_qty', 0);

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category.toLowerCase());
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*, user_profiles(full_name, phone, address)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function fetchFarmerProducts(farmerId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, category, price, unit, stock_qty, image_url, is_active, created_at, updated_at')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function createProduct(productData) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from('products')
    .insert({ ...productData, farmer_id: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

async function uploadProductImage(file, farmerId) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  }
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit.');
  }

  const ext = file.name.split('.').pop();
  const path = `${farmerId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

async function validateStock(productId, quantity) {
  const { data, error } = await supabase
    .from('products')
    .select('stock_qty')
    .eq('id', productId)
    .single();
  if (error) throw error;
  return data.stock_qty >= quantity;
}

function formatProductForDisplay(p) {
  return {
    id: p.id,
    title: p.name,
    category: p.category.charAt(0).toUpperCase() + p.category.slice(1),
    price: p.price,
    unit: p.unit,
    farmer: p.user_profiles?.full_name || 'Unknown Farmer',
    location: p.user_profiles?.address || 'Unknown Location',
    image: p.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E',
    stock: p.stock_qty,
    desc: p.description || ''
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  let allProducts = [];

  const grid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categoryFilter');
  const emptyState = document.getElementById('emptyState');

  // Check if user is farmer and show sell button
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.role === 'farmer') {
        const farmerSellSection = document.getElementById('farmer-sell-section');
        if (farmerSellSection) {
          farmerSellSection.style.display = 'block';
        }
      }
    }
  } catch (err) {
    // Silent fail - button just won't show
  }

  const urlParams = new URLSearchParams(window.location.search);
  const urlCat = urlParams.get('category');
  const urlQ = urlParams.get('q');

  if (urlCat && categorySelect) {
    Array.from(categorySelect.options).forEach(opt => {
      if (opt.value.toLowerCase() === urlCat.toLowerCase()) categorySelect.value = opt.value;
    });
  }
  if (urlQ && searchInput) {
    searchInput.value = urlQ;
  }

  const render = (arr) => {
    if (!grid) return;
    grid.innerHTML = '';
    if (arr.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    arr.forEach(p => {
      const display = formatProductForDisplay(p);
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-img-wrap">
          <span class="product-badge">${display.category}</span>
          <img src="${display.image}" alt="${display.title}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2218%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'">
          <button class="quick-view-btn" onclick="window.location.href='product-details.html?id=${display.id}'">Quick View</button>
        </div>
        <div class="product-info">
          <span class="product-category">${display.category}</span>
          <a href="product-details.html?id=${display.id}"><h3 class="product-title">${display.title}</h3></a>
          <div class="product-farmer"><i class="fa-solid fa-wheat-awn mr-1"></i> ${display.farmer}</div>
          <div class="text-secondary text-sm mt-1 border-b pb-2"><i class="fa-solid fa-location-dot" style="margin-right:2px;"></i> ${display.location}</div>
          <div class="product-bottom">
            <div class="product-price">${Utils.formatCurrency(display.price)} <span>/ ${display.unit}</span></div>
            <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="addToCart('${display.id}')"><i class="fa-solid fa-cart-shopping"></i></button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    if (searchInput && searchInput.value) {
      const s = searchInput.value.toLowerCase();
      filtered = filtered.filter(f => {
        const name = f.name?.toLowerCase() || '';
        const farmer = f.user_profiles?.full_name?.toLowerCase() || '';
        return name.includes(s) || farmer.includes(s);
      });
    }

    if (categorySelect && categorySelect.value !== 'all') {
      filtered = filtered.filter(f => f.category === categorySelect.value.toLowerCase());
    }

    render(filtered);
  };

  if (searchInput) searchInput.addEventListener('input', Utils.debounce ? Utils.debounce(applyFilters, 300) : applyFilters);
  if (categorySelect) categorySelect.addEventListener('change', applyFilters);

  const quickModal = document.getElementById('quickPreviewModal');
  const closeBtn = document.getElementById('closeModalBtn');

  window.openModal = async (id) => {
    try {
      const p = await fetchProductById(id);
      if (!p || !quickModal) return;

      const display = formatProductForDisplay(p);

      document.getElementById('mpImg').src = display.image;
      document.getElementById('mpCat').textContent = display.category;
      document.getElementById('mpTitle').textContent = display.title;
      document.getElementById('mpFarmer').innerHTML = `<i class="fa-solid fa-wheat-awn mr-1"></i> ${display.farmer}`;
      document.getElementById('mpPrice').innerHTML = `${Utils.formatCurrency(display.price)} <span style="font-size:1rem;color:var(--text-secondary);font-weight:400;">/ ${display.unit}</span>`;
      document.getElementById('mpDesc').textContent = display.desc;
      document.getElementById('mpDetailsLink').href = `product-details.html?id=${display.id}`;

      const addBtn = document.getElementById('mpAddBtn');
      addBtn.onclick = () => { addToCart(display.id); quickModal.classList.remove('active'); };

      quickModal.classList.add('active');
    } catch (err) {
      Utils.showToast('Failed to load product details', 'error');
    }
  };

  if (closeBtn && quickModal) {
    closeBtn.addEventListener('click', () => quickModal.classList.remove('active'));
    quickModal.addEventListener('click', (e) => {
      if (e.target === quickModal) quickModal.classList.remove('active');
    });
  }

  try {
    Utils.showLoader ? Utils.showLoader() : null;
    allProducts = await fetchProducts({
      category: categorySelect?.value || 'all',
      search: searchInput?.value || ''
    });
    render(allProducts);
  } catch (err) {
    Utils.showToast('Failed to load products', 'error');
    console.error(err);
  } finally {
    Utils.hideLoader ? Utils.hideLoader() : null;
  }
});

window.addToCart = async function(id, qty = 1) {
  // Check if user is logged in first
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    Utils.showToast('Please log in to add items to cart', 'info');
    setTimeout(() => window.location.href = '/login.html', 1500);
    return;
  }

  if (!window.addToCartSupabase) {
    Utils.showToast('Cart system not loaded', 'error');
    return;
  }

  try {
    await window.addToCartSupabase(id, qty);
    Utils.showToast('Added to cart!', 'success');
  } catch (err) {
    Utils.showToast(err.message || 'Failed to add to cart', 'error');
  }
};
