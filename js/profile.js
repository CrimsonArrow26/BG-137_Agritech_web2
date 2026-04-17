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
          await updateProfile({ full_name: newName });

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
