async function loadMyProfile() {
  if (!STATE.user) return;
  var body = el('profile-body');
  var p = STATE.profile || {};
  body.innerHTML = `
    <div class="p-header">
      <img src="${p.avatar_url || 'https://via.placeholder.com/100'}" class="p-avatar">
      <div class="p-name">${p.full_name || 'User'}</div>
      <div class="p-username">@${p.username || 'username'}</div>
      <div class="p-bio">${p.bio || ''}</div>
    </div>
    <div class="p-grid" id="p-grid"></div>
  `;
  loadUserVideos(STATE.user.id, 'p-grid');
}

async function loadUserVideos(uid, gridId) {
  var { data } = await _supabase.from('videos').select('*').eq('user_id', uid);
  var grid = el(gridId);
  if (data && grid) {
    grid.innerHTML = data.map(v => `<div class="p-vid"><video src="${v.url}"></video></div>`).join('');
  }
}
