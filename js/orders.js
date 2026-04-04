document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Auth Check
    const session = Utils.getStorage('fc_session');
    if (!session || !session.isLoggedIn) {
        Utils.showToast('Please log in to view your orders', 'info');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    // 2. Load Orders Data
    const allOrders = Utils.getStorage('fc_orders', []);
    
    // Filter orders for the logged-in user
    // If buyer: show orders placed by buyer
    // If farmer: show orders containing products from this farmer (simplified: we just show all for demo, or filter by user email if buyer)
    let userOrders = [];
    if(session.user.role === 'buyer') {
        userOrders = allOrders.filter(o => o.userId === session.user.email);
    } else {
        // Mock: farmers see all orders for now
        userOrders = allOrders; 
    }

    const container = document.getElementById('orders-list-container');
    const emptyState = document.getElementById('no-orders');

    if (userOrders.length === 0) {
        if(container) container.style.display = 'none';
        if(emptyState) emptyState.style.display = 'block';
        return;
    }

    // Sort by Date descending
    userOrders.sort((a,b) => new Date(b.date) - new Date(a.date));

    // Render Orders
    container.innerHTML = '';
    userOrders.forEach(order => {
        const d = new Date(order.date);
        
        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
                <div class="order-item">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="oi-details">
                        <span class="oi-title">${item.title}</span>
                        <span class="oi-meta">Qty: ${item.quantity} | ${Utils.formatCurrency(item.price)} each</span>
                    </div>
                </div>
            `;
        });

        const statusClass = getStatusClass(order.status);

        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-header">
                <div>
                    <span class="order-id">Order #${order.id}</span>
                    <span class="order-date">Placed on ${d.toLocaleDateString()}</span>
                </div>
                <div style="text-align: right;">
                    <span class="order-status ${statusClass}">${order.status}</span>
                    <div class="order-total">Total: <strong>${Utils.formatCurrency(order.total)}</strong></div>
                </div>
            </div>
            <div class="order-body">
                ${itemsHtml}
            </div>
            <div class="order-footer">
                <span>Shipping to: ${order.shippingAddr}</span>
                <button class="btn btn-outline" onclick="Utils.showToast('Re-order functionality coming soon!')">Order Again</button>
            </div>
        `;
        container.appendChild(card);
    });
});

function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'processing': return 'status-processing';
        case 'shipped': return 'status-shipped';
        case 'delivered': return 'status-delivered';
        default: return 'status-processing';
    }
}
