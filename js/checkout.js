document.addEventListener('DOMContentLoaded', async () => {
    // 1. Session Auth Check - Use Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!session) {
        Utils.showToast('Please log in to checkout!', 'info');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, phone, address')
        .eq('id', session.user.id)
        .single();

    // Pre-fill user data
    const nameInput = document.getElementById('chkName');
    if (nameInput && profile) nameInput.value = profile.full_name || '';

    // 2. Load Cart Data
    const cart = Utils.getStorage('fc_cart', []);
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    renderOrderSummary(cart);

    // 3. Simple Form Formatting logic
    const cardNum = document.getElementById('chkCardNum');
    if(cardNum) {
        cardNum.addEventListener('input', function (e) {
            let v = this.value.replace(/\D/g, '');
            this.value = v.replace(/(.{4})/g, '$1 ').trim();
        });
    }

    const expDate = document.getElementById('chkExp');
    if(expDate) {
        expDate.addEventListener('input', function(e) {
            let v = this.value.replace(/\D/g, '');
            if(v.length > 2) {
                this.value = v.slice(0,2) + '/' + v.slice(2,4);
            } else {
                this.value = v;
            }
        });
    }

    // 4. Handle Submission
    const checkoutForm = document.getElementById('checkoutForm');
    if(checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Generate mock order
            const orderTotal = calculateTotal(cart);
            const orderId = 'ORD-' + Math.floor(Math.random() * 1000000);
            const newOrder = {
                id: orderId,
                userId: session.user.id,
                date: new Date().toISOString(),
                items: cart,
                total: orderTotal.grandTotal,
                status: 'Processing',
                shippingAddr: document.getElementById('chkAddress').value
            };

            // Store Order
            const allOrders = Utils.getStorage('fc_orders', []);
            allOrders.push(newOrder);
            Utils.setStorage('fc_orders', allOrders);

            // Clear Cart
            Utils.setStorage('fc_cart', []);
            
            Utils.logAction('Order Placed', { orderId: orderId, total: orderTotal.grandTotal });
            
            // Redirect
            Utils.showToast('Order placed successfully!');
            
            const btn = document.getElementById('placeOrderBtn');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;

            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 1500);
        });
    }
});

function calculateTotal(cart) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + shipping + tax;
    return { subtotal, shipping, tax, grandTotal };
}

function renderOrderSummary(cart) {
    const list = document.getElementById('checkoutItemsList');
    if (!list) return;

    list.innerHTML = '';
    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'chk-item';
        row.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="chk-item-img">
            <div class="chk-item-details">
                <div class="chk-item-title">${item.title}</div>
                <div class="chk-item-meta">Qty: ${item.quantity} x ${Utils.formatCurrency(item.price)}</div>
            </div>
            <div style="font-weight:500; color:var(--text-main);">
                ${Utils.formatCurrency(item.price * item.quantity)}
            </div>
        `;
        list.appendChild(row);
    });

    const totals = calculateTotal(cart);
    document.getElementById('chkSubtotal').textContent = Utils.formatCurrency(totals.subtotal);
    document.getElementById('chkShipping').textContent = totals.shipping === 0 ? 'Free' : Utils.formatCurrency(totals.shipping);
    document.getElementById('chkTax').textContent = Utils.formatCurrency(totals.tax);
    document.getElementById('chkGrandTotal').textContent = Utils.formatCurrency(totals.grandTotal);
}
