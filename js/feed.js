async function loadFeed() {
  var wrap = el('feed-wrap');
  if(!wrap) return;
  
  wrap.innerHTML = '<div style="padding:50px;text-align:center;color:var(--text3)">Зареждане на видеа...</div>';
  
  // Вземаме видеата и профилите на авторите им
  const { data, error } = await _supabase
    .from('videos')
    .select('*, profiles(full_name, username, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    wrap.innerHTML = '<div style="padding:50px;text-align:center;color:var(--gold)">Грешка при връзката с базата</div>';
    return;
  }

  if (!data || data.length === 0) {
    wrap.innerHTML = '<div style="padding:50px;text-align:center;color:var(--text3)">Все още няма качени видеа</div>';
    return;
  }

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
