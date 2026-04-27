async function loadNotifications() {
  if (!STATE.user) return;
  var list = el('inbox-list');
  list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3)">Зареждане...</div>';

  const { data, error } = await _supabase
    .from('notifications')
    .select('*')
    .eq('user_id', STATE.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    list.innerHTML = '<div style="padding:20px;text-align:center">Грешка при зареждане</div>';
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = '<div style="padding:60px;text-align:center;color:var(--text3)"><i data-lucide="bell-off" style="width:40px;height:40px;margin-bottom:10px;opacity:.2"></i><br>Нямате нови известия</div>';
    if (window.lucide) lucide.createIcons();
    return;
  }

  list.innerHTML = data.map(n => `
    <div class="note-item" style="padding:16px;border-bottom:1px solid var(--border);display:flex;gap:12px;background:${n.is_read ? 'transparent' : 'rgba(201,168,76,.05)'}">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--gold);margin-top:6px;opacity:${n.is_read ? 0 : 1}"></div>
      <div style="flex:1">
        <div style="font-size:.85rem;color:var(--text);margin-bottom:4px">${n.content}</div>
        <div style="font-size:.7rem;color:var(--text3)">${new Date(n.created_at).toLocaleString('bg-BG')}</div>
      </div>
    </div>
  `).join('');
}

async function markNotesRead() {
  if (!STATE.user) return;
  await _supabase.from('notifications').update({ is_read: true }).eq('user_id', STATE.user.id);
  el('inbox-badge').style.display = 'none';
}
