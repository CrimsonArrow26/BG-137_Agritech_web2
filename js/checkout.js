// ============================================================
// checkout.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

const SHIPPING_THRESHOLD = 500;  // Free shipping above ₹500
const SHIPPING_COST      = 50;   // ₹50 flat shipping
const TAX_RATE           = 0.05; // 5% GST

function calculateTotal(cartItems) {
  const subtotal   = cartItems.reduce((sum, item) => sum + (item.quantity * item.products.price), 0);
  const shipping   = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax        = subtotal * TAX_RATE;
  const grandTotal = subtotal + shipping + tax;
  return { subtotal, shipping, tax, grandTotal };
}

function renderOrderSummary(cartItems) {
  const list = document.getElementById('checkoutItemsList');
  if (!list) return;

  list.innerHTML = '';
  cartItems.forEach(item => {
    const product   = item.products;
    const lineTotal = item.quantity * product.price;

    const row       = document.createElement('div');
    row.className   = 'chk-item';
    row.innerHTML   = `
      <img src="${product.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2260%22 height=%2260%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2210%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'}"
           alt="${product.name}" class="chk-item-img">
      <div class="chk-item-details">
        <div class="chk-item-title">${product.name}</div>
        <div class="chk-item-meta">Qty: ${item.quantity} × ${Utils.formatCurrency(product.price)}</div>
      </div>
      <div style="font-weight:500; color:var(--text-main);">
        ${Utils.formatCurrency(lineTotal)}
      </div>
    `;
    list.appendChild(row);
  });

  const totals = calculateTotal(cartItems);
  document.getElementById('chkSubtotal').textContent  = Utils.formatCurrency(totals.subtotal);
  document.getElementById('chkShipping').textContent  =
    totals.shipping === 0 ? 'Free' : Utils.formatCurrency(totals.shipping);
  document.getElementById('chkTax').textContent       = Utils.formatCurrency(totals.tax);
  document.getElementById('chkGrandTotal').textContent = Utils.formatCurrency(totals.grandTotal);
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Session check — must be first await
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (!session) {
    Utils.showToast('Please log in to checkout!', 'info');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }

  // 2. Pre-fill user info from Supabase (not localStorage)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, phone, address')
    .eq('id', session.user.id)
    .single();

  if (profile) {
    const nameEl  = document.getElementById('chkName');
    const phoneEl = document.getElementById('chkPhone');
    const addrEl  = document.getElementById('chkAddress');
    if (nameEl && profile.full_name)  nameEl.value  = profile.full_name;
    if (phoneEl && profile.phone)     phoneEl.value = profile.phone;
    if (addrEl && profile.address)    addrEl.value  = profile.address;
  }

  // 3. Load cart from Supabase
  let cartItems = [];
  try {
    Utils.showLoader?.();
    cartItems = await fetchCart();
  } catch (err) {
    Utils.showToast('Failed to load cart. Please try again.', 'error');
    Utils.hideLoader?.();
    return;
  } finally {
    Utils.hideLoader?.();
  }

  if (cartItems.length === 0) {
    Utils.showToast('Your cart is empty. Add some items first!', 'info');
    setTimeout(() => window.location.href = 'cart.html', 1500);
    return;
  }

  renderOrderSummary(cartItems);

  // 4. Card number formatting
  const cardNum = document.getElementById('chkCardNum');
  if (cardNum) {
    cardNum.addEventListener('input', function () {
      const v    = this.value.replace(/\D/g, '');
      this.value = v.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  // 5. Expiry date formatting
  const expDate = document.getElementById('chkExp');
  if (expDate) {
    expDate.addEventListener('input', function () {
      const v    = this.value.replace(/\D/g, '');
      this.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2, 4) : v;
    });
  }

  // 6. Form submission — calls placeOrder() from orders.js
  const checkoutForm  = document.getElementById('checkoutForm');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const address = document.getElementById('chkAddress')?.value.trim() || '';
      const city    = document.getElementById('chkCity')?.value.trim()    || '';
      const zip     = document.getElementById('chkZip')?.value.trim()     || '';

      if (!address || !city || !zip) {
        Utils.showToast('Please fill in all shipping fields.', 'error');
        return;
      }

      const shippingAddress = `${address}, ${city} - ${zip}`;

      if (placeOrderBtn) {
        placeOrderBtn.disabled    = true;
        placeOrderBtn.innerHTML   = '<i class="fa-solid fa-spinner fa-spin"></i> Placing Order...';
      }

      Utils.showLoader?.();
      try {
        const order = await placeOrder(shippingAddress, 'cod');

        Utils.logAction('Order Placed', { orderId: order.id });
        Utils.showToast('Order placed successfully!', 'success');

        // Only redirect after ALL steps succeeded
        setTimeout(() => window.location.href = 'orders.html', 1500);
        return;
      } catch (err) {
        let msg = 'Order failed. Please try again.';
        if (err.message && err.message.includes('Cart is empty')) {
          msg = 'Your cart is empty.';
        } else if (err.message && err.message.includes('Not enough stock')) {
          msg = err.message; // safe — comes from our own code, not Supabase internals
        }
        Utils.showToast(msg, 'error');

        if (placeOrderBtn) {
          placeOrderBtn.disabled  = false;
          placeOrderBtn.innerHTML = 'Place Order <i class="fa-solid fa-arrow-right"></i>';
        }
      } finally {
        Utils.hideLoader?.();
      }
    });
  }
});
