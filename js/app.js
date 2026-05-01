// ============================================
// KREVIO — app.js (навигация + init)
// ============================================

// ====== НАВИГАЦИОНЕН СТЕК ======
var _navStack = [];
var _feedRendered = false;

// ====== ОСНОВНА СМЯНА НА СТРАНИЦА (записва история) ======
function showPage(page) {
  var active = document.querySelector('.page.active');
  var current = active ? active.id.replace('page-', '') : 'feed';
  if (current === page) return;   // вече сме тук — не прави нищо
  _navStack.push(current);
  _applyPage(page);
}

// ====== ВЪТРЕШНО РЕНДЕРИРАНЕ (БЕЗ записване в стека) ======
function _applyPage(page) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.bn').forEach(function(b) { b.classList.remove('active'); });
  var pg = el('page-' + page); if (pg) pg.classList.add('active');
  var bn = el('bn-' + page);   if (bn) bn.classList.add('active');
  window.scrollTo(0, 0);

  // Рендерирай само ако трябва
  if (page === 'feed') {
    if (!_feedRendered) { renderFeed(); _feedRendered = true; }
    // Ако feed вече е рендериран — оставаме видеата непроменени, само скролваме
  }
  if (page === 'profile') renderProfile();
  if (page === 'search')  renderSearch();
  if (page === 'inbox')   { renderInbox(); markNotifsRead(); }
  if (page === 'creator') loadCreatorPanel();

  // Покажи/скрий Back бутон
  _updateBackBtn(page);
}

// ====== BACK — връща се стъпка назад ======
function goBack() {
  // 1. Затвори отворен modal ако има
  var openMod = document.querySelector('.modal.open');
  if (openMod) { openMod.classList.remove('open'); return; }

  // 2. Затвори creator-profile-modal ако е отворен
  var cpm = el('creator-profile-modal');
  if (cpm && cpm.classList.contains('open')) { cpm.classList.remove('open'); return; }

  // 3. Върни се на предишната страница
  if (_navStack.length > 0) {
    _applyPage(_navStack.pop());
  } else {
    _applyPage('feed');
  }
}

// ====== HOME — изчиства всичко и отива на Feed ======
function goHome() {
  // Затвори всички отворени модали
  document.querySelectorAll('.modal.open').forEach(function(m) { m.classList.remove('open'); });
  var cpm = el('creator-profile-modal');
  if (cpm) cpm.classList.remove('open');

  // Изчисти стека
  _navStack = [];

  // Ако вече сме на feed — само скролни нагоре
  var active = document.querySelector('.page.active');
  if (active && active.id === 'page-feed') { window.scrollTo(0, 0); return; }

  _applyPage('feed');
}

// ====== BACK БУТОН — инжектиране в хедър ======
function _updateBackBtn(page) {
  var pg = el('page-' + page);
  if (!pg) return;
  var header = pg.querySelector('.page-header');
  if (!header) return;

  // Избегни дублиране
  var existing = header.querySelector('.back-btn-auto');
  if (!existing) {
    var btn = document.createElement('button');
    btn.className = 'icon-btn back-btn-auto';
    btn.setAttribute('aria-label', 'Назад');
    btn.innerHTML = '<i data-lucide="arrow-left"></i>';
    btn.onclick = goBack;
    header.insertBefore(btn, header.firstChild);
    if (window.lucide) window.lucide.createIcons();
  }

  var backBtn = header.querySelector('.back-btn-auto');
  if (backBtn) {
    // Покажи back ако има история или не сме на feed
    backBtn.style.display = (_navStack.length > 0 || page !== 'feed') ? 'flex' : 'none';
  }
}

// ====== CREATOR PROFILE MODAL ======
function openCreatorProfileModal(userId) {
  var cpm = el('creator-profile-modal');
  if (!cpm) return;
  cpm.classList.add('open');          // <-- добавяме 'open' клас (преди липсваше)
  if (typeof loadCreatorProfile === 'function') loadCreatorProfile(userId);
}

// ====== ПОМОЩНИ ======
function el(id) { return document.getElementById(id); }

function toggleFullscreen() {
  STATE.isFullscreen = !STATE.isFullscreen;
  document.body.classList.toggle('fullscreen-mode', STATE.isFullscreen);
  var b = el('btn-fullscreen');
  if (b) {
    b.innerHTML = STATE.isFullscreen
      ? '<i data-lucide="minimize-2"></i> Малък'
      : '<i data-lucide="maximize-2"></i> Голям';
    if (window.lucide) window.lucide.createIcons();
  }
}

// ====== BIND ALL ======
function bindAll() {
  // Bottom nav
  var bf = el('bn-feed');    if (bf) bf.onclick = goHome;                          // HOME = reset
  var bs = el('bn-search');  if (bs) bs.onclick = function() { showPage('search'); };
  var bu = el('bn-upload');  if (bu) bu.onclick = openUpload;
  var bi = el('bn-inbox');   if (bi) bi.onclick = function() { showPage('inbox'); };
  var bp = el('bn-profile'); if (bp) bp.onclick = function() { showPage('profile'); };

  // Fullscreen
  var fsBtn = el('btn-fullscreen'); if (fsBtn) fsBtn.onclick = toggleFullscreen;

  // Feed tabs
  ['trending', 'following', 'premium'].forEach(function(t) {
    var btn = el('tab-' + t); if (!btn) return;
    btn.onclick = function() {
      document.querySelectorAll('.feed-tab').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      STATE.currentTab = t;
      _feedRendered = false;   // принуди ново зареждане при смяна на таб
      resetFeed();
      renderFeed();
      _feedRendered = true;
    };
  });

  // Затваряне на модали при клик извън тях
  ['m-comments', 'm-upload', 'm-auth', 'm-menu', 'm-edit-profile'].forEach(function(id) {
    var m = el(id); if (!m) return;
    m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('open'); });
  });
  var mMsg = el('m-msg');
  if (mMsg) mMsg.addEventListener('click', function(e) {
    if (e.target === mMsg) {
      mMsg.classList.remove('open');
      if (STATE.msgSubscription) { STATE.msgSubscription.unsubscribe(); STATE.msgSubscription = null; }
    }
  });

  // Swipe за затваряне на модали
  ['comments', 'upload', 'auth', 'edit', 'menu', 'msg'].forEach(function(id) {
    bindSwipe('handle-' + id, 'm-' + (id === 'edit' ? 'edit-profile' : id));
  });

  // Creator панел табове
  document.querySelectorAll('.cptab').forEach(function(tab) {
    tab.onclick = function() {
      document.querySelectorAll('.cptab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      document.querySelectorAll('.cp-section').forEach(function(s) { s.classList.remove('active'); });
      var sec = el(tab.dataset.tab); if (sec) sec.classList.add('active');
    };
  });

  // Creator панел настройки
  var csp = el('cp-set-profile'); if (csp) csp.onclick = function() { openModal('m-edit-profile'); };
  var cso = el('cp-set-payout'); if (cso) cso.onclick = function() { showToast('Скоро!'); };
  var cst = el('cp-set-terms'); if (cst) cst.onclick = function() { window.location.href = 'terms.html'; };

  // Creator затваряне — back, не X към нищото
  var ccb = el('creator-close-btn');
  if (ccb) ccb.onclick = goBack;

  // Creator profile modal back
  var cpb = el('creator-profile-back-btn');
  if (cpb) cpb.onclick = goBack;

  // Auth
  var swl = el('sw-login');    if (swl) swl.onclick = function() { switchAuth('login'); };
  var swr = el('sw-register'); if (swr) swr.onclick = function() { switchAuth('register'); };
  var lb  = el('l-btn');       if (lb)  lb.onclick = doLogin;
  var rb  = el('r-btn');       if (rb)  rb.onclick = doRegister;

  bindUpload();

  // Профил
  var esb = el('edit-save-btn');   if (esb) esb.onclick = saveProfile;
  var ecb = el('edit-cancel-btn'); if (ecb) ecb.onclick = function() { closeModal('m-edit-profile'); };
  var mob = el('menu-open-btn');   if (mob) mob.onclick = function() { openModal('m-menu'); };

  // Меню
  var mth = el('m-theme');   if (mth) mth.onclick = function() { toggleTheme(); closeModal('m-menu'); };
  var mcp = el('m-creator-panel'); if (mcp) mcp.onclick = function() { closeModal('m-menu'); showPage('creator'); };
  var mtr = el('m-terms');   if (mtr) mtr.onclick = function() { window.location.href = 'terms.html'; };
  var mpr = el('m-privacy'); if (mpr) mpr.onclick = function() { window.location.href = 'privacy.html'; };
  var mco = el('m-contact'); if (mco) mco.onclick = function() { window.location.href = 'contact.html'; };
  var mab = el('m-about');   if (mab) mab.onclick = function() { window.location.href = 'about.html'; };
  var mlo = el('m-logout');  if (mlo) mlo.onclick = doLogout;

  // Коментари
  var csb = el('cmt-send-btn'); if (csb) csb.onclick = sendComment;

  // Съобщения
  var msb = el('msg-send-btn');
  if (msb) msb.onclick = async function() {
    var inp = el('msg-inp'); if (!inp || !inp.value.trim()) return;
    var now = Date.now();
    if (now - STATE.lastMsgTime < CONFIG.MSG_COOLDOWN) { showToast('Изчакай малко!'); return; }
    if (STATE.msgCount >= CONFIG.MSG_LIMIT) { showToast('Достигна лимита!'); return; }
    var text = inp.value.trim(); inp.value = '';
    appendMsg({ from_user_id: STATE.user.id, to_user_id: STATE.currentMsgUserId, text: text, created_at: new Date().toISOString() }, true);
    var ok = await sendMsg(text);
    if (!ok) showToast('Грешка при изпращане!');
    STATE.lastMsgTime = now; STATE.msgCount++;
  };

  // Upload монетизация
  document.querySelectorAll('.mono-opt').forEach(function(opt) {
    opt.onclick = function() {
      document.querySelectorAll('.mono-opt').forEach(function(o) { o.classList.remove('selected'); });
      opt.classList.add('selected');
      STATE.uploadAccess = opt.dataset.val;
    };
  });
}

// ====== INIT ======
window.addEventListener('load', async function() {
  if (window.lucide) window.lucide.createIcons();

  var saved = localStorage.getItem('krevio-theme');
  if (saved === 'light') { STATE.isDark = false; document.body.classList.add('light'); }

  if (typeof supabase !== 'undefined') {
    STATE.sb = supabase.createClient(CONFIG.SB_URL, CONFIG.SB_ANON);
    var sess = await STATE.sb.auth.getSession();
    if (sess.data && sess.data.session) {
      await initUser(sess.data.session.user);
    }
    renderFeed();
    _feedRendered = true;

    STATE.sb.auth.onAuthStateChange(async function(event, session) {
      if (session) {
        await initUser(session.user);
      } else {
        STATE.user = null;
        STATE.following = {};
        STATE.profileCache = {};
        STATE.profileCacheKeys = [];
        if (STATE.msgSubscription)   { STATE.msgSubscription.unsubscribe();   STATE.msgSubscription = null; }
        if (STATE.notifSubscription) { STATE.notifSubscription.unsubscribe(); STATE.notifSubscription = null; }
        renderProfile();
        updateNotifBadge();
      }
    });
  } else {
    renderFeed();
    _feedRendered = true;
  }

  bindAll();
});
