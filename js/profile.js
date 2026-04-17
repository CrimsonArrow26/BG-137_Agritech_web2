// ============================================================
// profile.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

async function updateProfile(updates) {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', session.user.id);
  if (error) throw error;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    Utils.showLoader?.();

    // Auth check
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Please log in to view profile', 'info');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }

    const { user, profile } = currentUser;

    // Populate Sidebar
    document.getElementById('prof-sidebar-name').textContent = profile.full_name;
    document.getElementById('prof-sidebar-role').textContent = profile.role;
    document.getElementById('prof-img').src = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=1B4332&color=fff&size=128`;

    // Populate Form
    document.getElementById('profName').value = profile.full_name;
    document.getElementById('profEmail').value = user.email;
    document.getElementById('profRole').value = profile.role;
    document.getElementById('profPhone').value = profile.phone || '';
    document.getElementById('profAddress').value = profile.address || '';
    document.getElementById('profPincode').value = profile.pincode || '';

    // Add input validation
    const phoneInput = document.getElementById('profPhone');
    const pincodeInput = document.getElementById('profPincode');

    phoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });

    pincodeInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });

    // Handle Form Submit
    const form = document.getElementById('profileForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        }

        try {
          const newName = document.getElementById('profName').value.trim();
          const phone = document.getElementById('profPhone').value.trim();
          const address = document.getElementById('profAddress').value.trim();
          const pincode = document.getElementById('profPincode').value.trim();

          // Validate phone (10 digits)
          if (phone && phone.length !== 10) {
            Utils.showToast('Phone number must be exactly 10 digits', 'error');
            return;
          }

          // Validate pincode (6 digits)
          if (pincode && pincode.length !== 6) {
            Utils.showToast('Pincode must be exactly 6 digits', 'error');
            return;
          }

          await updateProfile({
            full_name: newName,
            phone: phone || null,
            address: address || null,
            pincode: pincode || null
          });

          Utils.showToast('Profile updated successfully!', 'success');
          Utils.logAction('Updated Profile', { name: newName });

          // Reflect on UI immediately
          document.getElementById('prof-sidebar-name').textContent = newName;
          document.getElementById('prof-img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=1B4332&color=fff&size=128`;

          if (document.getElementById('navUserName')) {
            document.getElementById('navUserName').textContent = newName.split(' ')[0];
            document.getElementById('navUserImg').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=1B4332&color=fff`;
          }
        } catch (err) {
          Utils.showToast('Failed to update profile', 'error');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Save Changes';
          }
        }
      });
    }
  } catch (err) {
    Utils.showToast('Failed to load profile', 'error');
    console.error(err);
  } finally {
    Utils.hideLoader?.();
  }
});
