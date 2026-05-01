function switchAuth(type) {
  var sl = el('sw-login'), sr = el('sw-register'), al = el('auth-login'), ar = el('auth-register');
  if (sl) sl.classList.toggle('active', type === 'login');
  if (sr) sr.classList.toggle('active', type === 'register');
  if (al) al.style.display = type === 'login' ? '' : 'none';
  if (ar) ar.style.display = type === 'register' ? '' : 'none';
}

async function doLogin() {
  var em = el('l-email'), ps = el('l-pass'), er = el('l-err'), bn = el('l-btn');
  if (!em || !ps) return;
  var email = em.value.trim(), pass = ps.value;
  if (!email || !pass) { if (er) { er.textContent = 'Попълни имейл и парола.'; er.style.display = 'block'; } return; }
  if (bn) { bn.textContent = 'Влизане...'; bn.disabled = true; }
  try {
    var r = await STATE.sb.auth.signInWithPassword({ email: email, password: pass });
    if (r.error) { if (er) { er.textContent = r.error.message.includes('Email not confirmed') ? 'Потвърди имейла си първо!' : 'Грешни данни.'; er.style.display = 'block'; } if (bn) { bn.textContent = 'Вход →'; bn.disabled = false; } return; }
    closeModal('m-auth'); if (bn) { bn.textContent = 'Вход →'; bn.disabled = false; }
    showToast('👋 Добре дошъл!'); renderFeed();
  } catch (e) { if (bn) { bn.textContent = 'Вход →'; bn.disabled = false; } }
}

async function doRegister() {
  var nm = el('r-name'), em = el('r-email'), ps = el('r-pass'), er = el('r-err'), bn = el('r-btn');
  if (!nm || !em || !ps) return;
  var name = nm.value.trim(), email = em.value.trim(), pass = ps.value;
  if (!name || !email || !pass) { if (er) { er.textContent = 'Попълни всички полета.'; er.style.display = 'block'; } return; }
  if (pass.length < 8) { if (er) { er.textContent = 'Паролата трябва да е поне 8 символа.'; er.style.display = 'block'; } return; }
  if (bn) { bn.textContent = 'Регистрация...'; bn.disabled = true; }
  try {
    var r = await STATE.sb.auth.signUp({ email: email, password: pass, options: { data: { name: name } } });
    if (r.error) { if (er) { er.textContent = r.error.message; er.style.display = 'block'; } if (bn) { bn.textContent = 'Създай акаунт →'; bn.disabled = false; } return; }
    if (r.data && r.data.user) { try { await STATE.sb.from('profiles').insert({ id: r.data.user.id, name: name, bio: '', avatar_url: '' }); } catch (e) { } }
    closeModal('m-auth'); if (bn) { bn.textContent = 'Създай акаунт →'; bn.disabled = false; }
    showToast('🎉 Провери имейла си!');
  } catch (e) { if (bn) { bn.textContent = 'Създай акаунт →'; bn.disabled = false; } }
}

async function doLogout() {
  if (STATE.sb) await STATE.sb.auth.signOut();
  STATE.user = null; STATE.following = {}; STATE.profileCache = {}; STATE.profileCacheKeys = []; STATE.msgCount = 0;
  if (STATE.msgSubscription) { STATE.msgSubscription.unsubscribe(); STATE.msgSubscription = null; }
  if (STATE.notifSubscription) { STATE.notifSubscription.unsubscribe(); STATE.notifSubscription = null; }
  closeModal('m-menu'); showToast('👋 Излязохте.'); renderProfile();
}

async function saveProfile() {
  var ne = el('edit-name'), be = el('edit-bio'); if (!ne) return;
  var name = ne.value.trim(), bio = be ? be.value.trim() : '';
  if (!name) { showToast('Въведи ime!'); return; }
  try {
    await STATE.sb.from('profiles').update({ name: name, bio: bio }).eq('id', STATE.user.id);
    STATE.user.name = name; STATE.user.bio = bio;
    closeModal('m-edit-profile'); showToast('✅ Профилът е обновен!'); renderProfile();
  } catch (e) { showToast('Грешка!'); }
}

function toggleTheme() {
  STATE.isDark = !STATE.isDark;
  document.body.classList.toggle('light', !STATE.isDark);
  localStorage.setItem('krevio-theme', STATE.isDark ? 'dark' : 'light');
  var lbl = el('m-theme-label'); if (lbl) lbl.textContent = STATE.isDark ? 'Светла тема' : 'Тъмна тема';
  if (window.lucide) window.lucide.createIcons();
}
