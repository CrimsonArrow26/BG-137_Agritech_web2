/**
 * DASHBOARD.JS
 * Requires utils.js. Handles rendering stats and toggling Farmer/Buyer
 * specific modules securely via localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Auth Validation Check
    const session = Utils.getStorage('fc_session');
    if(!session || !session.isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    const { user } = session;
    const isFarmer = user.role === 'farmer';

    // Populate Sidebar Identity
    const sImg = document.getElementById('dashSidebarImg');
    const sName = document.getElementById('dashSidebarName');
    const sRole = document.getElementById('dashSidebarRole');
    if(sImg) sImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2D6A4F&color=fff`;
    if(sName) sName.textContent = user.name;
    if(sRole) sRole.textContent = user.role;

    // Load Mock Orders
    const allOrders = Utils.getStorage('fc_orders', []);
    const relevantOrders = isFarmer 
        ? allOrders.filter(o => o.farmerEmail === user.email) // Wait, our mock orders don't store farmer email by default, we'll just mock it.
        : allOrders.filter(o => o.userEmail === user.email);
        
    // For visual simulation, if there are no exact matches, give farmer some fake received orders, give buyer their real recent orders
    const viewOrders = isFarmer && relevantOrders.length === 0 
        ? [{ id: 'ORD-8931', date: new Date().toISOString(), total: 45.90, status: 'Pending', items: [1,2] }]
        : relevantOrders;

    // Build Stats
    const stat1Title = document.getElementById('stat1Title');
    const stat1Val = document.getElementById('stat1Val');
    const stat1Icon = document.getElementById('stat1Icon');
    const stat2Title = document.getElementById('stat2Title');
    const stat2Val = document.getElementById('stat2Val');
    const stat2Icon = document.getElementById('stat2Icon');

    if(isFarmer) {
        if(stat1Title) stat1Title.textContent = 'Total Sales';
        if(stat1Val) stat1Val.textContent = Utils.formatCurrency(viewOrders.reduce((acc,o)=>acc+o.total, 0));
        if(stat1Icon) stat1Icon.className = 'fa-solid fa-sack-dollar';
        
        if(stat2Title) stat2Title.textContent = 'Active Products';
        if(stat2Val) stat2Val.textContent = '12'; // Mock
        if(stat2Icon) stat2Icon.className = 'fa-solid fa-wheat-awn';
    } else {
        if(stat1Title) stat1Title.textContent = 'Total Spent';
        if(stat1Val) stat1Val.textContent = Utils.formatCurrency(viewOrders.reduce((acc,o)=>acc+o.total, 0));
        if(stat1Icon) stat1Icon.className = 'fa-solid fa-wallet';
        
        if(stat2Title) stat2Title.textContent = 'Orders Placed';
        if(stat2Val) stat2Val.textContent = viewOrders.length.toString();
        if(stat2Icon) stat2Icon.className = 'fa-solid fa-box-open';
    }

    // Render Recent Orders Table
    const tableBody = document.getElementById('recentOrdersBody');
    if(tableBody) {
        if (viewOrders.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No recent orders found.</td></tr>`;
        } else {
            let html = '';
            viewOrders.slice().reverse().slice(0, 5).forEach(o => {
                html += `
                    <tr>
                        <td><strong>${o.id}</strong></td>
                        <td>${new Date(o.date).toLocaleDateString()}</td>
                        <td>${o.items ? o.items.length : 0} items</td>
                        <td>${Utils.formatCurrency(o.total)}</td>
                        <td><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;
        }
    }

    // Conditional Sections
    const products = Utils.getStorage('fc_products', []);
    
    if (isFarmer) {
        const pSection = document.getElementById('farmerProductsSection');
        if(pSection) pSection.style.display = 'block';
        
        const grid = document.getElementById('farmerProductsGrid');
        if(grid) {
            const myProds = products.slice(0, 3); // mock
            myProds.forEach(p => {
                grid.innerHTML += `
                    <div class="card" style="padding:0; overflow:hidden;">
                        <img src="${p.image}" alt="prod" style="width:100%; height:120px; object-fit:cover;">
                        <div style="padding:1rem;">
                            <h4 style="margin-bottom:0.2rem;">${p.title}</h4>
                            <p class="text-secondary text-sm">${p.stock} in stock</p>
                            <div class="flex justify-between items-center mt-2">
                                <span style="font-weight:700; color:var(--primary-color)">${Utils.formatCurrency(p.price)}</span>
                                <button class="btn btn-outline btn-sm" style="padding:0.25rem 0.75rem;" onclick="Utils.showToast('Edit Mock!')">Edit</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    } else {
        const rSection = document.getElementById('buyerRecommendationsSection');
        if(rSection) rSection.style.display = 'block';
        
        const grid = document.getElementById('buyerRecsGrid');
        if(grid) {
            const recs = products.sort(() => 0.5 - Math.random()).slice(0, 3);
            recs.forEach(p => {
                grid.innerHTML += `
                    <div class="card" style="padding:0; overflow:hidden;">
                        <img src="${p.image}" alt="prod" style="width:100%; height:120px; object-fit:cover;">
                        <div style="padding:1rem;">
                            <h4 style="margin-bottom:0.2rem; font-size:1rem;"><a href="product-details.html?id=${p.id}" style="color:inherit;">${p.title}</a></h4>
                            <p class="text-secondary text-sm"><i class="fa-solid fa-wheat-awn"></i> ${p.farmer}</p>
                            <div class="flex justify-between items-center mt-2 border-t pt-2 border-color">
                                <span style="font-weight:700;">${Utils.formatCurrency(p.price)}</span>
                                <button class="btn btn-primary" style="padding:0.35rem 0.75rem;" onclick="Utils.showToast('${p.title} mocked to cart!')"><i class="fa-solid fa-cart-plus"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    }
});
