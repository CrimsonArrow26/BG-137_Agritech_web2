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
  window.location.href = '/login.html';
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
    window.location.href = '/login.html';
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(current.profile.role)) {
    window.location.href = '/dashboard.html';
    return null;
  }
  return current;
}

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = signupForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
      }

      const name = document.getElementById('signupName')?.value.trim() || '';
      const email = document.getElementById('signupEmail')?.value.trim().toLowerCase() || '';
      const password = document.getElementById('signupPassword')?.value || '';
      const roleSelect = document.getElementById('signupRole');
      const selectedRole = roleSelect ? roleSelect.value : 'buyer';

      try {
        await signup(email, password, name, selectedRole);
        Utils.logAction('User Registered', { role: selectedRole, email });
        Utils.showToast('Account created successfully!', 'success');

        if (selectedRole === 'farmer') {
          window.location.href = '/dashboard.html';
        } else {
          window.location.href = '/products.html';
        }
        return;
      } catch (err) {
        Utils.showToast(mapAuthError(err), 'error');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Sign Up';
        }
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
