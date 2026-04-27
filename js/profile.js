async function loadProfile() {
    const { data: profile, error } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error) return;

    document.getElementById('p-username').innerText = profile.username;
    document.getElementById('p-avatar').src = profile.avatar_url;

    const { data: videos } = await _supabase
        .from('videos')
        .select('*')
        .eq('user_id', currentUser.id);

    const grid = document.getElementById('profile-videos');
    grid.innerHTML = videos.map(v => `
        <div class="profile-video-item" onclick="viewVideo('${v.url}')">
            <video src="${v.url}"></video>
        </div>
    `).join('');
}
