async function loadProfile() {
    const { data: profile } = await _supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    document.getElementById('profile-info').innerHTML = `
        <img src="${profile.avatar_url || 'https://via.placeholder.com/100'}" class="profile-avatar">
        <h2>${profile.username}</h2>
    `;
    loadUserVideos();
}

async function loadUserVideos() {
    const { data: videos } = await _supabase.from('videos').select('*').eq('user_id', currentUser.id);
    const container = document.getElementById('user-videos');
    container.innerHTML = videos.map(v => `<video src="${v.url}" class="video-item"></video>`).join('');
}
