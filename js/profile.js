document.addEventListener('DOMContentLoaded', () => {
    // Session Auth Check
    const session = Utils.getStorage('fc_session');
    if (!session || !session.isLoggedIn) {
        Utils.showToast('Please log in to view profile', 'info');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    // Populate Sidebar
    document.getElementById('prof-sidebar-name').textContent = session.user.name;
    document.getElementById('prof-sidebar-role').textContent = session.user.role;
    document.getElementById('prof-img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=1B4332&color=fff&size=128`;

    // Populate Form
    document.getElementById('profName').value = session.user.name;
    document.getElementById('profEmail').value = session.user.email;
    document.getElementById('profRole').value = session.user.role;

    // Handle Form Submit
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = document.getElementById('profName').value;
            
            // Update session locally
            session.user.name = newName;
            Utils.setStorage('fc_session', session);
            
            // Also update any matching user arrays if we had a persistent mock backend
            // For now, updating session is enough to update UI on reload
            
            Utils.showToast('Profile updated successfully!');
            Utils.logAction('Updated Profile', { name: newName });
            
            // Reflect on UI immediately
            document.getElementById('prof-sidebar-name').textContent = newName;
            document.getElementById('prof-img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=1B4332&color=fff&size=128`;
            
            // Re-trigger navbar init if possible, or just let user refresh for top-right name update
            if(window.updateNavCartCount && document.getElementById('navUserName')) {
                document.getElementById('navUserName').textContent = newName.split(' ')[0];
                document.getElementById('navUserImg').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=1B4332&color=fff`;
            }
        });
    }
});
