async function initUser(u) {
  STATE.user = { id: u.id, email: u.email, name: u.user_metadata.name || u.email.split('@')[0], avatar: '', bio: '' };
  await loadMyProfile();
  await loadFollowing();
  subscribeNotifs();
  updateNotifBadge();
  renderProfile();
}

async function loadMyProfile() {
  if (!STATE.sb || !STATE.user) return;
  try {
    var r = await STATE.sb.from('profiles').select('*').eq('id', STATE.user.id).single();
    if (r.data) {
      STATE.user.avatar = r.data.avatar_url ? r.data.avatar_url + '?t=' + Date.now() : '';
      STATE.user.bio = r.data.bio || '';
      STATE.user.name = r.data.name || STATE.user.name;
      STATE.profileCache[STATE.user.id] = r.data;
      if (!STATE.profileCacheKeys.includes(STATE.user.id)) STATE.profileCacheKeys.push(STATE.user.id);
    }
  } catch (e) { console.error('loadMyProfile:', e); }
}
