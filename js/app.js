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
  
  if (pId === 'feed') loadFeed();
  if (pId === 'profile') loadMyProfile();
  if (pId === 'inbox') loadNotifications();
}

function showModal(id) { var m = el(id); if (m) m.classList.add('active'); }
function closeModal(id) { var m = el(id); if (m) m.classList.remove('active'); }

function showToast(txt) {
  var t = el('toast');
  if(!t) return;
  t.innerText = txt;
  t.classList.add('active');
  setTimeout(() => t.classList.remove('active'), 3000);
}

// Изпълнява се веднага щом страницата зареди
window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  initAppListeners();
  checkUser(); // Проверява сесията и зарежда фийда
});

function initAppListeners() {
  if(el('bn-feed')) el('bn-feed').onclick = () => showPage('feed');
  if(el('bn-search')) el('bn-search').onclick = () => showPage('search');
  if(el('bn-inbox')) el('bn-inbox').onclick = () => showPage('inbox');
  if(el('bn-profile')) el('bn-profile').onclick = () => { if(!STATE.user) showModal('m-auth'); else showPage('profile'); };
  if(el('bn-upload')) el('bn-upload').onclick = () => { if(!STATE.user) showModal('m-auth'); else showModal('m-upload'); };
  
  if(el('menu-open-btn')) el('menu-open-btn').onclick = () => showModal('m-menu');
  if(el('handle-menu')) el('handle-menu').onclick = () => closeModal('m-menu');
  if(el('l-btn')) el('l-btn').onclick = doLogin;
  if(el('r-btn')) el('r-btn').onclick = doRegister;
  if(el('upl-go-btn')) el('upl-go-btn').onclick = handleUpload;
  if(el('m-logout')) el('m-logout').onclick = doLogout;
}
