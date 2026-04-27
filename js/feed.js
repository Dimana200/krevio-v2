async function loadFeed() {
    const { data: videos } = await _supabase.from('videos').select('*, profiles(username, avatar_url)').order('created_at', { ascending: false });
    const container = document.getElementById('video-feed');
    container.innerHTML = videos.map(v => createVideoElement(v)).join('');
}
