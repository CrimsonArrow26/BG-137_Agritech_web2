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
        document.getElementById('pd-stock').textContent = `In Stock: ${product.stock_qty} ${product.unit}`;

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
