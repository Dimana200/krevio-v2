// ============================================
// KREVIO — supabase.js
// Само data функции. Auth е в auth.js
// ============================================

async function initUser(u) {
  STATE.user = {
    id: u.id,
    email: u.email,
    name: u.user_metadata.name || u.email.split('@')[0],
    avatar: '', bio: ''
  };
  await loadMyProfile();
  await loadFollowing();
  subscribeNotifs();
  updateNotifBadge();
  // НЕ викаме renderProfile() — рендерира се при навигация към профил
}

async function loadMyProfile() {
  if (!STATE.sb || !STATE.user) return;
  try {
    var r = await STATE.sb.from('profiles').select('*').eq('id', STATE.user.id).single();
    if (r.data) {
      STATE.user.avatar = r.data.avatar_url ? r.data.avatar_url + '?t=' + Date.now() : '';
      STATE.user.bio    = r.data.bio  || '';
      STATE.user.name   = r.data.name || STATE.user.name;
      STATE.profileCache[STATE.user.id] = r.data;
      if (!STATE.profileCacheKeys.includes(STATE.user.id)) STATE.profileCacheKeys.push(STATE.user.id);
    }
  } catch(e) { console.error('loadMyProfile:', e); }
}

async function loadFollowing() {
  if (!STATE.sb || !STATE.user) return;
  try {
    var r = await STATE.sb.from('follows').select('following_id').eq('follower_id', STATE.user.id);
    STATE.following = {};
    (r.data || []).forEach(function(f) { STATE.following[f.following_id] = true; });
  } catch(e) { console.error('loadFollowing:', e); }
}

async function getProfile(uid) {
  if (!uid) return null;
  if (STATE.profileCache[uid]) return STATE.profileCache[uid];
  if (!STATE.sb) return null;
  try {
    var r = await STATE.sb.from('profiles').select('*').eq('id', uid).single();
    if (r.data) {
      if (STATE.profileCacheKeys.length >= CONFIG.CACHE_LIMIT) {
        var oldest = STATE.profileCacheKeys.shift();
        delete STATE.profileCache[oldest];
      }
      STATE.profileCache[uid] = r.data;
      STATE.profileCacheKeys.push(uid);
    }
    return r.data || null;
  } catch(e) { return null; }
}

async function toggleFollow(userId, btn) {
  if (!STATE.user) { showToast('Влез за да следваш!'); return; }
  var isF = STATE.following[userId] || false;
  if (isF) {
    STATE.following[userId] = false; btn.textContent = 'Следвай'; btn.classList.remove('following');
    try { await STATE.sb.from('follows').delete().eq('follower_id', STATE.user.id).eq('following_id', userId); } catch(e) {}
  } else {
    STATE.following[userId] = true; btn.textContent = '✓ Следваш'; btn.classList.add('following');
    try {
      await STATE.sb.from('follows').insert({ follower_id: STATE.user.id, following_id: userId });
      var myName = STATE.user.name || STATE.user.email.split('@')[0];
      sendNotif(userId, 'follow', '@' + myName + ' те последва', null);
    } catch(e) {}
  }
}

async function saveProfile() {
  if (!STATE.sb || !STATE.user) return;
  var name = el('edit-name') ? el('edit-name').value.trim() : '';
  var bio  = el('edit-bio')  ? el('edit-bio').value.trim()  : '';
  if (!name) { showToast('Въведи Име!'); return; }
  try {
    await STATE.sb.from('profiles').upsert({ id: STATE.user.id, name: name, bio: bio }, { onConflict: 'id' });
    STATE.user.name = name; STATE.user.bio = bio;
    closeModal('m-edit-profile');
    showToast('✅ Профилът е запазен!');
    if (typeof renderProfile === 'function') renderProfile();
  } catch(e) { showToast('Грешка: ' + e.message); }
}
