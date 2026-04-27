async function loadComments(videoId) {
    const { data: comments } = await _supabase.from('comments').select('*, profiles(username)').eq('video_id', videoId);
    const container = document.getElementById('comments-container');
    container.innerHTML = comments.map(c => `<div><b>${c.profiles.username}:</b> ${c.content}</div>`).join('');
}
