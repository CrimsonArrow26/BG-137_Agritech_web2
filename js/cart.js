/**
 * CART.JS
 * Requires utils.js. Manages cart rendering, quantity adjustments,
 * removals, and checkout flow mock persistence.
 */

document.addEventListener('DOMContentLoaded', () => {

    const cartGrid = document.getElementById('cart-container');
    const orderItemsGrid = null; // Removed, handle by checkout.js

    // 1. Render function used in cart.html and checkout.html
    const renderCart = () => {
        const cart = Utils.getStorage('fc_cart', []);
        
        let subtotal = 0;
        
        // Handling primary cart page list
        if(cartGrid) {
            cartGrid.innerHTML = '';
            if(cart.length === 0) {
                cartGrid.innerHTML = `
                    <div style="padding: 3rem; text-align: center; color: var(--text-secondary);">
                        <i class="fa-solid fa-basket-shopping mb-2" style="font-size: 3rem; opacity:0.3;"></i>
                        <h3>Your cart is empty</h3>
                        <p class="mb-3">Looks like you haven't added any fresh produce yet.</p>
                        <a href="products.html" class="btn btn-primary">Browse Marketplace</a>
                    </div>
                `;
            } else {
                cart.forEach((item, index) => {
                    const lineTotal = item.price * item.quantity;
                    subtotal += lineTotal;
                    
                    cartGrid.innerHTML += `
                        <div class="card mb-2" style="display:flex; gap:1.5rem; align-items:center; background:var(--background); padding:1rem; border-radius:12px; margin-bottom:1rem;">
                            <img src="${item.image}" alt="${item.title}" style="width:100px; height:100px; object-fit:cover; border-radius:var(--border-radius);">
                            <div style="flex:1;">
                                <h4 style="margin:0;"><a href="product-details.html?id=${item.id}" style="color:inherit; text-decoration:none;">${item.title}</a></h4>
                                <p class="text-secondary text-sm mb-1" style="color:var(--text-muted);"><i class="fa-solid fa-wheat-awn"></i> ${item.farmer}</p>
                                <p style="font-weight:700; color:var(--primary);">${Utils.formatCurrency(item.price)} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:400;">/ ${item.unit}</span></p>
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem; border:1px solid var(--border); border-radius:8px; padding:5px;">
                                <button style="background:none; border:none; cursor:pointer; color:var(--text-main);" onclick="changeQty(${index}, -1)"><i class="fa-solid fa-minus"></i></button>
                                <span style="font-weight:600; width:30px; text-align:center;">${item.quantity}</span>
                                <button style="background:none; border:none; cursor:pointer; color:var(--text-main);" onclick="changeQty(${index}, 1)"><i class="fa-solid fa-plus"></i></button>
                            </div>
                            <div style="font-weight:800; width:80px; text-align:right; color:var(--text-main);">
                                ${Utils.formatCurrency(lineTotal)}
                            </div>
                            <button style="background:none; border:none; cursor:pointer; color:var(--danger); margin-left:1rem; font-size:1.2rem;" onclick="removeItem(${index})" title="Remove">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    `;
                });
                
                // Add totals and checkout button
                cartGrid.innerHTML += `
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:20px; margin-top:20px;">
                        <h3 style="color:var(--text-main); margin:0;">Subtotal: <span style="color:var(--primary);">${Utils.formatCurrency(subtotal)}</span></h3>
                        <a href="checkout.html" class="btn btn-primary" style="padding:15px 30px; border-radius:30px; font-size:1.1rem;">
                            Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                `;
            }
        }

        if(window.updateNavCartCount) window.updateNavCartCount();
    };

    // 2. Window operations attached globally for inline html onclick calling
    window.changeQty = (index, delta) => {
        const cart = Utils.getStorage('fc_cart', []);
        if(!cart[index]) return;
        cart[index].quantity += delta;
        if(cart[index].quantity < 1) cart[index].quantity = 1; // Prevent 0
        Utils.setStorage('fc_cart', cart);
        renderCart();
    };

    window.removeItem = (index) => {
        const cart = Utils.getStorage('fc_cart', []);
        cart.splice(index, 1);
        Utils.setStorage('fc_cart', cart);
        Utils.showToast("Item removed from cart", "info");
        renderCart();
    };

    renderCart();

    // Removed old checkout mock code from cart.js since we now have checkout.js
    
});
