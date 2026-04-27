async function loadFeed() {
  var wrap = el('feed-wrap');
  wrap.innerHTML = '<div style="padding:20px;color:var(--text2)">Зареждане...</div>';
  var { data, error } = await _supabase.from('videos').select('*, profiles(*)').order('created_at', { ascending: false });
  if (error) { wrap.innerHTML = 'Грешка'; return; }
  STATE.videos = data;
  renderFeed();
}

function renderFeed() {
  var wrap = el('feed-wrap');
  wrap.innerHTML = '';
  STATE.videos.forEach(v => {
    wrap.innerHTML += createVideoCard(v);
  });
  if (window.lucide) lucide.createIcons();
}
