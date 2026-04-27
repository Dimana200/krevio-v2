let currentUser = null;

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    event?.currentTarget?.classList.add('active');

    if (sectionId === 'feed') loadFeed();
    if (sectionId === 'profile') loadProfile();
    if (sectionId === 'notifications') loadNotifications();
    if (sectionId === 'search') loadSearch();
}

document.addEventListener('DOMContentLoaded', () => {
    checkUser();
});
