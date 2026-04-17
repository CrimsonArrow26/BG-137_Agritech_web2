// ============================================================
// auth.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

const AUTH_ERRORS = {
  'email_already_exists': 'This email is already registered. Please log in instead.',
  'weak_password': 'Password is too weak. Please use at least 6 characters.',
  'invalid_credentials': 'Invalid email or password. Please try again.',
  'user_not_found': 'No account found with this email.',
  'rate_limit': 'Too many attempts. Please wait 1 minute and try again.',
  'default': 'Something went wrong. Please try again.'
};

// ── Password strength checker ────────────────────────────────
const PASSWORD_RULES = [
  { id: 'len',   label: 'At least 8 characters',          test: p => p.length >= 8          },
  { id: 'upper', label: 'One uppercase letter (A-Z)',      test: p => /[A-Z]/.test(p)        },
  { id: 'lower', label: 'One lowercase letter (a-z)',      test: p => /[a-z]/.test(p)        },
  { id: 'num',   label: 'One number (0-9)',                test: p => /[0-9]/.test(p)        },
  { id: 'spec',  label: 'One special character (!@#$...)', test: p => /[^A-Za-z0-9]/.test(p) },
];

function getPasswordStrength(password) {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (passed <= 1) return { level: 0, label: 'Very Weak',  color: '#e74c3c' };
  if (passed === 2) return { level: 1, label: 'Weak',       color: '#e67e22' };
  if (passed === 3) return { level: 2, label: 'Fair',       color: '#f1c40f' };
  if (passed === 4) return { level: 3, label: 'Strong',     color: '#2ecc71' };
  return                    { level: 4, label: 'Very Strong',color: '#27ae60' };
}

function initPasswordStrength() {
  const input = document.getElementById('signupPassword');
  if (!input) return;

  // Build strength meter UI and inject it after the password input
  const wrapper = document.createElement('div');
  wrapper.id = 'pwd-strength-wrapper';
  wrapper.style.cssText = 'margin-top:10px;';

  wrapper.innerHTML = `
    <div id="pwd-bar-track" style="height:6px;border-radius:99px;background:var(--border);overflow:hidden;margin-bottom:8px;">
      <div id="pwd-bar-fill" style="height:100%;width:0%;border-radius:99px;transition:width 0.3s,background 0.3s;"></div>
    </div>
    <div id="pwd-strength-label" style="font-size:0.8rem;font-weight:600;margin-bottom:8px;color:var(--text-muted);">Enter a password</div>
    <div id="pwd-rules" style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;">
      ${PASSWORD_RULES.map(r => `
        <div id="pwd-rule-${r.id}" style="display:flex;align-items:center;gap:5px;font-size:0.75rem;color:var(--text-muted);transition:color 0.2s;">
          <i class="fa-solid fa-circle-xmark" id="pwd-icon-${r.id}"></i>
          ${r.label}
        </div>
      `).join('')}
    </div>
  `;

  input.parentNode.insertBefore(wrapper, input.nextSibling);

  input.addEventListener('input', function() {
    const val      = this.value;
    const strength = getPasswordStrength(val);

    // Update bar
    const fill  = document.getElementById('pwd-bar-fill');
    const label = document.getElementById('pwd-strength-label');
    if (fill) {
      fill.style.width      = `${(strength.level / 4) * 100}%`;
      fill.style.background = strength.color;
    }
    if (label) {
      label.textContent = val.length ? strength.label : 'Enter a password';
      label.style.color = val.length ? strength.color : 'var(--text-muted)';
    }

    // Update per-rule icons
    PASSWORD_RULES.forEach(r => {
      const row  = document.getElementById(`pwd-rule-${r.id}`);
      const icon = document.getElementById(`pwd-icon-${r.id}`);
      if (!row || !icon) return;
      const ok = r.test(val);
      row.style.color  = ok ? '#27ae60' : 'var(--text-muted)';
      icon.className   = ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
      icon.style.color = ok ? '#27ae60' : 'var(--border)';
    });
  });
}

// ── Email confirmation banner ────────────────────────────────
function showEmailConfirmationUI(email) {
  const form = document.getElementById('signupForm');
  if (!form) return;

  // Replace form with confirmation message
  form.innerHTML = `
    <div style="text-align:center;padding:20px 0;">
      <div style="width:80px;height:80px;background:linear-gradient(135deg,rgba(64,145,108,0.15),rgba(82,183,136,0.1));border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
        <i class="fa-solid fa-envelope-circle-check fa-2x" style="color:var(--primary);"></i>
      </div>
      <h3 style="font-family:'Playfair Display',serif;color:var(--primary);margin-bottom:10px;font-size:1.5rem;">Check your email!</h3>
      <p style="color:var(--text-secondary);line-height:1.7;margin-bottom:8px;">We sent a confirmation link to:</p>
      <p style="font-weight:700;color:var(--text-main);margin-bottom:20px;font-size:1rem;">${email}</p>
      <p style="color:var(--text-muted);font-size:0.9rem;line-height:1.6;margin-bottom:24px;">
        Click the link in the email to activate your account.<br>
        <em>Check your spam folder if you don't see it.</em>
      </p>
      <a href="login.html" class="btn btn-primary" style="display:inline-block;padding:12px 32px;border-radius:30px;text-decoration:none;">
        <i class="fa-solid fa-arrow-right-to-bracket"></i> Go to Login
      </a>
      <div style="margin-top:16px;">
        <button id="resendEmailBtn" style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:0.9rem;text-decoration:underline;">Resend confirmation email</button>
      </div>
    </div>
  `;

  // Resend handler
  const resendBtn = document.getElementById('resendEmailBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      resendBtn.disabled   = true;
      resendBtn.textContent = 'Sending...';
      try {
        await supabase.auth.resend({ type: 'signup', email });
        Utils.showToast('Confirmation email resent! Check your inbox.', 'success');
      } catch {
        Utils.showToast('Could not resend. Please try again later.', 'error');
      } finally {
        resendBtn.disabled   = false;
        resendBtn.textContent = 'Resend confirmation email';
      }
    });
  }
}

function mapAuthError(error) {
  if (!error) return AUTH_ERRORS.default;
  // Handle HTTP 429 status code
  if (error.status === 429 || error.code === 429) return AUTH_ERRORS.rate_limit;
  const code = error.code || error.message || '';
  if (code.includes('rate') || code.includes('429')) return AUTH_ERRORS.rate_limit;
  if (code.includes('email') && code.includes('exists')) return AUTH_ERRORS.email_already_exists;
  if (code.includes('weak_password')) return AUTH_ERRORS.weak_password;
  if (code.includes('invalid') && code.includes('credentials')) return AUTH_ERRORS.invalid_credentials;
  if (code.includes('user') && code.includes('not_found')) return AUTH_ERRORS.user_not_found;
  return error.message || AUTH_ERRORS.default;
}

async function signup(email, password, fullName, role) {
  // Pass full_name and role as user metadata - the database trigger will create the profile
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role
      }
    }
  });
  if (error) throw error;
  return data.user;
}

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/auth-callback.html'
    }
  });

  if (error) throw error;
  return data;
}

async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('full_name, role, phone, address, avatar_url, created_at')
    .eq('id', session.user.id)
    .single();

  if (error) return null;
  return { user: session.user, profile };
}

async function protectRoute(allowedRoles = []) {
  const current = await getCurrentUser();
  if (!current) {
    window.location.href = 'login.html';
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(current.profile.role)) {
    window.location.href = 'dashboard.html';
    return null;
  }
  return current;
}

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    // Inject password strength meter
    initPasswordStrength();

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
      }

      const name         = document.getElementById('signupName')?.value.trim() || '';
      const email        = document.getElementById('signupEmail')?.value.trim().toLowerCase() || '';
      const password     = document.getElementById('signupPassword')?.value || '';
      const roleSelect   = document.getElementById('signupRole');
      const selectedRole = roleSelect ? roleSelect.value : 'buyer';

      // Enforce minimum strength (at least 'Fair' = 3 rules passed)
      if (getPasswordStrength(password).level < 2) {
        Utils.showToast('Please choose a stronger password. Use 8+ characters, uppercase, lowercase, and a number.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Sign Up'; }
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, role: selectedRole } }
        });
        if (error) throw error;

        Utils.logAction('User Registered', { role: selectedRole, email });

        // If Supabase requires email confirmation, data.session will be null
        if (data.user && !data.session) {
          // Show the confirmation banner — do NOT redirect yet
          showEmailConfirmationUI(email);
          return;
        }

        // Email confirmation is disabled in Supabase (dev mode) — redirect immediately
        Utils.showToast('Account created successfully!', 'success');
        if (selectedRole === 'farmer') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'products.html';
        }
        return;

      } catch (err) {
        Utils.showToast(mapAuthError(err), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Sign Up'; }
      }
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
      }

      const email = document.getElementById('loginEmail')?.value.trim().toLowerCase() || '';
      const password = document.getElementById('loginPassword')?.value || '';

      try {
        const user = await login(email, password);
        Utils.logAction('User Logged In', { email });
        Utils.showToast('Welcome back!', 'success');

        const current = await getCurrentUser();
        if (current?.profile?.role === 'farmer') {
          window.location.href = '/dashboard.html';
        } else {
          window.location.href = '/products.html';
        }
        return;
      } catch (err) {
        Utils.showToast(mapAuthError(err), 'error');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Login';
        }
      }
    });
  }

  // Google Sign In button
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      try {
        googleSignInBtn.disabled = true;
        googleSignInBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
        await signInWithGoogle();
        // Page will redirect to Google, then to auth-callback.html
      } catch (err) {
        Utils.showToast(mapAuthError(err), 'error');
        googleSignInBtn.disabled = false;
        googleSignInBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        `;
      }
    });
  }
});
