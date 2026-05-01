async function openComments(videoId) {
  STATE.currentVideoId = videoId;
  var list = el('cmt-list'); if (!list) return;
  list.innerHTML = "<div style='text-align:center;padding:20px;color:var(--text2)'>Зарежда...</div>";
  openModal('m-comments'); await loadComments(videoId);
}

async function loadComments(videoId) {
  var list = el('cmt-list'); if (!list || !STATE.sb) return;
  try {
    var r = await STATE.sb.from('comments').select('*').eq('video_id', videoId).order('created_at', { ascending: true }).limit(50);
    list.innerHTML = '';
    if (!r.data || r.data.length === 0) { list.innerHTML = "<div style='text-align:center;padding:20px;color:var(--text2)'>Няма коментари. Бъди първи!</div>"; return; }
    r.data.forEach(function (c) {
      var item = mk('div', 'cmt-item'); var av = mk('div', 'cmt-av'); av.textContent = '👤';
      var body = mk('div');
      var nm = mk('div', 'cmt-name'); nm.textContent = c.username || 'Потребител';
      var tx = mk('div', 'cmt-text'); tx.textContent = c.text;
      var tm = mk('div', 'cmt-time'); tm.textContent = fmtTime(c.created_at) + ' назад';
      body.appendChild(nm); body.appendChild(tx); body.appendChild(tm);
      item.appendChild(av); item.appendChild(body); list.appendChild(item);
    });
    var cnt = el('cc-' + videoId); if (cnt) cnt.textContent = r.data.length;
  } catch (e) { list.innerHTML = "<div style='text-align:center;padding:20px;color:var(--text2)'>Грешка</div>"; }
}

async function sendComment() {
  var inp = el('cmt-inp'); if (!inp || !inp.value.trim()) return;
  if (!STATE.user) { showToast('Влез за да коментираш!'); return; }
  if (!STATE.sb || !STATE.currentVideoId) return;
  var text = inp.value.trim(); inp.value = '';
  try {
    await STATE.sb.from('comments').insert({ video_id: STATE.currentVideoId, user_id: STATE.user.id, username: STATE.user.name || STATE.user.email.split('@')[0], text: text });
    await loadComments(STATE.currentVideoId);
    try { var vr = await STATE.sb.from('videos').select('user_id,title').eq('id', STATE.currentVideoId).single(); if (vr.data) sendNotif(vr.data.user_id, 'comment', '@' + (STATE.user.name || STATE.user.email.split('@')[0]) + ' коментира "' + vr.data.title + '"', STATE.currentVideoId); } catch (e) { }
  } catch (e) { showToast('Грешка!'); }
}
