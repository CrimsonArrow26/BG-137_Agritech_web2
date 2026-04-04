/**
 * AUTH.JS
 * Requires utils.js. Handles login and registration routing, error display, 
 * and toggling the role selector on the signup page.
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Optional generic redirect if already logged in (but typically user might want to logout, keep simple)
    const session = Utils.getStorage('fc_session');
    
    // 2. Role Selector Logic for Registration
    // The role is now selected via a dropdown (<select id="signupRole">)
    // No JS toggle logic is needed.

    // 3. Signup Submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button[type="submit"]');
            if(btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            }
            
            setTimeout(() => {
                const name = document.getElementById('signupName') ? document.getElementById('signupName').value.trim() : '';
                const email = document.getElementById('signupEmail') ? document.getElementById('signupEmail').value.trim().toLowerCase() : '';
                const password = document.getElementById('signupPassword') ? document.getElementById('signupPassword').value : '';
                const roleSelect = document.getElementById('signupRole');
                const selectedRole = roleSelect ? roleSelect.value : 'buyer';
                
                let users = Utils.getStorage('fc_users', []);
                if (users.find(u => u.email === email)) {
                    showError("Email is already safely registered.");
                    if(btn) {
                        btn.disabled = false;
                        btn.textContent = 'Sign Up';
                    }
                    return;
                }
                
                const newUser = { id: 'u' + Date.now(), name, email, password, role: selectedRole, dateJoined: new Date().toISOString() };
                users.push(newUser);
                Utils.setStorage('fc_users', users);
                
                Utils.logAction('User Registered', { role: selectedRole, email });
                Utils.setStorage('fc_session', { isLoggedIn: true, user: { id: newUser.id, name, email, role: selectedRole } });
                
                window.location.href = 'dashboard.html';
            }, 800); // simulate network delay
        });
    }

    // 4. Login Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            if(btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            }
            
            setTimeout(() => {
                const email = document.getElementById('loginEmail') ? document.getElementById('loginEmail').value.trim().toLowerCase() : '';
                const password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value : '';
                
                let users = Utils.getStorage('fc_users', []);
                const validUser = users.find(u => u.email === email && u.password === password);
                
                if (validUser) {
                    Utils.logAction('User Logged In', { role: validUser.role, email });
                    Utils.setStorage('fc_session', { isLoggedIn: true, user: { id: validUser.id, name: validUser.name, email: validUser.email, role: validUser.role } });
                    window.location.href = 'dashboard.html';
                } else {
                    showError("Invalid email or password.");
                    if(btn){
                        btn.disabled = false;
                        btn.textContent = 'Login';
                    }
                }
            }, 800);
        });
    }

    function showError(msg) {
        const errBox = document.getElementById('errorBox') || document.createElement('div');
        if(errBox.id !== 'errorBox') {
            errBox.id = 'errorBox';
            errBox.style.color = 'var(--danger)';
            errBox.style.marginTop = '15px';
            errBox.style.textAlign = 'center';
            if(document.querySelector('.auth-container')) document.querySelector('.auth-container').appendChild(errBox);
        }
        errBox.textContent = msg;
        errBox.style.display = 'block';
    }
});
