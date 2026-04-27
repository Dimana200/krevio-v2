async function loadSearch() {
    const { data: profiles } = await _supabase
        .from('profiles')
        .select('*')
        .limit(10);

    const container = document.getElementById('search-results');
    container.innerHTML = profiles.map(p => `
        <div class="user-card">
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${p.avatar_url}" class="user-avatar">
                <span>${p.username}</span>
            </div>
            <button class="follow-btn">Последвай</button>
        </div>
    `).join('');
}
