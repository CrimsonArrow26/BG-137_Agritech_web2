// Sample Data directly integrated to keep it simple and robust
const dummyProducts = [
    { id: 1, name: "Organic Tomatoes", category: "Vegetables", price: 2.50, location: "California", image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80", rating: 4.5 },
    { id: 2, name: "Fresh Apples", category: "Fruits", price: 1.80, location: "Washington", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6caa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80", rating: 4.8 },
    { id: 3, name: "Whole Wheat Grains", category: "Grains", price: 0.90, location: "Kansas", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80", rating: 4.2 },
    { id: 4, name: "Raw Cow Milk", category: "Dairy", price: 3.00, location: "Wisconsin", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80", rating: 4.9 },
    { id: 5, name: "Carrots", category: "Vegetables", price: 1.20, location: "Oregon", image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80", rating: 4.3 },
    { id: 6, name: "Fresh Strawberries", category: "Fruits", price: 4.50, location: "Florida", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80", rating: 4.7 }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. SPA Routing
    const links = document.querySelectorAll('.nav-link, .nav-logo, .dropdown-menu a, .hero-buttons button');
    const sections = document.querySelectorAll('.page-section');

    function navigateTo(targetId) {
        // Hide all sections
        sections.forEach(sec => sec.classList.remove('active'));
        // Show target
        const targetSec = document.getElementById(targetId);
        if(targetSec) targetSec.classList.add('active');

        // Update nav active states
        document.querySelectorAll('.nav-link').forEach(link => {
            if(link.getAttribute('data-target') === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Close mobile menu if open
        const navMenu = document.getElementById('nav-menu');
        if(navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }

        // Render products if heading to marketplace
        if(targetId === 'marketplace-section') {
            renderProducts(dummyProducts);
        }
    }

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('data-target');
            if(target) {
                e.preventDefault();
                navigateTo(target);
            }
        });
    });

    // Mobile Menu Toggle
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('nav-menu').classList.toggle('active');
    });

    // Dropdown Toggle
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdown = document.querySelector('.dropdown');
    dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    document.addEventListener('click', () => {
        dropdown.classList.remove('active');
    });

    // 2. Dark Mode Toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const htmlElement = document.documentElement;

    // Check local storage for theme preference
    if (localStorage.getItem('theme') === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggleBtn.addEventListener('click', () => {
        if (htmlElement.getAttribute('data-theme') === 'light') {
            htmlElement.setAttribute('data-theme', 'dark');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        } else {
            htmlElement.setAttribute('data-theme', 'light');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        }
    });

    // 3. Auth System Toggle
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });

    tabSignup.addEventListener('click', () => {
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    // Auth Validation Mock
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Login successful! Redirecting to dashboard...');
        navigateTo('dashboard-section');
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = document.getElementById('signupPass').value;
        const errorMsg = document.getElementById('signupError');
        if(pass.length < 6) {
            errorMsg.textContent = "Password must be at least 6 characters.";
            errorMsg.style.display = "block";
        } else {
            errorMsg.style.display = "none";
            alert('Registration successful! Welcome to AgriMarket.');
            navigateTo('dashboard-section');
        }
    });

    // 4. Modals and Overlays
    const overlay = document.getElementById('overlay');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notifToggleBtn = document.getElementById('notifToggleBtn');
    const closeNotifBtn = document.getElementById('closeNotifBtn');
    
    const addProductModal = document.getElementById('addProductModal');
    const openAddProductModalBtn = document.getElementById('openAddProductModalBtn');
    const closeAddProductModal = document.getElementById('closeAddProductModal');

    function openModal(modal) {
        modal.classList.add('active');
        overlay.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }

    openAddProductModalBtn.addEventListener('click', () => openModal(addProductModal));
    closeAddProductModal.addEventListener('click', () => closeModal(addProductModal));

    notifToggleBtn.addEventListener('click', () => {
        notificationsPanel.classList.add('active');
        overlay.classList.add('active');
    });
    closeNotifBtn.addEventListener('click', () => {
        notificationsPanel.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', () => {
        closeModal(addProductModal);
        notificationsPanel.classList.remove('active');
    });

    // Add Product Form Submit
    document.getElementById('addProductForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Product added successfully!');
        closeModal(addProductModal);
        e.target.reset();
    });

    // 5. Dashboard Tabs
    const dashTabs = document.querySelectorAll('.dashboard-tab');
    const dashViews = document.querySelectorAll('.dash-view');

    dashTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dashTabs.forEach(t => t.classList.remove('active'));
            dashViews.forEach(v => v.classList.remove('active'));
            
            tab.classList.add('active');
            const target = tab.getAttribute('data-dash');
            document.getElementById(target).classList.add('active');
        });
    });

    // 6. Marketplace Filtering and Rendering
    const productsGrid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');

    window.filterCategory = function(cat) {
        navigateTo('marketplace-section');
        categoryFilter.value = cat;
        filterAndRender();
    };

    function renderProducts(products) {
        productsGrid.innerHTML = '';
        if(products.length === 0) {
            productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No products found.</p>';
            return;
        }

        products.forEach(p => {
            // Generate stars
            let stars = '';
            for(let i=1; i<=5; i++) {
                if(i <= Math.floor(p.rating)) {
                    stars += '<i class="fas fa-star"></i>';
                } else if(i === Math.ceil(p.rating)) {
                    stars += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    stars += '<i class="far fa-star"></i>';
                }
            }

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${p.image}" alt="${p.name}" class="product-img">
                <div class="product-info">
                    <span class="product-category">${p.category}</span>
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${p.location}</span>
                        <span class="ratings">${stars} (${p.rating})</span>
                    </div>
                    <div class="product-price">$${p.price.toFixed(2)} / unit</div>
                    <button class="btn btn-primary btn-full" onclick="alert('Item added to requests!')">
                        <i class="fas fa-shopping-cart"></i> Request Item
                    </button>
                </div>
            `;
            productsGrid.appendChild(card);
        });
    }

    function filterAndRender() {
        const query = searchInput.value.toLowerCase();
        const cat = categoryFilter.value;
        const priceSort = priceFilter.value;

        let filtered = dummyProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(query) || p.location.toLowerCase().includes(query);
            const matchesCat = cat === 'All' || p.category === cat;
            return matchesSearch && matchesCat;
        });

        if(priceSort === 'low') {
            filtered.sort((a,b) => a.price - b.price);
        } else if(priceSort === 'high') {
            filtered.sort((a,b) => b.price - a.price);
        }

        renderProducts(filtered);
    }

    if(searchInput) searchInput.addEventListener('input', filterAndRender);
    if(categoryFilter) categoryFilter.addEventListener('change', filterAndRender);
    if(priceFilter) priceFilter.addEventListener('change', filterAndRender);

    // Initial render for safety
    renderProducts(dummyProducts);
    
    // 7. Profile Image Upload Mock
    const avatarUpload = document.getElementById('avatarUpload');
    const profileImagePreview = document.getElementById('profileImagePreview');
    
    if(avatarUpload && profileImagePreview) {
        avatarUpload.addEventListener('change', function(e) {
            if(this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImagePreview.src = e.target.result;
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Chat mock
    const sendMsgBtn = document.getElementById('sendMsgBtn');
    const chatInputMessage = document.getElementById('chatInputMessage');
    const chatMessages = document.getElementById('chatMessages');

    if(sendMsgBtn && chatInputMessage && chatMessages) {
        sendMsgBtn.addEventListener('click', () => {
            const msg = chatInputMessage.value.trim();
            if(msg) {
                const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const msgDiv = document.createElement('div');
                msgDiv.className = 'message sent';
                msgDiv.innerHTML = `<p>${msg}</p><span class="time">${time}</span>`;
                chatMessages.appendChild(msgDiv);
                chatInputMessage.value = '';
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });

        chatInputMessage.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') sendMsgBtn.click();
        });
    }
});