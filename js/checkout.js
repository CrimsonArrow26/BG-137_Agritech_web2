// ============================================================
// checkout.js — Farmer Marketplace
// Supabase backend integration + Razorpay payment gateway
// ============================================================

const SHIPPING_THRESHOLD = 500;  // Free shipping above ₹500
const SHIPPING_COST      = 50;   // ₹50 flat shipping fee
const TAX_RATE           = 0.05; // 5% GST

// ── Cart total helpers ───────────────────────────────────────

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

    const row     = document.createElement('div');
    row.className = 'chk-item';
    row.innerHTML = `
      <img src="${product.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2260%22 height=%2260%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2210%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'}"
           alt="${product.name}" class="chk-item-img">
      <div class="chk-item-details">
        <div class="chk-item-title">${product.name}</div>
        <div class="chk-item-meta">Qty: ${item.quantity} × ${Utils.formatCurrency(product.price)}</div>
      </div>
      <div style="font-weight:600; color:var(--text-main);">
        ${Utils.formatCurrency(lineTotal)}
      </div>
    `;
    list.appendChild(row);
  });

  const totals = calculateTotal(cartItems);
  document.getElementById('chkSubtotal').textContent   = Utils.formatCurrency(totals.subtotal);
  document.getElementById('chkShipping').textContent   =
    totals.shipping === 0 ? 'Free' : Utils.formatCurrency(totals.shipping);
  document.getElementById('chkTax').textContent        = Utils.formatCurrency(totals.tax);
  document.getElementById('chkGrandTotal').textContent = Utils.formatCurrency(totals.grandTotal);
}

// ── Razorpay helpers ─────────────────────────────────────────

async function createRazorpayOrder(amountInr) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be logged in to make a payment. Please log in again.');
  }
  console.log('Session found, token:', session.access_token?.slice(0, 20) + '...');

  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { amount: amountInr }
  });

  console.log('Edge Function response:', { data, error });

  if (error) {
    console.error('Edge Function error details:', error);
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      throw new Error('Authentication failed. Please log out and log in again.');
    }
    throw new Error('Could not initiate payment. Please try again.');
  }
  if (data?.error) throw new Error(data.error);
  return data; // { order_id, amount (paise), currency, key_id }
}

async function verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Session expired. Please log in again.');
  }

  const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
    body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  });

  if (error) {
    console.error('Verify payment error:', error);
    throw new Error('Payment verification failed. Please contact support.');
  }
  if (!data?.verified) {
    throw new Error('Payment verification failed. Please contact support.');
  }
  return true;
}

async function openRazorpayModal({ rzpOrderData, shippingAddress, profile, cartItems, btn }) {
  console.log('Opening Razorpay modal with data:', { rzpOrderData, profile });

  if (typeof window.Razorpay === 'undefined') {
    console.error('Razorpay SDK not loaded. Check that https://checkout.razorpay.com/v1/checkout.js is loaded.');
    throw new Error('Payment SDK not loaded. Please refresh the page.');
  }

  return new Promise((resolve, reject) => {
    const totals = calculateTotal(cartItems);

    const options = {
      key:         rzpOrderData.key_id,
      amount:      rzpOrderData.amount,       // in paise
      currency:    rzpOrderData.currency,
      name:        'FarmConnect Marketplace',
      description: `Order — ${cartItems.length} item(s)`,
      order_id:    rzpOrderData.order_id,

      // Pre-fill user info
      prefill: {
        name:    profile?.full_name || '',
        email:   '',                            // fetched below if available
        contact: profile?.phone || '',
      },

      // UPI as default — Razorpay will also show Cards, Netbanking etc.
      config: {
        display: {
          blocks: {
            upi:    { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
            other:  { name: 'Other Methods', instruments: [
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'wallet' },
            ]},
          },
          sequence:   ['block.upi', 'block.other'],
          preferences: { show_default_blocks: false },
        },
      },

      theme:  { color: '#2D6A4F' }, // matches --primary-color

      // ── Success handler ──────────────────────────────────
      handler: async function(response) {
        // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        resolve(response);
      },

      // ── Modal closed / payment dismissed ────────────────
      modal: {
        ondismiss: function() {
          // Re-enable button so user can try again
          if (btn) {
            btn.disabled  = false;
            btn.innerHTML = 'Pay Now &nbsp;<i class="fa-solid fa-lock"></i>';
          }
          reject(new Error('Payment cancelled by user.'));
        },
      },
    };

    console.log('Creating Razorpay instance with options:', { key: options.key, amount: options.amount, order_id: options.order_id });
    const rzp = new window.Razorpay(options);
    console.log('Razorpay instance created, calling open()...');

    // Razorpay emits payment failures (e.g. bank declined) through this event
    rzp.on('payment.failed', function(response) {
      if (btn) {
        btn.disabled  = false;
        btn.innerHTML = 'Pay Now &nbsp;<i class="fa-solid fa-lock"></i>';
      }
      reject(new Error(
        response.error?.description || 'Payment failed. Please try a different method.'
      ));
    });

    rzp.open();
  });
}

// ── Page bootstrap ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Session check — must be the very first await
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    Utils.showToast('Please log in to checkout!', 'info');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }

  // 2. Fetch user profile to pre-fill shipping info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, phone, address')
    .eq('id', session.user.id)
    .single();

  if (profile) {
    const nameEl  = document.getElementById('chkName');
    const phoneEl = document.getElementById('chkPhone');
    const addrEl  = document.getElementById('chkAddress');
    if (nameEl  && profile.full_name) nameEl.value  = profile.full_name;
    if (phoneEl && profile.phone)     phoneEl.value = profile.phone;
    if (addrEl  && profile.address)   addrEl.value  = profile.address;
  }

  // 3. Hide the mock card section — Razorpay modal handles payment collection
  //    Also remove 'required' from hidden inputs so the browser doesn't
  //    block form submission on fields it can't focus.
  const paymentSection = document.querySelector('.checkout-section:nth-child(2)');
  if (paymentSection) {
    paymentSection.style.display = 'none';
    paymentSection.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
  }

  // 4. Load cart from Supabase
  let cartItems = [];
  try {
    Utils.showLoader?.();
    cartItems = await fetchCart();
  } catch (err) {
    Utils.showToast('Failed to load cart. Please refresh.', 'error');
    Utils.hideLoader?.();
    return;
  } finally {
    Utils.hideLoader?.();
  }

  if (cartItems.length === 0) {
    Utils.showToast('Your cart is empty!', 'info');
    setTimeout(() => window.location.href = 'cart.html', 1500);
    return;
  }

  renderOrderSummary(cartItems);

  // 5. Update button label to "Pay Now"
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (placeOrderBtn) {
    placeOrderBtn.innerHTML = 'Pay Now &nbsp;<i class="fa-solid fa-lock"></i>';
  }

  // 6. Input formatting and validation
  const cardNum = document.getElementById('chkCardNum');
  if (cardNum) {
    cardNum.addEventListener('input', function () {
      const v    = this.value.replace(/\D/g, '');
      this.value = v.replace(/(.{4})/g, '$1 ').trim();
    });
  }
  const expDate = document.getElementById('chkExp');
  if (expDate) {
    expDate.addEventListener('input', function () {
      const v    = this.value.replace(/\D/g, '');
      this.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2, 4) : v;
    });
  }

  // Phone: only 10 digits
  const phoneEl = document.getElementById('chkPhone');
  if (phoneEl) {
    phoneEl.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 10);
    });
  }

  // Pincode: only 6 digits
  const zipEl = document.getElementById('chkZip');
  if (zipEl) {
    zipEl.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 6);
    });
  }

  // 7. Form submission — Razorpay flow
  const checkoutForm = document.getElementById('checkoutForm');
  if (!checkoutForm) return;

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const address = document.getElementById('chkAddress')?.value.trim() || '';
    const city    = document.getElementById('chkCity')?.value.trim()    || '';
    const zip     = document.getElementById('chkZip')?.value.trim()     || '';
    const phone   = document.getElementById('chkPhone')?.value.trim()   || '';

    if (!address || !city || !zip || !phone) {
      Utils.showToast('Please fill in all shipping fields.', 'error');
      return;
    }

    if (phone.length !== 10) {
      Utils.showToast('Phone number must be exactly 10 digits.', 'error');
      return;
    }

    if (zip.length !== 6) {
      Utils.showToast('Pincode must be exactly 6 digits.', 'error');
      return;
    }

    const shippingAddress = `${address}, ${city} - ${zip}`;
    const totals          = calculateTotal(cartItems);

    if (placeOrderBtn) {
      placeOrderBtn.disabled  = true;
      placeOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initiating Payment...';
    }

    Utils.showLoader?.();

    let rzpOrderData;
    try {
      // Step A: Create Razorpay order server-side
      rzpOrderData = await createRazorpayOrder(totals.grandTotal);
      console.log('Razorpay order created:', rzpOrderData);
      if (!rzpOrderData || !rzpOrderData.key_id || !rzpOrderData.order_id) {
        throw new Error('Invalid response from payment server. Missing key_id or order_id.');
      }
    } catch (err) {
      console.error('Failed to create Razorpay order:', err);
      Utils.showToast(err.message || 'Could not start payment. Try again.', 'error');
      if (placeOrderBtn) {
        placeOrderBtn.disabled  = false;
        placeOrderBtn.innerHTML = 'Pay Now &nbsp;<i class="fa-solid fa-lock"></i>';
      }
      Utils.hideLoader?.();
      return;
    }

    Utils.hideLoader?.(); // hide loader while Razorpay modal is open

    let paymentResponse;
    try {
      // Step B: Open Razorpay modal (UPI-first)
      if (placeOrderBtn) {
        placeOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Awaiting Payment...';
      }

      paymentResponse = await openRazorpayModal({
        rzpOrderData,
        shippingAddress,
        profile,
        cartItems,
        btn: placeOrderBtn,
      });

    } catch (err) {
      // User dismissed or payment failed — already re-enabled button in ondismiss
      if (err.message !== 'Payment cancelled by user.') {
        Utils.showToast(err.message || 'Payment was not completed.', 'error');
      }
      Utils.hideLoader?.();
      return;
    }

    // Step C: Verify signature server-side — then save order to Supabase
    Utils.showLoader?.();
    if (placeOrderBtn) {
      placeOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirming Order...';
    }

    try {
      await verifyRazorpayPayment(
        paymentResponse.razorpay_order_id,
        paymentResponse.razorpay_payment_id,
        paymentResponse.razorpay_signature
      );

      // Step D: Create order in Supabase DB (atomic)
      await placeOrder(shippingAddress, 'razorpay', {
        razorpay_order_id:   paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
      });

      Utils.logAction('Order Placed via Razorpay', {
        razorpay_order_id: paymentResponse.razorpay_order_id,
      });
      Utils.showToast('Payment successful! Your order has been placed.', 'success');

      // Only redirect after ALL steps succeed
      setTimeout(() => window.location.href = 'orders.html', 1500);
      return;

    } catch (err) {
      let msg = 'Order could not be saved after payment. Please contact support.';
      if (err.message && err.message.includes('verification')) msg = err.message;
      if (err.message && err.message.includes('stock'))        msg = err.message;
      Utils.showToast(msg, 'error');

      if (placeOrderBtn) {
        placeOrderBtn.disabled  = false;
        placeOrderBtn.innerHTML = 'Pay Now &nbsp;<i class="fa-solid fa-lock"></i>';
      }
    } finally {
      Utils.hideLoader?.();
    }
  });
});
