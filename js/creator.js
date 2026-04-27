async function loadCreatorDashboard() {
  if (!STATE.user) return;
  var { data: videos } = await _supabase.from('videos').select('*').eq('user_id', STATE.user.id);
  if (videos) {
    el('cp-val-videos').innerText = videos.length;
    var totalLikes = videos.reduce((acc, v) => acc + (v.likes_count || 0), 0);
    el('cp-val-likes').innerText = totalLikes;
  }
}
