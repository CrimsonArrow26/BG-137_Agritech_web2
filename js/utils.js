/**
 * UTILS.JS
 * Service layer wrapping LocalStorage, fetch injection, and analytics.
 */

const Utils = {
    /** Log Analytics safely */
    logAction: (action, meta = {}) => {
        const d = new Date().toISOString();
        console.log(`[ANALYTICS] ${d} | Action: ${action}`, meta);
    },

    /** Format Currency */
    formatCurrency: (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val),

    /** Storage Wrappers */
    getStorage: (key, def = null) => {
        try {
            const el = localStorage.getItem(key);
            return el ? JSON.parse(el) : def;
        } catch { return def; }
    },
    setStorage: (key, value) => localStorage.setItem(key, JSON.stringify(value)),

    /** Load Components via Fetch */
    injectComponent: async (path, targetId) => {
        try {
            const res = await fetch(path);
            if(!res.ok) throw new Error("Fetch failed");
            const html = await res.text();
            document.getElementById(targetId).innerHTML = html;
        } catch (e) {
            console.error(`Component Injection Failed for ${path}: ${e.message}`);
            // Fallback for CORS file:// error
            document.getElementById(targetId).innerHTML = `<div style="background:var(--danger); color:white; padding: 1rem; text-align:center;">Load Error. Please serve application using HTTP Server (e.g., npx serve)</div>`;
        }
    },

    /** Trigger a toast notification */
    showToast: (message, type = 'success') => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const icon = type === 'success' ? 'fa-check-circle text-success' : 'fa-info-circle text-primary';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    /** Show/Hide global loader */
    hideLoader: () => {
        const loader = document.getElementById('global-loader');
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 300);
        }
    }
};

window.Utils = Utils;
