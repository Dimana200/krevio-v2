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
  // НЕ викаме renderProfile() тук — ще се рендерира когато потребителят
  // отиде на профил страницата. Двойното викане причиняваше race condition.
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
      // LRU cache limit
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
    _profileRendering = false;
    renderProfile();
  } catch(e) { showToast('Грешка: ' + e.message); }
}

async function doLogin() {
  var email = el('l-email') ? el('l-email').value.trim() : '';
  var pass  = el('l-pass')  ? el('l-pass').value : '';
  var errEl = el('l-err');
  if (!email || !pass) { if (errEl) errEl.textContent = 'Попълни всички полета.'; return; }
  var btn = el('l-btn'); if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
  try {
    var r = await STATE.sb.auth.signInWithPassword({ email: email, password: pass });
    if (r.error) throw r.error;
    closeModal('m-auth');
    showToast('Добре дошъл! 🎉');
  } catch(e) {
    if (errEl) errEl.textContent = e.message || 'Грешен имейл или парола.';
  } finally {
    if (btn) { btn.textContent = 'Вход →'; btn.disabled = false; }
  }
}

async function doRegister() {
  var name  = el('r-name')  ? el('r-name').value.trim()  : '';
  var email = el('r-email') ? el('r-email').value.trim() : '';
  var pass  = el('r-pass')  ? el('r-pass').value : '';
  var errEl = el('r-err');
  if (!name || !email || !pass) { if (errEl) errEl.textContent = 'Попълни всички полета.'; return; }
  if (pass.length < 8) { if (errEl) errEl.textContent = 'Паролата трябва да е поне 8 символа.'; return; }
  var btn = el('r-btn'); if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
  try {
    var r = await STATE.sb.auth.signUp({ email: email, password: pass, options: { data: { name: name } } });
    if (r.error) throw r.error;
    closeModal('m-auth');
    showToast('✅ Провери имейла си!');
  } catch(e) {
    if (errEl) errEl.textContent = e.message || 'Грешка при регистрация.';
  } finally {
    if (btn) { btn.textContent = 'Създай акаунт →'; btn.disabled = false; }
  }
}

async function doLogout() {
  if (STATE.sb) await STATE.sb.auth.signOut();
  STATE.user = null; STATE.following = {}; STATE.profileCache = {}; STATE.profileCacheKeys = [];
  if (STATE.msgSubscription)   { STATE.msgSubscription.unsubscribe();   STATE.msgSubscription = null; }
  if (STATE.notifSubscription) { STATE.notifSubscription.unsubscribe(); STATE.notifSubscription = null; }
  closeModal('m-menu');
  showToast('Излязохте успешно. До скоро! 👋');
  updateNotifBadge();
  _profileRendering = false;
  renderProfile();
}

function switchAuth(type) {
  var login = el('auth-login'); var reg = el('auth-register');
  var swl   = el('sw-login');   var swr = el('sw-register');
  if (type === 'login') {
    if (login) login.style.display = ''; if (reg) reg.style.display = 'none';
    if (swl) swl.classList.add('active'); if (swr) swr.classList.remove('active');
  } else {
    if (login) login.style.display = 'none'; if (reg) reg.style.display = '';
    if (swl) swl.classList.remove('active'); if (swr) swr.classList.add('active');
  }
}
