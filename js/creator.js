async function loadCreatorDashboard() {
  if (!STATE.user) return;
  
  // Вземаме статистиката
  const { data: videos, error } = await _supabase
    .from('videos')
    .select('*')
    .eq('user_id', STATE.user.id);

  if (videos) {
    el('cp-val-videos').innerText = videos.length;
    var totalLikes = videos.reduce((acc, v) => acc + (v.likes_count || 0), 0);
    el('cp-val-likes').innerText = totalLikes;
    
    // Намираме най-доброто видео (с най-много харесвания)
    if (videos.length > 0) {
      var best = videos.reduce((prev, current) => (prev.likes_count > current.likes_count) ? prev : current);
      el('cp-best-video').innerHTML = `
        <div style="display:flex;gap:10px;margin-top:10px;background:var(--surface);padding:10px;border-radius:8px">
          <video src="${best.url}" style="width:60px;height:80px;object-fit:cover;border-radius:4px"></video>
          <div>
            <div style="font-weight:700;font-size:.8rem">${best.title || 'Без заглавие'}</div>
            <div style="font-size:.7rem;color:var(--gold)">❤️ ${best.likes_count || 0} харесвания</div>
          </div>
        </div>
      `;
    }
  }

  // Зареждаме списъка с видеа в таб "Съдържание"
  var list = el('cp-videos-list');
  if (list && videos) {
    list.innerHTML = videos.map(v => `
      <div style="display:flex;align-items:center;padding:12px;border-bottom:1px solid var(--border);gap:12px">
        <video src="${v.url}" style="width:50px;height:50px;object-fit:cover;border-radius:4px"></video>
        <div style="flex:1">
          <div style="font-size:.8rem;font-weight:600">${v.title || 'Видео'}</div>
          <div style="font-size:.7rem;color:var(--text3)">${new Date(v.created_at).toLocaleDateString()}</div>
        </div>
        <button onclick="deleteVideo('${v.id}')" style="background:none;border:none;color:#ff4444;padding:8px"><i data-lucide="trash-2" style="width:18px"></i></button>
      </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
  }
}

async function deleteVideo(id) {
  if (!confirm('Сигурни ли сте, че искате да изтриете това видео?')) return;
  const { error } = await _supabase.from('videos').delete().eq('id', id);
  if (error) showToast('Грешка при изтриване');
  else { showToast('Изтрито!'); loadCreatorDashboard(); }
}

// Управление на табовете в Creator панела
document.querySelectorAll('.cptab').forEach(btn => {
  btn.onclick = function() {
    document.querySelectorAll('.cptab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.cp-section').forEach(s => s.classList.remove('active'));
    this.classList.add('active');
    el(this.dataset.tab).classList.add('active');
  };
});
