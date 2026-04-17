// ============================================================
// orders.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

async function placeOrder(shippingAddress, paymentMethod = 'cod') {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const cartItems = await fetchCart();
  if (!cartItems.length) throw new Error('Cart is empty');

  // Re-validate stock before placing order
  for (const item of cartItems) {
    const hasStock = await validateStock(item.product_id, item.quantity);
    if (!hasStock) {
      throw new Error(`Not enough stock for ${item.products.name}`);
    }
  }

  const totalAmount = cartItems.reduce((sum, item) =>
    sum + (item.quantity * item.products.price), 0);

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: session.user.id,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      payment_method: paymentMethod
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    farmer_id: item.products.farmer_id,
    quantity: item.quantity,
    unit_price: item.products.price
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) {
    // Rollback: delete the order if items insert fails
    await supabase.from('orders').delete().eq('id', order.id);
    throw itemsError;
  }

  // Decrement stock
  for (const item of cartItems) {
    await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_qty: item.quantity
    });
  }

  // Clear cart
  await clearCart(session.user.id);

  return order;
}

async function fetchBuyerOrders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        id,
        quantity,
        unit_price,
        products(name, image_url, unit)
      )
    `)
    .eq('buyer_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchFarmerOrders(farmerId) {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      orders(id, status, shipping_address, created_at),
      products(name, image_url, unit)
    `)
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false, foreignTable: 'orders' });

  if (error) throw error;
  return data || [];
}

async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  if (error) throw error;
}

function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'placed': return 'status-processing';
    case 'confirmed': return 'status-processing';
    case 'shipped': return 'status-shipped';
    case 'delivered': return 'status-delivered';
    case 'cancelled': return 'status-cancelled';
    default: return 'status-processing';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('orders-list-container');
  const emptyState = document.getElementById('no-orders');

  if (!container) return;

  try {
    Utils.showLoader?.();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Please log in to view your orders', 'info');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }

    let userOrders = [];
    if (currentUser.profile.role === 'buyer') {
      userOrders = await fetchBuyerOrders();
    } else {
      userOrders = await fetchFarmerOrders(currentUser.user.id);
    }

    if (userOrders.length === 0) {
      container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    container.innerHTML = '';

    for (const order of userOrders) {
      const isBuyer = currentUser.profile.role === 'buyer';
      const orderData = isBuyer ? order : order.orders;
      const orderItems = isBuyer ? order.order_items : [order];
      const d = new Date(orderData.created_at);

      let itemsHtml = '';
      const itemsToRender = isBuyer ? orderItems : [order];

      for (const item of itemsToRender) {
        const product = isBuyer ? item.products : order.products;
        if (!product) continue;

        itemsHtml += `
          <div class="order-item">
            <img src="${product.image_url || 'https://via.placeholder.com/60'}" alt="${product.name}">
            <div class="oi-details">
              <span class="oi-title">${product.name}</span>
              <span class="oi-meta">Qty: ${item.quantity} | ${Utils.formatCurrency(item.unit_price || item.price)} each</span>
            </div>
          </div>
        `;
      }

      const statusClass = getStatusClass(orderData.status);

      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <div class="order-header">
          <div>
            <span class="order-id">Order #${orderData.id.slice(0, 8)}</span>
            <span class="order-date">Placed on ${d.toLocaleDateString()}</span>
          </div>
          <div style="text-align: right;">
            <span class="order-status ${statusClass}">${orderData.status}</span>
            <div class="order-total">Total: <strong>${Utils.formatCurrency(isBuyer ? order.total_amount : order.subtotal)}</strong></div>
          </div>
        </div>
        <div class="order-body">
          ${itemsHtml || '<p>No items found</p>'}
        </div>
        <div class="order-footer">
          <span>Shipping to: ${orderData.shipping_address}</span>
          ${isBuyer ? `<button class="btn btn-outline" onclick="Utils.showToast('Re-order functionality coming soon!')">Order Again</button>` : ''}
        </div>
      `;
      container.appendChild(card);
    }
  } catch (err) {
    Utils.showToast('Failed to load orders', 'error');
    console.error(err);
  } finally {
    Utils.hideLoader?.();
  }
});
