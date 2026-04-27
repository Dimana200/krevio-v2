var STATE = {
  user: null,
  profile: null,
  page: 'feed',
  lastMsgTime: 0,
  msgCount: 0,
  videos: [],
  following: [],
  activeVideo: null,
  currentCmtVid: null
};

function el(id) { return document.getElementById(id); }

function showPage(pId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  var p = el('page-' + pId);
  if (p) p.classList.add('active');
  document.querySelectorAll('.bn').forEach(b => b.classList.remove('active'));
  var b = el('bn-' + pId);
  if (b) b.classList.add('active');
  STATE.page = pId;
  if (pId === 'feed') { loadFeed(); }
  if (pId === 'profile') { loadMyProfile(); }
  if (pId === 'creator') { loadCreatorDashboard(); }
}

function showModal(id) { var m = el(id); if (m) m.classList.add('active'); }
function closeModal(id) { var m = el(id); if (m) m.classList.remove('active'); }

function showToast(txt) {
  var t = el('toast');
  t.innerText = txt;
  t.classList.add('active');
  setTimeout(() => t.classList.remove('active'), 3000);
}

window.onload = function() {
  if (window.lucide) lucide.createIcons();
  checkUser();
  initAppListeners();
};

function initAppListeners() {
  el('bn-feed').onclick = function() { showPage('feed'); };
  el('bn-search').onclick = function() { showPage('search'); };
  el('bn-inbox').onclick = function() { showPage('inbox'); };
  el('bn-profile').onclick = function() { if(!STATE.user) showModal('m-auth'); else showPage('profile'); };
  el('bn-upload').onclick = function() { if(!STATE.user) showModal('m-auth'); else showModal('m-upload'); };
  
  el('menu-open-btn').onclick = function() { showModal('m-menu'); };
  el('handle-menu').onclick = function() { closeModal('m-menu'); };
  
  el('l-btn').onclick = doLogin;
  el('r-btn').onclick = doRegister;
  el('upl-go-btn').onclick = handleUpload;
  el('m-logout').onclick = doLogout;

  // Creator Panel listeners
  var mcp = el('m-creator-panel');
  if (mcp) mcp.onclick = function() { closeModal('m-menu'); showPage('creator'); };
}
