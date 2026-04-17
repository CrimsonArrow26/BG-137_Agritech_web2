// ============================================================
// cart.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

async function fetchCart() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(id, name, price, unit, image_url, stock_qty, farmer_id, user_profiles(full_name))')
    .eq('user_id', session.user.id);
  if (error) throw error;
  return data || [];
}

async function validateStock(productId, quantity) {
  const { data, error } = await supabase
    .from('products')
    .select('stock_qty')
    .eq('id', productId)
    .single();
  if (error || !data) return false;
  return data.stock_qty >= quantity;
}

async function addToCart(productId, quantity = 1) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login.html';
    return;
  }

  const hasStock = await validateStock(productId, quantity);
  if (!hasStock) {
    throw new Error('Not enough stock available');
  }

  const { error } = await supabase.rpc('increment_cart_qty', {
    p_user_id: session.user.id,
    p_product_id: productId,
    p_qty: quantity
  });
  if (error) throw error;
}

async function updateCartQty(cartItemId, quantity) {
  if (quantity < 1) {
    await removeFromCart(cartItemId);
    return;
  }
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId);
  if (error) throw error;
}

async function removeFromCart(cartItemId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);
  if (error) throw error;
}

async function clearCart(userId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

async function getCartCount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id);
  if (error) return 0;
  return count || 0;
}

async function getCartTotal() {
  const cart = await fetchCart();
  return cart.reduce((sum, item) => sum + (item.quantity * item.products.price), 0);
}

document.addEventListener('DOMContentLoaded', async () => {
  const cartGrid = document.getElementById('cart-container');
  let cartItems = [];

  const renderCart = async () => {
    if (!cartGrid) return;

    cartGrid.innerHTML = '';
    let subtotal = 0;

    if (cartItems.length === 0) {
      cartGrid.innerHTML = `
        <div style="padding: 3rem; text-align: center; color: var(--text-secondary);">
          <i class="fa-solid fa-basket-shopping mb-2" style="font-size: 3rem; opacity:0.3;"></i>
          <h3>Your cart is empty</h3>
          <p class="mb-3">Looks like you haven't added any fresh produce yet.</p>
          <a href="products.html" class="btn btn-primary">Browse Marketplace</a>
        </div>
      `;
      if (window.updateNavCartCount) await window.updateNavCartCount();
      return;
    }

    cartItems.forEach((item) => {
      const product = item.products;
      const lineTotal = item.quantity * product.price;
      subtotal += lineTotal;

      cartGrid.innerHTML += `
        <div class="card mb-2" style="display:flex; gap:1.5rem; align-items:center; background:var(--background); padding:1rem; border-radius:12px; margin-bottom:1rem;">
          <img src="${product.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2212%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'}" alt="${product.name}" style="width:100px; height:100px; object-fit:cover; border-radius:var(--border-radius);">
          <div style="flex:1;">
            <h4 style="margin:0;"><a href="product-details.html?id=${product.id}" style="color:inherit; text-decoration:none;">${product.name}</a></h4>
            <p class="text-secondary text-sm mb-1" style="color:var(--text-muted);"><i class="fa-solid fa-wheat-awn"></i> ${product.user_profiles?.full_name || 'Unknown Farmer'}</p>
            <p style="font-weight:700; color:var(--primary);">${Utils.formatCurrency(product.price)} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:400;">/ ${product.unit}</span></p>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem; border:1px solid var(--border); border-radius:8px; padding:5px;">
            <button style="background:none; border:none; cursor:pointer; color:var(--text-main);" onclick="changeQty('${item.id}', ${item.quantity - 1})"><i class="fa-solid fa-minus"></i></button>
            <span style="font-weight:600; width:30px; text-align:center;">${item.quantity}</span>
            <button style="background:none; border:none; cursor:pointer; color:var(--text-main);" onclick="changeQty('${item.id}', ${item.quantity + 1})"><i class="fa-solid fa-plus"></i></button>
          </div>
          <div style="font-weight:800; width:80px; text-align:right; color:var(--text-main);">
            ${Utils.formatCurrency(lineTotal)}
          </div>
          <button style="background:none; border:none; cursor:pointer; color:var(--danger); margin-left:1rem; font-size:1.2rem;" onclick="removeItem('${item.id}')" title="Remove">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
    });

    cartGrid.innerHTML += `
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:20px; margin-top:20px;">
        <h3 style="color:var(--text-main); margin:0;">Subtotal: <span style="color:var(--primary);">${Utils.formatCurrency(subtotal)}</span></h3>
        <a href="checkout.html" class="btn btn-primary" style="padding:15px 30px; border-radius:30px; font-size:1.1rem;">
          Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    `;

    if (window.updateNavCartCount) await window.updateNavCartCount();
  };

  window.changeQty = async (cartItemId, newQty) => {
    try {
      await updateCartQty(cartItemId, newQty);
      cartItems = await fetchCart();
      await renderCart();
    } catch (err) {
      Utils.showToast('Failed to update quantity', 'error');
    }
  };

  window.removeItem = async (cartItemId) => {
    try {
      await removeFromCart(cartItemId);
      Utils.showToast('Item removed from cart', 'info');
      cartItems = await fetchCart();
      await renderCart();
    } catch (err) {
      Utils.showToast('Failed to remove item', 'error');
    }
  };

  try {
    Utils.showLoader?.();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login.html';
      return;
    }
    cartItems = await fetchCart();
    await renderCart();
  } catch (err) {
    Utils.showToast('Failed to load cart', 'error');
    console.error(err);
  } finally {
    Utils.hideLoader?.();
  }
});

window.addToCartSupabase = addToCart;
