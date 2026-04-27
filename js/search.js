el('search-inp').oninput = async function() {
  var q = this.value.trim();
  if (q.length < 2) { el('search-list').innerHTML = ''; return; }
  
  var { data, error } = await _supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', `%${q}%`)
    .limit(20);

  var list = el('search-list');
  if (data && data.length > 0) {
    list.innerHTML = data.map(p => `
      <div class="user-row" onclick="openCreatorProfile('${p.id}')" style="display:flex;align-items:center;padding:12px 16px;gap:12px;border-bottom:1px solid var(--border)">
        <img src="${p.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+p.id}" style="width:44px;height:44px;border-radius:50%">
        <div style="flex:1">
          <div style="font-weight:700;font-size:.9rem">${p.full_name}</div>
          <div style="font-size:.75rem;color:var(--text2)">@${p.username}</div>
        </div>
        <i data-lucide="chevron-right" style="width:16px;color:var(--text3)"></i>
      </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
  } else {
    list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3)">Няма намерени резултати</div>';
  }
};
