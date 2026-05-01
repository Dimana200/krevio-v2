function startViewTimer(videoId, tags) {
  if (STATE.viewedVideos[videoId] || STATE.viewedVideos['_t_' + videoId]) return;
  STATE.viewedVideos['_t_' + videoId] = setTimeout(async function () {
    if (!STATE.sb) return;
    try {
      var cur = await STATE.sb.from('videos').select('views').eq('id', videoId).single();
      var nv = (cur.data ? cur.data.views || 0 : 0) + 1;
      await STATE.sb.from('videos').update({ views: nv }).eq('id', videoId);
      STATE.viewedVideos[videoId] = true;
      if (STATE.user && tags && tags.length > 0) {
        try { await STATE.sb.from('watch_history').upsert({ user_id: STATE.user.id, video_id: videoId, watched_seconds: 3, tags: tags }, { onConflict: 'user_id,video_id' }); } catch (e) { }
      }
    } catch (e) { }
  }, CONFIG.VIEW_MS);
}

function stopViewTimer(videoId) {
  if (STATE.viewedVideos['_t_' + videoId]) { clearTimeout(STATE.viewedVideos['_t_' + videoId]); delete STATE.viewedVideos['_t_' + videoId]; }
}

function buildAd(idx, ads) {
  var ad = ads[idx % ads.length];
  var item = mk('div', 'ad-item');
  item.style.background = 'linear-gradient(160deg,#0a0800,#1a1400,#0a0800)';
  var c = mk('div'); c.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:5;text-align:center;padding:24px';
  c.innerHTML = "<div style='font-size:.62rem;color:rgba(201,168,76,.4);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;border:1px solid rgba(201,168,76,.2);padding:3px 10px;border-radius:100px'>Спонсорирано</div><div style='font-size:1.8rem;font-weight:900;background:linear-gradient(135deg,#c9a84c,#e8c96d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px'>" + ad.company + "</div><div style='font-size:.9rem;color:rgba(255,255,255,.65)'>" + ad.text + "</div>";
  item.appendChild(c); return item;
}

async function loadLikeCount(videoId, cntEl, btn) {
  if (!STATE.sb) return;
  try {
    var r = await STATE.sb.from('likes').select('id', { count: 'exact' }).eq('video_id', videoId);
    if (cntEl) cntEl.textContent = fmt(r.count || 0);
    if (btn && STATE.user) { var my = await STATE.sb.from('likes').select('id').eq('video_id', videoId).eq('user_id', STATE.user.id).maybeSingle(); if (my.data) btn.classList.add('liked'); }
  } catch (e) { }
}

async function loadCommentCount(videoId, cntEl) {
  if (!STATE.sb) return;
  try { var r = await STATE.sb.from('comments').select('id', { count: 'exact' }).eq('video_id', videoId); if (cntEl) cntEl.textContent = fmt(r.count || 0); } catch (e) { }
}

async function loadSaveState(videoId, btn) {
  if (!STATE.sb || !STATE.user || !btn) return;
  try { var r = await STATE.sb.from('saves').select('id').eq('video_id', videoId).eq('user_id', STATE.user.id).maybeSingle(); if (r.data) btn.classList.add('saved'); } catch (e) { }
}

function buildCard(v, i) {
  // ---- GUARD: пропусни видео без URL ----
  if (!v.file_url) return null;

  var profile = STATE.profileCache[v.user_id] || null;
  var cName   = profile ? (profile.name || 'Потребител') : (v.creator_name || 'Потребител');
  var cAvatar = profile ? profile.avatar_url : null;
  var isPaid  = v.access_level && v.access_level !== 'free';
  var tags    = parseTags(v.description);
  var item    = mk('div', 'video-item');

  // ---- VIDEO ELEMENT ----
  var vid = document.createElement('video');
  vid.className = 'v-player';
  vid.loop = true; vid.muted = true; vid.playsInline = true; vid.preload = 'none';
  vid._src = v.file_url;
  item.appendChild(vid);
  item.appendChild(mk('div', 'v-gradient'));

  // ---- LOADING SPINNER ----
  var loadDiv = mk('div', 'v-loading');
  loadDiv.appendChild(mk('div', 'v-spinner'));
  item.appendChild(loadDiv);
  vid.addEventListener('loadeddata', function () { loadDiv.style.display = 'none'; });
  vid.addEventListener('waiting',    function () { loadDiv.style.display = 'flex'; });
  vid.addEventListener('playing',    function () { loadDiv.style.display = 'none'; });

  // ---- VIDEO ERROR — показва placeholder вместо черен екран ----
  vid.addEventListener('error', function () {
    loadDiv.style.display = 'none';
    var errDiv = mk('div', 'v-error-state');
    errDiv.innerHTML = "<div style='font-size:2rem;margin-bottom:8px'>⚠️</div><div style='font-size:.8rem;color:rgba(255,255,255,.5)'>Видеото не може да се зареди</div>";
    errDiv.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:4;pointer-events:none';
    item.insertBefore(errDiv, item.firstChild);
  });

  // ---- PLAY / PAUSE OVERLAY ----
  var playOv = mk('div', 'v-play-overlay');
  var playCirc = mk('div', 'v-play-circle');
  playCirc.innerHTML = "<svg viewBox='0 0 24 24' style='width:24px;height:24px;fill:#c9a84c;margin-left:3px'><polygon points='6,3 20,12 6,21'/></svg>";
  playOv.appendChild(playCirc); item.appendChild(playOv);

  var pauseOv = mk('div', 'v-play-overlay');
  var pauseCirc = mk('div', 'v-play-circle');
  pauseCirc.innerHTML = "<svg viewBox='0 0 24 24' style='width:24px;height:24px;fill:#c9a84c'><rect x='6' y='4' width='4' height='16'/><rect x='14' y='4' width='4' height='16'/></svg>";
  pauseOv.appendChild(pauseCirc); item.appendChild(pauseOv);

  // ---- SCRUBBER ----
  var scrubber = mk('div', 'v-scrubber');
  var track    = mk('div', 'v-scrubber-track');
  var bufBar   = mk('div', 'v-scrubber-buf');
  var fillBar  = mk('div', 'v-scrubber-fill');
  var thumb    = mk('div', 'v-scrubber-thumb');
  track.appendChild(bufBar); track.appendChild(fillBar); track.appendChild(thumb);
  scrubber.appendChild(track); item.appendChild(scrubber);

  var timeDisp = mk('div', 'v-time'); timeDisp.textContent = '0:00 / 0:00'; item.appendChild(timeDisp);

  vid.addEventListener('progress', function () {
    if (vid.buffered.length > 0 && vid.duration)
      bufBar.style.width = (vid.buffered.end(vid.buffered.length - 1) / vid.duration * 100) + '%';
  });
  vid.addEventListener('timeupdate', function () {
    if (vid.duration) {
      var pct = vid.currentTime / vid.duration * 100;
      fillBar.style.width = pct + '%'; thumb.style.left = pct + '%';
      timeDisp.textContent = fmtDur(vid.currentTime) + ' / ' + fmtDur(vid.duration);
    }
  });

  // ---- SCRUB TOUCH ----
  var scrubbing = false; var wasPaused = false;
  function getScrubPct(e) {
    var rect = track.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }
  scrubber.addEventListener('touchstart', function (e) {
    if (!vid.duration) return;
    scrubbing = true; wasPaused = vid.paused; scrubber.classList.add('dragging');
    var pct = getScrubPct(e); fillBar.style.width = (pct * 100) + '%'; thumb.style.left = (pct * 100) + '%';
  }, { passive: true });
  scrubber.addEventListener('touchmove', function (e) {
    if (!scrubbing || !vid.duration) return; e.stopPropagation();
    var pct = getScrubPct(e); vid.currentTime = pct * vid.duration;
    fillBar.style.width = (pct * 100) + '%'; thumb.style.left = (pct * 100) + '%';
  }, { passive: false });
  scrubber.addEventListener('touchend', function () {
    scrubbing = false; scrubber.classList.remove('dragging');
    if (!wasPaused) vid.play().catch(function () { });
  }, { passive: true });

  // ---- MUTE BUTTON ----
  var muteBtn = mk('div', 'v-mute'); muteBtn.textContent = '🔇'; item.appendChild(muteBtn);
  muteBtn.addEventListener('click', function (e) {
    e.stopPropagation(); STATE.audioUnlocked = true; vid.muted = !vid.muted;
    muteBtn.textContent = vid.muted ? '🔇' : '🔊';
    document.querySelectorAll('.v-player').forEach(function (vv) { vv.muted = vid.muted; });
  });

  // ---- TAP / DOUBLE TAP ON VIDEO ----
  var lastTap = 0; var tapTimeout = null;
  vid.addEventListener('click', function (e) {
    e.stopPropagation();
    var now = Date.now();
    if (now - lastTap < 300) {
      clearTimeout(tapTimeout); lastTap = 0;
      if (STATE.user) {
        likeBtn.classList.add('liked');
        STATE.sb.from('likes').insert({ video_id: v.id, user_id: STATE.user.id }).catch(function () { });
        var heart = mk('div'); heart.textContent = '❤️';
        heart.style.cssText = 'position:absolute;font-size:5rem;top:50%;left:50%;z-index:50;pointer-events:none;animation:heartPop .7s ease forwards';
        item.appendChild(heart); setTimeout(function () { try { item.removeChild(heart); } catch (e) { } }, 700);
        showToast('❤️ Харесано!');
      }
      return;
    }
    lastTap = now;
    tapTimeout = setTimeout(function () {
      lastTap = 0;
      if (!STATE.audioUnlocked) {
        STATE.audioUnlocked = true; vid.muted = false; muteBtn.textContent = '🔊';
        document.querySelectorAll('.v-player').forEach(function (vv) { vv.muted = false; }); return;
      }
      if (STATE.isFullscreen) { toggleFullscreen(); return; }
      if (vid.paused) {
        vid.play().catch(function () { vid.muted = true; vid.play().catch(function () { }); });
        playOv.classList.add('show'); setTimeout(function () { playOv.classList.remove('show'); }, 500);
      } else {
        vid.pause();
        pauseOv.classList.add('show'); setTimeout(function () { pauseOv.classList.remove('show'); }, 500);
      }
    }, 300);
  });

  // ---- INTERSECTION OBSERVER ----
  var obs = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      STATE.currentVideoId = v.id;
      if (!vid.src && vid._src) { vid.src = vid._src; vid.load(); }
      vid.preload = 'auto'; vid.muted = !STATE.audioUnlocked; muteBtn.textContent = vid.muted ? '🔇' : '🔊';
      vid.play().catch(function () { vid.muted = true; vid.play().catch(function () { }); });
      startViewTimer(v.id, tags);
      var allItems = document.querySelectorAll('.video-item');
      var myIdx = Array.from(allItems).indexOf(item);
      cleanupVideos(myIdx);
      var nextItem = allItems[myIdx + 1];
      if (nextItem) { var nv2 = nextItem.querySelector('.v-player'); if (nv2 && !nv2.src && nv2._src) { nv2.src = nv2._src; nv2.preload = 'metadata'; } }
    } else {
      vid.pause(); vid.currentTime = 0; stopViewTimer(v.id);
    }
  }, { threshold: 0.5 });
  obs.observe(item); item._obs = obs;

  // ---- PAID LOCK OVERLAY ----
  if (isPaid) {
    var lk = mk('div', 'locked-ov');
    var lb2 = mk('div', 'locked-badge'); lb2.textContent = '💎 ПРЕМИУМ СЪДЪРЖАНИЕ'; lk.appendChild(lb2);
    var lt = mk('div', 'locked-title'); lt.textContent = v.title || 'Ексклузивно видео'; lk.appendChild(lt);
    var lp = mk('div', 'locked-price'); lp.textContent = v.access_level === 'fan' ? '2.50€' : v.access_level === 'studio' ? '5€' : '12€'; lk.appendChild(lp);
    var ls = mk('div', 'locked-sub'); ls.textContent = 'еднократно плащане'; lk.appendChild(ls);
    var lbtns = mk('div', 'locked-btns');
    var lprev = mk('button', 'locked-preview'); lprev.textContent = '▶ Преглед 5s'; lprev.onclick = function () { showToast('Скоро!'); };
    var lunl = mk('button', 'locked-unlock'); lunl.textContent = '💰 Отключи'; lunl.onclick = function () { openModal('m-auth'); };
    lbtns.appendChild(lprev); lbtns.appendChild(lunl); lk.appendChild(lbtns); item.appendChild(lk);
  }

  // ---- INFO ZONE ----
  var info = mk('div', 'v-info-zone');
  var cbar = mk('div', 'v-creator-bar');

  // AVATAR — stopPropagation за да не прихваща video click handler-ът
  var av = mk('div', 'v-avatar');
  if (cAvatar) {
    var ai = document.createElement('img');
    ai.src = cAvatar + '?t=1';
    ai.onerror = function () { av.textContent = '🎬'; try { av.removeChild(ai); } catch (e) { } };
    av.appendChild(ai);
  } else {
    av.textContent = '🎬';
  }
  av.addEventListener('click', function (e) {
    e.stopPropagation();   // ← КЛЮЧОВО: спира видео tap handler-а
    e.preventDefault();
    openCreatorProfile(v.user_id);
  });

  var cinfo = mk('div', 'v-creator-info');

  // CREATOR NAME — също отваря профила
  var cn = mk('div', 'v-creator-name'); cn.textContent = cName;
  cn.style.cursor = 'pointer';
  cn.addEventListener('click', function (e) {
    e.stopPropagation();
    openCreatorProfile(v.user_id);
  });

  var cacts = mk('div', 'v-creator-actions');
  if (!STATE.user || v.user_id !== STATE.user.id) {
    var fb = mk('button', 'v-follow-btn'); var isF = STATE.following[v.user_id] || false;
    fb.textContent = isF ? '✓ Следваш' : 'Следвай'; if (isF) fb.classList.add('following');
    fb.onclick = function (e) { e.stopPropagation(); toggleFollow(v.user_id, fb); };
    cacts.appendChild(fb);
  }
  var sub = mk('button', 'v-sub-btn'); sub.textContent = '💎 Абонирай'; if (isPaid) sub.classList.add('visible');
  sub.onclick = function () { if (!STATE.user) { openModal('m-auth'); return; } showToast('Скоро!'); };
  cacts.appendChild(sub);
  cinfo.appendChild(cn); cinfo.appendChild(cacts); cbar.appendChild(av); cbar.appendChild(cinfo); info.appendChild(cbar);

  // TITLE + DESC
  if (v.title || v.description) {
    var tb = mk('div', 'v-text-block'); var exp = false;
    if (v.title) { var ti = mk('div', 'v-title-text'); ti.textContent = v.title; tb.appendChild(ti); }
    if (v.description) { var descClean = v.description.replace(/#[\wа-яА-ЯёЁ]+/g, '').trim(); if (descClean) { var de = mk('div', 'v-desc-text'); de.textContent = descClean; tb.appendChild(de); } }
    tb.onclick = function () { exp = !exp; tb.querySelectorAll('.v-title-text,.v-desc-text').forEach(function (e) { e.classList.toggle('expanded', exp); }); };
    info.appendChild(tb);
  }

  // TAGS
  if (tags.length > 0) {
    var tagsDiv = mk('div', 'v-tags');
    tags.forEach(function (tag) { var t = mk('span', 'v-tag'); t.textContent = tag; t.onclick = function (e) { e.stopPropagation(); searchByTag(tag); }; tagsDiv.appendChild(t); });
    info.appendChild(tagsDiv);
  }

  // ACTION BAR
  var abar = mk('div', 'v-action-bar');
  var likeBtn = mk('button', 'v-act'); var likeIco = ico('heart', 20); var likeCnt = mk('span'); likeCnt.textContent = '0';
  likeBtn.appendChild(likeIco); likeBtn.appendChild(likeCnt);
  likeBtn.onclick = async function () {
    if (!STATE.user) { showToast('Влез за да харесаш!'); return; }
    var isLiked = likeBtn.classList.contains('liked');
    if (isLiked) { likeBtn.classList.remove('liked'); try { await STATE.sb.from('likes').delete().eq('video_id', v.id).eq('user_id', STATE.user.id); } catch (e) { } }
    else { likeBtn.classList.add('liked'); try { await STATE.sb.from('likes').insert({ video_id: v.id, user_id: STATE.user.id }); sendNotif(v.user_id, 'like', '@' + (STATE.user.name || STATE.user.email.split('@')[0]) + ' хареса "' + v.title + '"', v.id); } catch (e) { likeBtn.classList.remove('liked'); } }
    loadLikeCount(v.id, likeCnt);
  };
  abar.appendChild(likeBtn); loadLikeCount(v.id, likeCnt, likeBtn);

  var cmtBtn = mk('button', 'v-act'); var cmtIco = ico('message-circle', 20); var cmtCnt = mk('span'); cmtCnt.id = 'cc-' + v.id; cmtCnt.textContent = '0';
  cmtBtn.appendChild(cmtIco); cmtBtn.appendChild(cmtCnt); cmtBtn.onclick = function () { openComments(v.id); };
  abar.appendChild(cmtBtn); loadCommentCount(v.id, cmtCnt);

  var saveBtn = mk('button', 'v-act'); saveBtn.appendChild(ico('bookmark', 20));
  saveBtn.onclick = async function () {
    if (!STATE.user) { showToast('Влез за да запазиш!'); return; }
    var isSaved = saveBtn.classList.contains('saved');
    if (isSaved) { saveBtn.classList.remove('saved'); showToast('Премахнато'); try { await STATE.sb.from('saves').delete().eq('video_id', v.id).eq('user_id', STATE.user.id); } catch (e) { } }
    else { saveBtn.classList.add('saved'); showToast('Запазено!'); try { await STATE.sb.from('saves').insert({ video_id: v.id, user_id: STATE.user.id }); } catch (e) { saveBtn.classList.remove('saved'); } }
  };
  abar.appendChild(saveBtn); loadSaveState(v.id, saveBtn);

  var msgBtn = mk('button', 'v-act'); msgBtn.appendChild(ico('message-square', 20));
  msgBtn.onclick = function () {
    if (!STATE.user) { showToast('Влез за да пишеш!'); return; }
    if (!STATE.following[v.user_id]) { showToast('Последвай за да пишеш!'); return; }
    openMessages(v.user_id, cName);
  };
  abar.appendChild(msgBtn);

  var shareBtn = mk('button', 'v-act'); shareBtn.appendChild(ico('share-2', 20));
  shareBtn.onclick = function () {
    if (navigator.share) { navigator.share({ title: v.title, url: v.file_url }); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(v.file_url).then(function () { showToast('🔗 Копирано!'); }); }
    else { showToast('🔗 Копирано!'); }
  };
  abar.appendChild(shareBtn);

  if (isPaid) {
    var unlBtn = mk('button', 'v-act-unlock');
    unlBtn.innerHTML = "<i data-lucide='lock' style='width:16px;height:16px;stroke:#000;stroke-width:2;fill:none'></i><span>Отключи</span>";
    unlBtn.onclick = function () { openModal('m-auth'); };
    abar.appendChild(unlBtn);
  }
  info.appendChild(abar);
  item.appendChild(info);
  return item;
}
