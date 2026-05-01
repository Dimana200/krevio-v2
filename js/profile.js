// ====== ИЗТРИВАНЕ НА ВИДЕО (Supabase + R2) ======
async function deleteVideo(v, cell, grid) {
  if (!STATE.sb || !STATE.user) return;
  try {
    var sess = await STATE.sb.auth.getSession();
    var token = sess.data && sess.data.session ? sess.data.session.access_token : null;
    if (!token) { showToast('Не си влязъл!'); return; }

    var r = await fetch(CONFIG.BACKEND + '/delete-video', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, videoId: v.id, fileUrl: v.file_url })
    });
    var data = await r.json();
    if (!r.ok) { showToast('Грешка: ' + (data.error || r.status)); return; }
  } catch (e) { showToast('Грешка при изтриване!'); return; }

  cell.style.transition = 'opacity .3s, transform .3s';
  cell.style.opacity = '0'; cell.style.transform = 'scale(0.8)';
  setTimeout(function() {
    try { grid.removeChild(cell); } catch(e) {}
    if (grid.querySelectorAll('.vg-cell').length === 0) {
      grid.innerHTML = "<div style='grid-column:1/-1;padding:30px;text-align:center;color:var(--text2)'>Все още нямаш видеа</div>";
    }
  }, 300);
  showToast('🗑️ Видеото е изтрито');
}

// ====== ОТВАРЯНЕ НА ВИДЕО ОТ ГРИДА ======
function openVideoFromGrid(v) {
  // Маркираме feed-а като "single" за да знае goHome да го рендерира наново
  var wrap = el('feed-wrap');
  if (wrap) {
    wrap.querySelectorAll('.video-item').forEach(function(it) {
      if (it._obs) { it._obs.disconnect(); it._obs = null; }
      var vid = it.querySelector('.v-player');
      if (vid) { vid.pause(); vid.src = ''; vid.load(); }
    });
    wrap.innerHTML = '';
    wrap.dataset.single = '1';
  }

  showPage('feed');
  STATE.currentTab = 'trending';
  resetFeed();

  if (wrap) {
    var card = buildCard(v, 0);
    if (card) {
      wrap.appendChild(card);
      var sentinel = mk('div', 'load-more'); sentinel.id = 'sentinel'; sentinel.style.display = 'none'; wrap.appendChild(sentinel);
    }
    if (window.lucide) window.lucide.createIcons();
  }
}

// ====== ВИДЕО ГРИД ======
function buildVideoGrid(videos, emptyMsg, allowDelete) {
  var grid = mk('div', 'vgrid');
  if (videos && videos.length > 0) {
    videos.forEach(function(v) {
      var cell = mk('div', 'vg-cell');
      if (v.thumbnail_url) {
        var img = document.createElement('img'); img.src = v.thumbnail_url; cell.appendChild(img);
      } else if (v.file_url) {
        var ve = document.createElement('video');
        ve.src = v.file_url; ve.preload = 'metadata'; ve.muted = true; ve.playsInline = true;
        ve.addEventListener('loadedmetadata', function() { ve.currentTime = 1; });
        cell.appendChild(ve);
      } else {
        var ph = mk('div'); ph.style.cssText = 'width:100%;height:100%;background:#111;display:flex;align-items:center;justify-content:center;font-size:1.5rem'; ph.textContent = '🎬'; cell.appendChild(ph);
      }
      cell.appendChild(mk('div', 'vg-overlay'));

      var info = mk('div', 'vg-info');
      var vw = mk('div', 'vg-views'); vw.textContent = '👁 ' + fmt(v.views || 0); info.appendChild(vw);
      if (v.access_level && v.access_level !== 'free') { var vb = mk('div', 'vg-badge'); vb.textContent = '🔒'; info.appendChild(vb); }
      cell.appendChild(info);

      if (allowDelete) {
        var pressTimer = null; var deleteShown = false;

        function showDeleteOverlay() {
          if (deleteShown) return; deleteShown = true;
          var ov = mk('div', 'vg-delete-ov');
          ov.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.8);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;border-radius:8px';
          var icon = mk('div'); icon.textContent = '🗑️'; icon.style.cssText = 'font-size:2rem;margin-bottom:8px';
          var label = mk('div'); label.textContent = 'Изтрий?'; label.style.cssText = 'font-size:.75rem;color:#fff;margin-bottom:12px';
          var btnRow = mk('div'); btnRow.style.cssText = 'display:flex;gap:8px';
          var yesBtn = mk('button'); yesBtn.textContent = '✕ Изтрий';
          yesBtn.style.cssText = 'background:#e05252;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:.78rem;font-weight:700;cursor:pointer';
          yesBtn.onclick = function(e) { e.stopPropagation(); deleteVideo(v, cell, grid); };
          var noBtn = mk('button'); noBtn.textContent = 'Назад';
          noBtn.style.cssText = 'background:rgba(255,255,255,.15);color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:.78rem;cursor:pointer';
          noBtn.onclick = function(e) { e.stopPropagation(); hideDeleteOverlay(); };
          btnRow.appendChild(yesBtn); btnRow.appendChild(noBtn);
          ov.appendChild(icon); ov.appendChild(label); ov.appendChild(btnRow);
          cell.appendChild(ov);
        }
        function hideDeleteOverlay() {
          deleteShown = false;
          var ov = cell.querySelector('.vg-delete-ov');
          if (ov) { try { cell.removeChild(ov); } catch(e) {} }
        }

        cell.addEventListener('touchstart', function() { pressTimer = setTimeout(showDeleteOverlay, 600); }, { passive: true });
        cell.addEventListener('touchend',   function() { clearTimeout(pressTimer); }, { passive: true });
        cell.addEventListener('touchmove',  function() { clearTimeout(pressTimer); }, { passive: true });
        cell.addEventListener('contextmenu', function(e) { e.preventDefault(); showDeleteOverlay(); });
        cell.onclick = function() { if (deleteShown) return; openVideoFromGrid(v); };
      } else {
        cell.onclick = function() { openVideoFromGrid(v); };
      }
      grid.appendChild(cell);
    });
  } else {
    grid.innerHTML = "<div style='grid-column:1/-1;padding:30px;text-align:center;color:var(--text2)'>" + emptyMsg + "</div>";
  }
  return grid;
}

// ====== РЕНДЕРИРАНЕ НА ПРОФИЛ ======
var _profileRendering = false;

async function renderProfile() {
  // Предотврати двойно рендериране едновременно
  if (_profileRendering) return;
  _profileRendering = true;

  var wrap = el('profile-body');
  if (!wrap) { _profileRendering = false; return; }
  wrap.innerHTML = '';

  if (!STATE.user) {
    var lm = mk('div'); lm.style.cssText = 'padding:60px 20px;text-align:center';
    lm.innerHTML = "<div style='font-size:3rem;margin-bottom:16px'>👤</div><div style='font-size:1rem;font-weight:700;margin-bottom:8px'>Влез в акаунта си</div><div style='font-size:.82rem;color:var(--text2);margin-bottom:20px'>За да видиш профила си</div>";
    var lb2 = mk('button', 'btn-gold'); lb2.style.cssText = 'width:auto;padding:12px 32px;margin:0 auto;display:block';
    lb2.textContent = 'Вход / Регистрация'; lb2.onclick = function() { openModal('m-auth'); };
    lm.appendChild(lb2); wrap.appendChild(lm);
    if (window.lucide) window.lucide.createIcons();
    _profileRendering = false; return;
  }

  // ── 1. Покажи веднага без да чакаме Supabase ──
  var banner = mk('div', 'p-banner'); banner.appendChild(mk('div', 'p-banner-gradient')); wrap.appendChild(banner);
  var hero = mk('div', 'p-hero');
  var avW = mk('div', 'p-avatar-wrap');
  if (STATE.user.avatar) { var ai = document.createElement('img'); ai.src = STATE.user.avatar; avW.appendChild(ai); }
  else avW.textContent = '👤';
  var avE = mk('div', 'p-avatar-edit'); avE.textContent = '✏️ Смени'; avW.appendChild(avE);
  avW.onclick = function() { var inp = el('upl-avatar-inp'); if (inp) inp.click(); };
  if (!el('upl-avatar-inp')) {
    var ai2 = document.createElement('input'); ai2.type = 'file'; ai2.accept = 'image/*'; ai2.id = 'upl-avatar-inp'; ai2.style.display = 'none';
    ai2.onchange = async function() {
      if (!this.files || !this.files[0]) return; showToast('Качване...');
      var file = this.files[0]; var ext = file.name.split('.').pop(); var path = 'avatars/' + STATE.user.id + '.' + ext;
      try {
        var up = await STATE.sb.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '0' });
        if (up.error) throw up.error;
        var url = STATE.sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
        await STATE.sb.from('profiles').update({ avatar_url: url }).eq('id', STATE.user.id);
        STATE.user.avatar = url + '?t=' + Date.now(); showToast('✅ Снимката е сменена!');
        _profileRendering = false; renderProfile();
      } catch(e) { showToast('Грешка: ' + e.message); }
    };
    document.body.appendChild(ai2);
  }

  var nm = mk('div', 'p-name'); nm.textContent = STATE.user.name || STATE.user.email.split('@')[0];
  var hd = mk('div', 'p-handle'); hd.textContent = '@' + (STATE.user.name || STATE.user.email.split('@')[0]).toLowerCase().replace(/\s+/g, '_');
  var bio = mk('p', 'p-bio'); bio.textContent = STATE.user.bio || 'Добави биография';

  // Stats — показваме 0 веднага, зареждаме async
  var stats = mk('div', 'p-stats');
  var snVid = mk('div', 'pst-n'); snVid.textContent = '—';
  var snFan = mk('div', 'pst-n'); snFan.textContent = '—';
  var snFol = mk('div', 'pst-n'); snFol.textContent = '—';
  [{ n: snVid, l: 'Видеа' }, { n: snFan, l: 'Фена' }, { n: snFol, l: 'Следва' }].forEach(function(s) {
    var st = mk('div'); var sl = mk('div', 'pst-l'); sl.textContent = s.l; st.appendChild(s.n); st.appendChild(sl); stats.appendChild(st);
  });

  var btns = mk('div', 'p-action-btns');
  var eb = mk('button', 'p-edit-btn'); eb.textContent = '✏️ Редактирай';
  eb.onclick = function() { var en = el('edit-name'); var ebi = el('edit-bio'); if (en) en.value = STATE.user.name || ''; if (ebi) ebi.value = STATE.user.bio || ''; openModal('m-edit-profile'); };
  var cb = mk('button', 'p-creator-btn'); cb.textContent = '🎬 Creator Панел'; cb.onclick = function() { showPage('creator'); };
  btns.appendChild(eb); btns.appendChild(cb);
  hero.appendChild(avW); hero.appendChild(nm); hero.appendChild(hd); hero.appendChild(stats); hero.appendChild(bio); hero.appendChild(btns);
  wrap.appendChild(hero); // ← добавяме hero ВЕДНАГА без да чакаме stats

  // Tabs
  var tabs = mk('div', 'p-tabs'); var tabBtns = []; var grids = [];
  ['📹 Видеа', '❤️ Харесани', '🔖 Запазени', '💎 Премиум'].forEach(function(t, idx) {
    var tb = mk('button', 'p-tab' + (idx === 0 ? ' active' : '')); tb.textContent = t; tabs.appendChild(tb); tabBtns.push(tb);
  });
  wrap.appendChild(tabs);

  // Loading placeholder
  var loadingDiv = mk('div'); loadingDiv.style.cssText = 'padding:30px;text-align:center;color:var(--text2)'; loadingDiv.textContent = 'Зарежда...';
  wrap.appendChild(loadingDiv);

  if (window.lucide) window.lucide.createIcons();
  _profileRendering = false; // освобождаваме lock преди async операциите

  // ── 2. Зареди stats async (не блокира показването) ──
  if (STATE.sb) {
    try { var vr = await STATE.sb.from('videos').select('id', { count: 'exact' }).eq('user_id', STATE.user.id); snVid.textContent = vr.count || 0; } catch(e) { snVid.textContent = '0'; }
    try { var fr = await STATE.sb.from('follows').select('id', { count: 'exact' }).eq('following_id', STATE.user.id); snFan.textContent = fr.count || 0; } catch(e) { snFan.textContent = '0'; }
    try { var fo = await STATE.sb.from('follows').select('id', { count: 'exact' }).eq('follower_id', STATE.user.id); snFol.textContent = fo.count || 0; } catch(e) { snFol.textContent = '0'; }
  }

  // ── 3. Зареди видеата ──
  var myVids = [];
  try { if (STATE.sb) { var mv = await STATE.sb.from('videos').select('*').eq('user_id', STATE.user.id).order('created_at', { ascending: false }).limit(50); myVids = mv.data || []; } } catch(e) {}
  var likedVids = [];
  try { if (STATE.sb) { var lv = await STATE.sb.from('likes').select('video_id').eq('user_id', STATE.user.id); var lids = (lv.data || []).map(function(l) { return l.video_id; }); if (lids.length) { var lvv = await STATE.sb.from('videos').select('*').in('id', lids); likedVids = lvv.data || []; } } } catch(e) {}
  var savedVids = [];
  try { if (STATE.sb) { var sv = await STATE.sb.from('saves').select('video_id').eq('user_id', STATE.user.id); var sids = (sv.data || []).map(function(s) { return s.video_id; }); if (sids.length) { var svv = await STATE.sb.from('videos').select('*').in('id', sids); savedVids = svv.data || []; } } } catch(e) {}
  var premVids = myVids.filter(function(v) { return v.access_level && v.access_level !== 'free'; });

  // Провери дали все още сме на профил страницата
  var active = document.querySelector('.page.active');
  if (!active || active.id !== 'page-profile') return;

  wrap.removeChild(loadingDiv);

  [
    { vids: myVids,    msg: 'Все още нямаш видеа',     del: true  },
    { vids: likedVids, msg: 'Не си харесал видеа',      del: false },
    { vids: savedVids, msg: 'Нямаш запазени',           del: false },
    { vids: premVids,  msg: 'Нямаш премиум съдържание', del: true  }
  ].forEach(function(cfg, idx) {
    var g = buildVideoGrid(cfg.vids, cfg.msg, cfg.del);
    g.style.display = idx === 0 ? 'grid' : 'none';
    wrap.appendChild(g); grids.push(g);
  });

  tabBtns.forEach(function(tb, idx) {
    tb.onclick = function() {
      tabBtns.forEach(function(t) { t.classList.remove('active'); }); tb.classList.add('active');
      grids.forEach(function(g, gi) { g.style.display = gi === idx ? 'grid' : 'none'; });
    };
  });

  var hint = mk('div');
  hint.style.cssText = 'text-align:center;font-size:.72rem;color:var(--text3);padding:8px 0 16px;opacity:.6';
  hint.textContent = '💡 Задръж върху видео за да го изтриеш';
  wrap.appendChild(hint);

  if (window.lucide) window.lucide.createIcons();
}
