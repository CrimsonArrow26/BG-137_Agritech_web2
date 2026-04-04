document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    const container = document.getElementById('pd-container');
    const errorMsg = document.getElementById('pd-error');
    
    // Fallback data if products haven't been loaded in storage yet
    const FALLBACK_DATA = [
        { id: 'p1', title: 'Organic Heirloom Tomatoes', category: 'Vegetables', price: 4.99, unit: 'lb', farmer: 'Green Acres Farm', location: 'California', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80', stock: 50, desc: 'Freshly picked, sun-ripened heirloom tomatoes. Completely organic and pesticide free.' },
        { id: 'p2', title: 'Fresh Sweet Corn', category: 'Vegetables', price: 0.75, unit: 'ear', farmer: 'Valley Fields', location: 'California', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80', stock: 200, desc: 'Sweet, crisp, and golden. These corn ears are perfect for grilling.' },
        { id: 'p3', title: 'Honeycrisp Apples', category: 'Fruits', price: 3.50, unit: 'lb', farmer: 'Happy Orchards', location: 'Oregon', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?auto=format&fit=crop&w=800&q=80', stock: 120, desc: 'Crisp, sweet, and juicy Honeycrisp apples picked right from the tree.' },
        { id: 'p4', title: 'Farm Fresh Eggs (Dozen)', category: 'Dairy', price: 5.00, unit: 'dozen', farmer: 'Sunrise Farms', location: 'Texas', image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=800&q=80', stock: 30, desc: 'Free-range, pasture-raised chicken eggs with vibrant orange yolks.' }
    ];
    
    const products = Utils.getStorage('fc_products', FALLBACK_DATA);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        if(container) container.style.display = 'none';
        if(errorMsg) errorMsg.style.display = 'block';
        return;
    }
    
    // Populate UI
    document.title = `Farmer Marketplace - ${product.title}`;
    document.getElementById('pd-img').src = product.image;
    document.getElementById('pd-bread-cat').textContent = product.category;
    document.getElementById('pd-title').textContent = product.title;
    document.getElementById('pd-farmer').innerHTML = `<i class="fa-solid fa-wheat-awn"></i> ${product.farmer}`;
    document.getElementById('pd-location').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${product.location}`;
    document.getElementById('pd-price').innerHTML = `${Utils.formatCurrency(product.price)} <span>/ ${product.unit}</span>`;
    document.getElementById('pd-desc').textContent = product.desc;
    
    container.style.display = 'grid';
    
    // Qty Logic
    const qtyInput = document.getElementById('pd-qty-input');
    const btnMinus = document.getElementById('pd-qty-minus');
    const btnPlus = document.getElementById('pd-qty-plus');
    
    btnMinus.addEventListener('click', () => {
        let v = parseInt(qtyInput.value) || 1;
        if(v > 1) qtyInput.value = v - 1;
    });
    
    btnPlus.addEventListener('click', () => {
        let v = parseInt(qtyInput.value) || 1;
        if(v < 99) qtyInput.value = v + 1;
    });
    
    // Add to cart
    document.getElementById('pd-add-btn').addEventListener('click', () => {
        const qty = parseInt(qtyInput.value) || 1;
        addToCartLocal(product, qty);
    });
});

function addToCartLocal(product, qty) {
    let cart = Utils.getStorage('fc_cart', []);
    const exists = cart.findIndex(x => x.id === product.id);
    if(exists > -1) {
        cart[exists].quantity += qty;
    } else {
        cart.push({...product, quantity: qty});
    }
    
    Utils.setStorage('fc_cart', cart);
    Utils.showToast(`<b>${product.title}</b> added to cart!`);
    Utils.logAction('Added to Cart from PDP', { productId: product.id, qty });
    
    if(window.updateNavCartCount) window.updateNavCartCount();
}
