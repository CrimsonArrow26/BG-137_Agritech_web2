// ============================================================
// product-details.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const container = document.getElementById('pd-container');
    const errorMsg = document.getElementById('pd-error');
    const loader = document.getElementById('pd-loader');

    if (!productId) {
        if (container) container.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'block';
        if (loader) loader.style.display = 'none';
        return;
    }

    // Fetch product through the products.js module (no raw DB calls inline)
    try {
        const product = await fetchProductById(productId);

        if (!product || !product.is_active) {
            if (container) container.style.display = 'none';
            if (errorMsg) errorMsg.style.display = 'block';
            if (loader) loader.style.display = 'none';
            return;
        }

        // Populate UI
        document.title = `Farmer Marketplace - ${product.name}`;
        document.getElementById('pd-img').src = product.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22600%22 height=%22400%22/%3E%3Ctext fill=%22%23999%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E';
        document.getElementById('pd-bread-cat').textContent = product.category;
        document.getElementById('pd-title').textContent = product.name;
        document.getElementById('pd-farmer').innerHTML = `<i class="fa-solid fa-wheat-awn"></i> ${product.user_profiles?.full_name || 'Unknown Farmer'}`;
        document.getElementById('pd-location').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${product.user_profiles?.address || 'India'}`;
        document.getElementById('pd-price').innerHTML = `${Utils.formatCurrency(product.price)} <span>/ ${product.unit}</span>`;
        document.getElementById('pd-desc').textContent = product.description || 'Fresh farm product';
        
        // Product Details Section
        document.getElementById('pd-category').textContent = product.category;
        document.getElementById('pd-unit').textContent = product.unit;
        document.getElementById('pd-stock').textContent = `${product.stock_qty} ${product.unit}`;
        
        // Availability status
        const availabilityEl = document.getElementById('pd-availability');
        if (product.stock_qty > 10) {
            availabilityEl.innerHTML = '<span style="color: var(--success);"><i class="fa-solid fa-check-circle"></i> In Stock</span>';
        } else if (product.stock_qty > 0) {
            availabilityEl.innerHTML = '<span style="color: orange;"><i class="fa-solid fa-exclamation-circle"></i> Low Stock - Only ' + product.stock_qty + ' left</span>';
        } else {
            availabilityEl.innerHTML = '<span style="color: var(--danger);"><i class="fa-solid fa-times-circle"></i> Out of Stock</span>';
        }
        
        document.getElementById('pd-date').textContent = new Date(product.created_at).toLocaleDateString('en-IN', { 
            year: 'numeric', month: 'short', day: 'numeric' 
        });
        document.getElementById('pd-sku').textContent = product.id.slice(0, 8).toUpperCase();
        
        // Farmer Info Section
        document.getElementById('pd-farmer-name').textContent = product.user_profiles?.full_name || 'Unknown Farmer';
        document.getElementById('pd-farmer-phone').querySelector('span').textContent = product.user_profiles?.phone || 'Not available';
        document.getElementById('pd-farmer-address').querySelector('span').textContent = product.user_profiles?.address || 'India';

        // Hide loader, show container
        if (loader) loader.style.display = 'none';
        if (container) container.style.display = 'grid';

        // Qty Logic
        const qtyInput = document.getElementById('pd-qty-input');
        const btnMinus = document.getElementById('pd-qty-minus');
        const btnPlus = document.getElementById('pd-qty-plus');

        if (btnMinus) {
            btnMinus.addEventListener('click', () => {
                let v = parseInt(qtyInput.value) || 1;
                if (v > 1) qtyInput.value = v - 1;
            });
        }

        if (btnPlus) {
            btnPlus.addEventListener('click', () => {
                let v = parseInt(qtyInput.value) || 1;
                if (v < product.stock_qty && v < 99) qtyInput.value = v + 1;
            });
        }

        // Add to cart
        const addBtn = document.getElementById('pd-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                const qty = parseInt(qtyInput.value) || 1;

                if (qty > product.stock_qty) {
                    Utils.showToast('Not enough stock available', 'error');
                    return;
                }

                addBtn.disabled = true;
                try {
                    await addToCart(product.id, qty);
                    Utils.showToast('Added to cart!', 'success');
                    if (window.updateNavCartCount) await window.updateNavCartCount();
                } catch (err) {
                    const msg = err.message && err.message.includes('log in')
                        ? 'Please log in to add items to cart.'
                        : 'Failed to add to cart. Please try again.';
                    Utils.showToast(msg, 'error');
                    if (err.message && err.message.includes('log in')) {
                        setTimeout(() => window.location.href = 'login.html', 1500);
                        return;
                    }
                } finally {
                    addBtn.disabled = false;
                }
            });
        }

    } catch (err) {
        Utils.showToast('Failed to load product details.', 'error');
        if (container) container.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'block';
        if (loader) loader.style.display = 'none';
    }
});
