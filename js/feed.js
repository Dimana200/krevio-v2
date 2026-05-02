function resetFeed() {
  STATE.feed.offset = 0;
  STATE.feed.loading = false;
  STATE.feed.hasMore = true;
  STATE.shownVideoIds = [];
}

function cleanupVideos(curIdx) {
  document.querySelectorAll('.video-item').forEach(function(item, idx) {
    var vid = item.querySelector('.v-player'); if (!vid) return;
    if (idx < curIdx - 1 || idx > curIdx + 4) {
      if (vid.src) { vid.pause(); vid._src = vid._src || vid.src; vid.src = ''; vid.load(); }
    } else {
      if (!vid.src && vid._src) { vid.src = vid._src; }
    }
  });
}

async function renderFeed() {
  var wrap = el('feed-wrap'); if (!wrap) return;
  document.querySelectorAll('.video-item').forEach(function(it) {
    if (it._obs) { it._obs.disconnect(); it._obs = null; }
    var vid = it.querySelector('.v-player');
    if (vid) { vid.pause(); vid.src = ''; vid.load(); }
  });
  resetFeed();
  wrap.innerHTML = '';
  await loadMoreVideos();
  var sentinel = mk('div', 'load-more'); sentinel.id = 'sentinel';
  sentinel.appendChild(mk('div', 'load-spinner'));
  wrap.appendChild(sentinel);
  var sObs = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !STATE.feed.loading && STATE.feed.hasMore) loadMoreVideos();
  }, { threshold: 0.1 });
  sObs.observe(sentinel);
  if (window.lucide) window.lucide.createIcons();
}

async function loadMoreVideos() {
  if (STATE.feed.loading || !STATE.feed.hasMore) return;
  STATE.feed.loading = true;
  var wrap = el('feed-wrap'); if (!wrap) { STATE.feed.loading = false; return; }
  var sentinel = el('sentinel');
  var videos = [];

  if (STATE.sb) {
    try {
      if (STATE.currentTab === 'following') {
        var fids = Object.keys(STATE.following).filter(function(k) { return STATE.following[k]; });
        if (fids.length === 0) {
          if (STATE.feed.offset === 0) {
            var e = mk('div', 'empty-state');
            e.innerHTML = '<div class="empty-ico">👥</div><div class="empty-title">Не следваш никого</div>';
            if (sentinel) wrap.insertBefore(e, sentinel); else wrap.appendChild(e);
          }
          STATE.feed.loading = false; STATE.feed.hasMore = false; return;
        }
        var r1 = await STATE.sb.from('videos').select('id,user_id,title,description,file_url,thumbnail_url,views,access_level,created_at').in('user_id', fids).limit(STATE.feed.batchSize + 5);
        videos = (r1.data || []).filter(function(v) { return v.file_url && !STATE.shownVideoIds.includes(v.id); }).sort(function() { return Math.random() - .5; }).slice(0, STATE.feed.batchSize);

      } else if (STATE.currentTab === 'premium') {
        var r2 = await STATE.sb.from('videos').select('id,user_id,title,description,file_url,thumbnail_url,views,access_level,created_at').neq('access_level', 'free').limit(STATE.feed.batchSize + 5);
        videos = (r2.data || []).filter(function(v) { return v.file_url && !STATE.shownVideoIds.includes(v.id); }).sort(function() { return Math.random() - .5; }).slice(0, STATE.feed.batchSize);

      } else {
        var q = STATE.user
          ? await STATE.sb.from('videos').select('id,user_id,title,description,file_url,thumbnail_url,views,access_level,created_at').neq('user_id', STATE.user.id).limit(STATE.feed.batchSize + 5)
          : await STATE.sb.from('videos').select('id,user_id,title,description,file_url,thumbnail_url,views,access_level,created_at').limit(STATE.feed.batchSize + 5);
        videos = (q.data || []).filter(function(v) { return v.file_url && !STATE.shownVideoIds.includes(v.id); }).sort(function() { return Math.random() - .5; }).slice(0, STATE.feed.batchSize);
      }

      if (videos.length < STATE.feed.batchSize) STATE.feed.hasMore = false;
      videos.forEach(function(v) { STATE.shownVideoIds.push(v.id); });

    } catch(e) {
      console.error('loadMoreVideos:', e);
      if (STATE.feed.offset === 0) {
        var errDiv = mk('div', 'empty-state');
        errDiv.innerHTML = '<div class="empty-ico">⚠️</div><div class="empty-title">Грешка при зареждане</div>';
        errDiv.onclick = function() { resetFeed(); wrap.innerHTML = ''; renderFeed(); };
        if (sentinel) wrap.insertBefore(errDiv, sentinel); else wrap.appendChild(errDiv);
      }
      STATE.feed.loading = false; return;
    }
  } else {
    STATE.feed.loading = false; return;
  }

  if (STATE.feed.offset === 0 && videos.length === 0) {
    var es = mk('div', 'empty-state');
    es.innerHTML = '<div class="empty-ico">🎬</div><div class="empty-title">Все още няма видеа</div>';
    if (sentinel) wrap.insertBefore(es, sentinel); else wrap.appendChild(es);
    STATE.feed.loading = false; return;
  }

  // Зареди профили
  var uids = [];
  videos.forEach(function(v) { if (uids.indexOf(v.user_id) === -1) uids.push(v.user_id); });
  await Promise.all(uids.map(function(uid) { return getProfile(uid); }));

  var ads = [
    { company: 'Техномаркет', text: 'Лаптопи от 599 лв!' },
    { company: 'Kaufland BG', text: 'Промоции тази седмица!' },
    { company: 'Виваком',     text: '1Gbps — 25 лв/мес' },
    { company: 'Банка ДСК',   text: 'Кредит до 50,000 лв онлайн' }
  ];

  videos.forEach(function(v, i) {
    var idx = STATE.feed.offset + i;
    var card = buildCard(v, idx);
    if (!card) return;
    if (sentinel) wrap.insertBefore(card, sentinel); else wrap.appendChild(card);
    if (STATE.currentTab === 'trending' && (idx + 1) % 4 === 0) {
      var ad = buildAd(Math.floor(idx / 4) % ads.length, ads);
      if (sentinel) wrap.insertBefore(ad, sentinel); else wrap.appendChild(ad);
    }
  });

  STATE.feed.offset += videos.length;
  if (!STATE.feed.hasMore && sentinel) sentinel.style.display = 'none';
  STATE.feed.loading = false;
  if (window.lucide) window.lucide.createIcons();
}
