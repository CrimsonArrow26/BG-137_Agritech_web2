// ============================================================
// main.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  Utils.logAction('App Initialized');
  initDarkMode();

  // Initialize Supabase Auth State Listener
  // Use window.supabase which is set by supabase.js after creating the client
  const supabaseClient = window.supabase || window.supabaseClient;
  if (supabaseClient && supabaseClient.auth) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = 'login.html';
      }
    });
  }

  // Inject Components
  const hasNav = document.getElementById('navbar-container');
  const hasFoot = document.getElementById('footer-container');

  const promises = [];
  if (hasNav) promises.push(Utils.injectComponent('components/navbar.html', 'navbar-container'));
  if (hasFoot) promises.push(Utils.injectComponent('components/footer.html', 'footer-container'));

  await Promise.all(promises);
  Utils.logAction('Components Injected');

  if (hasNav) await bindNavbarEvents();

  Utils.hideLoader();
});

function initDarkMode() {
  const isDark = Utils.getStorage('theme') === 'dark';
  if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
}

async function bindNavbarEvents() {
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
                Utils.setStorage('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                Utils.setStorage('theme', 'dark');
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
  const authActions = document.getElementById('auth-actions');
  const unauthActions = document.getElementById('unauth-actions');

  const currentUser = await getCurrentUser();
  if (currentUser) {
    if (unauthActions) unauthActions.style.display = 'none';
    if (authActions) {
      authActions.style.display = 'flex';
      const navUserName = document.getElementById('navUserName');
      const navUserImg = document.getElementById('navUserImg');
      if (navUserName) navUserName.textContent = currentUser.profile.full_name.split(' ')[0];
      if (navUserImg) navUserImg.src = currentUser.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.profile.full_name)}&background=1B4332&color=fff`;

      // Show role-specific dropdown menu
      const buyerMenu = document.getElementById('buyer-menu');
      const farmerMenu = document.getElementById('farmer-menu');
      if (currentUser.profile.role === 'farmer') {
        if (farmerMenu) farmerMenu.style.display = 'block';
        if (buyerMenu) buyerMenu.style.display = 'none';
      } else {
        if (buyerMenu) buyerMenu.style.display = 'block';
        if (farmerMenu) farmerMenu.style.display = 'none';
      }
    }
  } else {
    if (authActions) authActions.style.display = 'none';
    if (unauthActions) unauthActions.style.display = 'flex';
  }

  // Setup Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
    });
  }

  // Cart Badge Update - only if cart.js is loaded
  window.updateNavCartCount = async function() {
    // Check if getCartCount is available (from cart.js)
    if (typeof getCartCount !== 'function') {
      // cart.js not loaded on this page, skip cart badge update
      return;
    }
    try {
      const count = await getCartCount();
      const ct = document.getElementById('navCartCount');
      if (ct) {
        ct.textContent = count;
        ct.style.display = count > 0 ? 'flex' : 'none';
      }
    } catch (err) {
      // Silently fail if cart can't be loaded (user not logged in or other error)
      console.log('Cart count unavailable:', err.message);
    }
  };
  await window.updateNavCartCount();
}

