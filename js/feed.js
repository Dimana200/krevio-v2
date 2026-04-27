async function loadFeed() {
    const { data: videos, error } = await _supabase
        .from('videos')
        .select(`
            *,
            profiles (
                username,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    const container = document.getElementById('video-feed');
    container.innerHTML = '';
    videos.forEach(video => {
        container.innerHTML += createVideoCard(video);
    });
}
