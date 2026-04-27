async function showComments(videoId) {
  STATE.currentCmtVid = videoId;
  showModal('m-comments');
  var list = el('cmt-list');
  list.innerHTML = 'Зареждане...';
  var { data } = await _supabase.from('comments').select('*, profiles(full_name)').eq('video_id', videoId);
  if (data) {
    list.innerHTML = data.map(c => `
      <div class="cmt-item">
        <b>${c.profiles.full_name}:</b> ${c.content}
      </div>
    `).join('');
  }
}
