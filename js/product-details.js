// ============================================================
// product-details.js — Farmer Marketplace
// Supabase backend integration for product detail page
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

    // Fetch product from Supabase
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*, user_profiles(full_name, address)')
            .eq('id', productId)
            .eq('is_active', true)
            .single();

        if (error || !product) {
            if (container) container.style.display = 'none';
            if (errorMsg) errorMsg.style.display = 'block';
            if (loader) loader.style.display = 'none';
            console.error('Product not found:', error);
            return;
        }

        // Populate UI
        document.title = `Farmer Marketplace - ${product.name}`;
        document.getElementById('pd-img').src = product.image_url || 'https://via.placeholder.com/600x400?text=No+Image';
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
                try {
                    await addToCart(product.id, qty);
                    Utils.showToast(`<b>${product.name}</b> added to cart!`, 'success');
                } catch (err) {
                    Utils.showToast('Please login to add items to cart', 'error');
                    setTimeout(() => window.location.href = '/login.html', 1500);
                }
            });
        }

    } catch (err) {
        console.error('Error loading product:', err);
        if (container) container.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'block';
        if (loader) loader.style.display = 'none';
    }
});
