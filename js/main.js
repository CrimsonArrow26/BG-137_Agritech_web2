/**
 * MAIN.JS
 * Requires utils.js. Handles global injection, dark mode, and UI init.
 */

document.addEventListener('DOMContentLoaded', async () => {
    Utils.logAction('App Initialized');
    initDarkMode();

    // Inject Components
    const hasNav = document.getElementById('navbar-container');
    const hasFoot = document.getElementById('footer-container');
    
    // Use Promise.all for faster parallel loading
    const promises = [];
    if(hasNav) promises.push(Utils.injectComponent('components/navbar.html', 'navbar-container'));
    if(hasFoot) promises.push(Utils.injectComponent('components/footer.html', 'footer-container'));
    
    await Promise.all(promises);
    Utils.logAction('Components Injected');

    if (hasNav) bindNavbarEvents();
    
    // Hide Global Loader
    Utils.hideLoader();
});

function initDarkMode() {
    const isDark = Utils.getStorage('fc_darkmode', false);
    if(isDark) document.documentElement.setAttribute('data-theme', 'dark');
}

function bindNavbarEvents() {
    // Scroll logic
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });
    }

    // Active path logic
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const linkMap = {
        'index.html': 'nav-home',
        'products.html': 'nav-products',
        'about.html': 'nav-about',
        'contact.html': 'nav-contact'
    };
    if (linkMap[path]) {
        const el = document.getElementById(linkMap[path]);
        if(el) el.classList.add('active');
    }

    // Toggle Dark Mode
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            const currentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (currentlyDark) {
                document.documentElement.removeAttribute('data-theme');
                Utils.setStorage('fc_darkmode', false);
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                Utils.setStorage('fc_darkmode', true);
            }
            Utils.logAction('Toggled Dark Mode', { isDark: !currentlyDark });
        });
    }

    // Mobile Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Auth State
    const session = Utils.getStorage('fc_session');
    const authActions = document.getElementById('auth-actions');
    const unauthActions = document.getElementById('unauth-actions');
    
    if (session && session.isLoggedIn) {
        if(unauthActions) unauthActions.style.display = 'none';
        if(authActions) {
            authActions.style.display = 'flex';
            const navUserName = document.getElementById('navUserName');
            const navUserImg = document.getElementById('navUserImg');
            if(navUserName) navUserName.textContent = session.user.name.split(' ')[0];
            if(navUserImg) navUserImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=1B4332&color=fff`;
        }
    } else {
        if(authActions) authActions.style.display = 'none';
        if(unauthActions) unauthActions.style.display = 'flex';
    }

    // Setup Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('fc_session');
            Utils.logAction('User Logged Out');
            window.location.href = 'index.html';
        });
    }

    // Initial Cart State update
    window.updateNavCartCount = function() {
        const cart = Utils.getStorage('fc_cart', []);
        const total = cart.reduce((s, i) => s + i.quantity, 0);
        const ct = document.getElementById('navCartCount');
        if (ct) {
            ct.textContent = total;
            ct.style.display = total > 0 ? 'flex' : 'none';
        }
    };
    if (window.updateNavCartCount) window.updateNavCartCount();
}

