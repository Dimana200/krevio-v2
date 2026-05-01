window.onerror = function(msg, url, line) {
  console.error('❌ ГРЕШКА:', msg, 'ред:', line);
};

var STATE = {
  sb: null, user: null, uploadFile: null,
  isDark: true, audioUnlocked: false,
  currentVideoId: null, uploadAccess: 'free',
  isFullscreen: false,
  following: {}, profileCache: {}, profileCacheKeys: [],
  viewedVideos: {}, currentTab: 'trending',
  currentMsgUserId: null, msgSubscription: null, notifSubscription: null,
  lastMsgTime: 0, msgCount: 0, shownVideoIds: [],
  prevPage: null,
  feed: { batchSize: 10, loading: false, hasMore: true, offset: 0 }
};
window.STATE = STATE;

var CONFIG = {
  SB_URL: 'https://ucsogdvswugpynaqymtg.supabase.co',
  SB_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjc29nZHZzd3VncHluYXF5bXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzM2NTEsImV4cCI6MjA5MjM0OTY1MX0.pGjks7ghLR6tDyK0RlIPP57xIvbDomx-jelXHO8fEKI',
  BACKEND: 'https://krevio-backend-production.up.railway.app',
  CACHE_LIMIT: 100, MSG_COOLDOWN: 3000, MSG_LIMIT: 20, VIEW_MS: 3000
};
window.CONFIG = CONFIG;

function fmt(n) { if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'; if (n >= 1000) return (n / 1000).toFixed(1) + 'K'; return n || 0; }
function fmtBytes(b) { if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB'; return (b / 1073741824).toFixed(2) + ' GB'; }
function fmtTime(ts) { if (!ts) return ''; var d = new Date(ts), now = new Date(), s = Math.floor((now - d) / 1000); if (s < 60) return s + 'с'; if (s < 3600) return Math.floor(s / 60) + 'мин'; if (s < 86400) return Math.floor(s / 3600) + 'ч'; return Math.floor(s / 86400) + 'д'; }
function fmtDur(s) { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; }
function el(id) { return document.getElementById(id); }
function mk(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
function ico(name, size) { var i = document.createElement('i'); i.setAttribute('data-lucide', name); size = size || 24; i.style.cssText = 'width:' + size + 'px;height:' + size + 'px'; return i; }
function showToast(msg) { var t = el('toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 3000); }
function openModal(id) { var m = el(id); if (m) { m.classList.add('open'); if (window.lucide) window.lucide.createIcons(); } }
function closeModal(id) { var m = el(id); if (m) m.classList.remove('open'); }
function bindSwipe(hid, mid) { var h = el(hid), m = el(mid); if (!h || !m) return; var y0 = 0, t0 = 0; h.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true }); h.addEventListener('touchend', function (e) { if (e.changedTouches[0].clientY - y0 > 60 && Date.now() - t0 < 400) m.classList.remove('open'); }, { passive: true }); }
function parseTags(text) { if (!text) return []; var m = text.match(/#[\wа-яА-ЯёЁ]+/g); return m ? m.map(function (t) { return t.toLowerCase(); }) : []; }
function showSeekAnim(item, text) { var d = mk('div'); d.textContent = text; d.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:50;pointer-events:none;font-size:1.3rem;font-weight:900;color:#fff;background:rgba(0,0,0,.55);padding:10px 20px;border-radius:12px;opacity:1;transition:opacity .4s'; item.appendChild(d); setTimeout(function () { d.style.opacity = '0'; }, 400); setTimeout(function () { try { item.removeChild(d); } catch (e) { } }, 850); }
