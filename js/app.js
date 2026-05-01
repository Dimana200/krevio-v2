function showPage(page, pushState) {
  if (pushState !== false) {
    STATE.prevPage = document.querySelector('.page.active') ? document.querySelector('.page.active').id.replace('page-', '') : null;
    history.pushState({ page: page }, '', window.location.pathname);
  }
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  document.querySelectorAll('.bn').forEach(function (b) { b.classList.remove('active'); });
  var pg = el('page-' + page); if (pg) pg.classList.add('active');
  var bn = el('bn-' + page); if (bn) bn.classList.add('active');
  if (page === 'profile') renderProfile();
  if (page === 'search') renderSearch();
  if (page === 'inbox') { renderInbox(); markNotifsRead(); }
  if (page === 'creator') loadCreatorPanel();
}

window.addEventListener('popstate', function (e) {
  var openMod = document.querySelector('.modal.open');
  if (openMod) { openMod.classList.remove('open'); return; }
  var creatorModal = el('creator-profile-modal');
  if (creatorModal && creatorModal.classList.contains('open')) { creatorModal.classList.remove('open'); return; }
  if (STATE.prevPage) { showPage(STATE.prevPage, false); STATE.prevPage = null; }
  else { showPage('feed', false); }
});

function toggleFullscreen() {
  STATE.isFullscreen = !STATE.isFullscreen;
  document.body.classList.toggle('fullscreen-mode', STATE.isFullscreen);
  var b = el('btn-fullscreen');
  if (b) { b.innerHTML = STATE.isFullscreen ? '<i data-lucide="minimize-2"></i> Малък' : '<i data-lucide="maximize-2"></i> Голям'; if (window.lucide) window.lucide.createIcons(); }
}

function bindAll() {
  var bf = el('bn-feed'); if (bf) bf.onclick = function () { showPage('feed'); };
  var bs = el('bn-search'); if (bs) bs.onclick = function () { showPage('search'); };
  var bu = el('bn-upload'); if (bu) bu.onclick = openUpload;
  var bi = el('bn-inbox'); if (bi) bi.onclick = function () { showPage('inbox'); };
  var bp = el('bn-profile'); if (bp) bp.onclick = function () { showPage('profile'); };
  var fsBtn = el('btn-fullscreen'); if (fsBtn) fsBtn.onclick = toggleFullscreen;
  ['trending', 'following', 'premium'].forEach(function (t) {
    var btn = el('tab-' + t); if (!btn) return;
    btn.onclick = function () { document.querySelectorAll('.feed-tab').forEach(function (b) { b.classList.remove('active'); }); btn.classList.add('active'); STATE.currentTab = t; resetFeed(); renderFeed(); };
  });
  ['m-comments', 'm-upload', 'm-auth', 'm-menu', 'm-edit-profile'].forEach(function (id) {
    var m = el(id); if (!m) return; m.addEventListener('click', function (e) { if (e.target === m) m.classList.remove('open'); });
  });
  var mMsg = el('m-msg'); if (mMsg) mMsg.addEventListener('click', function (e) { if (e.target === mMsg) { mMsg.classList.remove('open'); if (STATE.msgSubscription) { STATE.msgSubscription.unsubscribe(); STATE.msgSubscription = null; } } });
  ['comments', 'upload', 'auth', 'edit', 'menu', 'msg'].forEach(function (id) { bindSwipe('handle-' + id, 'm-' + (id === 'edit' ? 'edit-profile' : id)); });
  document.querySelectorAll('.cptab').forEach(function (tab) {
    tab.onclick = function () {
      document.querySelectorAll('.cptab').forEach(function (t) { t.classList.remove('active'); }); tab.classList.add('active');
      document.querySelectorAll('.cp-section').forEach(function (s) { s.classList.remove('active'); });
      var sec = el(tab.dataset.tab); if (sec) sec.classList.add('active');
    };
  });
  var csp = el('cp-set-profile'); if (csp) csp.onclick = function () { openModal('m-edit-profile'); };
  var cso = el('cp-set-payout'); if (cso) cso.onclick = function () { showToast('Скоро!'); };
  var cst = el('cp-set-terms'); if (cst) cst.onclick = function () { window.location.href = 'terms.html'; };
  var ccb = el('creator-close-btn'); if (ccb) ccb.onclick = function () { showPage('profile'); };
  var cpb = el('creator-profile-back-btn'); if (cpb) cpb.onclick = function () { el('creator-profile-modal').classList.remove('open'); };
  var swl = el('sw-login'); if (swl) swl.onclick = function () { switchAuth('login'); };
  var swr = el('sw-register'); if (swr) swr.onclick = function () { switchAuth('register'); };
  var lb = el('l-btn'); if (lb) lb.onclick = doLogin;
  var rb = el('r-btn'); if (rb) rb.onclick = doRegister;
  bindUpload();
  var esb = el('edit-save-btn'); if (esb) esb.onclick = saveProfile;
  var ecb = el('edit-cancel-btn'); if (ecb) ecb.onclick = function () { closeModal('m-edit-profile'); };
  var mob = el('menu-open-btn'); if (mob) mob.onclick = function () { openModal('m-menu'); };
  var mth = el('m-theme'); if (mth) mth.onclick = function () { toggleTheme(); closeModal('m-menu'); };
  var mcp = el('m-creator-panel'); if (mcp) mcp.onclick = function () { closeModal('m-menu'); showPage('creator'); };
  var mtr = el('m-terms'); if (mtr) mtr.onclick = function () { window.location.href = 'terms.html'; };
  var mpr = el('m-privacy'); if (mpr) mpr.onclick = function () { window.location.href = 'privacy.html'; };
  var mco = el('m-contact'); if (mco) mco.onclick = function () { window.location.href = 'contact.html'; };
  var mab = el('m-about'); if (mab) mab.onclick = function () { window.location.href = 'about.html'; };
  var mlo = el('m-logout'); if (mlo) mlo.onclick = doLogout;
  var csb = el('cmt-send-btn'); if (csb) csb.onclick = sendComment;
  var msb = el('msg-send-btn');
  if (msb) msb.onclick = async function () {
    var inp = el('msg-inp'); if (!inp || !inp.value.trim()) return; var now = Date.now();
    if (now - STATE.lastMsgTime < CONFIG.MSG_COOLDOWN) { showToast('Изчакай малко!'); return; }
    if (STATE.msgCount >= CONFIG.MSG_LIMIT) { showToast('Достигна лимита!'); return; }
    var text = inp.value.trim(); inp.value = '';
    appendMsg({ from_user_id: STATE.user.id, to_user_id: STATE.currentMsgUserId, text: text, created_at: new Date().toISOString() }, true);
    var ok = await sendMsg(text); if (!ok) showToast('Грешка при изпращане!'); STATE.lastMsgTime = now; STATE.msgCount++;
  };
  document.querySelectorAll('.mono-opt').forEach(function (opt) {
    opt.onclick = function () { document.querySelectorAll('.mono-opt').forEach(function (o) { o.classList.remove('selected'); }); opt.classList.add('selected'); STATE.uploadAccess = opt.dataset.val; };
  });
}

window.addEventListener('load', async function () {
  if (window.lucide) window.lucide.createIcons();
  var saved = localStorage.getItem('krevio-theme'); if (saved === 'light') { STATE.isDark = false; document.body.classList.add('light'); }
  if (typeof supabase !== 'undefined') {
    STATE.sb = supabase.createClient(CONFIG.SB_URL, CONFIG.SB_ANON);
    var sess = await STATE.sb.auth.getSession();
    if (sess.data && sess.data.session) { await initUser(sess.data.session.user); renderFeed(); }
    else { renderFeed(); }
    STATE.sb.auth.onAuthStateChange(async function (event, session) {
      if (session) { await initUser(session.user); }
      else {
        STATE.user = null; STATE.following = {}; STATE.profileCache = {}; STATE.profileCacheKeys = [];
        if (STATE.msgSubscription) { STATE.msgSubscription.unsubscribe(); STATE.msgSubscription = null; }
        if (STATE.notifSubscription) { STATE.notifSubscription.unsubscribe(); STATE.notifSubscription = null; }
        renderProfile(); updateNotifBadge();
      }
    });
  } else { renderFeed(); }
  bindAll();
  history.replaceState({ page: 'feed' }, '', window.location.pathname);
});
