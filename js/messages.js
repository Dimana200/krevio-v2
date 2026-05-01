async function openMessages(toUserId, toName) {
  STATE.currentMsgUserId = toUserId;
  var titleEl = el('msg-title'); if (titleEl) titleEl.textContent = '💬 ' + toName;
  var list = el('msg-list'); if (list) list.innerHTML = "<div style='padding:20px;text-align:center;color:var(--text2)'>Зарежда...</div>";
  openModal('m-msg'); await loadMessages(toUserId); subscribeMsgs(toUserId);
}

async function loadMessages(toUserId) {
  var list = el('msg-list'); if (!list || !STATE.sb || !STATE.user) return;
  try {
    var r = await STATE.sb.from('messages').select('*').or('from_user_id.eq.' + STATE.user.id + ',to_user_id.eq.' + STATE.user.id).order('created_at', { ascending: true }).limit(100);
    var msgs = (r.data || []).filter(function (m) { return (m.from_user_id === STATE.user.id && m.to_user_id === toUserId) || (m.from_user_id === toUserId && m.to_user_id === STATE.user.id); });
    list.innerHTML = '';
    if (msgs.length === 0) { list.innerHTML = "<div style='padding:20px;text-align:center;color:var(--text2)'>Кажи здравей! 👋</div>"; return; }
    msgs.forEach(function (m) { appendMsg(m, false); }); list.scrollTop = list.scrollHeight;
    try { await STATE.sb.from('messages').update({ read: true }).eq('to_user_id', STATE.user.id).eq('from_user_id', toUserId); } catch (e) { }
  } catch (e) { list.innerHTML = "<div style='padding:20px;text-align:center;color:var(--text2)'>Грешка</div>"; }
}

function appendMsg(msg, scroll) {
  var list = el('msg-list'); if (!list || !STATE.user) return;
  var empty = list.querySelector('div[style*="text-align:center"]'); if (empty) empty.remove();
  var isMine = msg.from_user_id === STATE.user.id;
  var wrap = mk('div', 'msg-wrap ' + (isMine ? 'mine' : 'theirs'));
  var bubble = mk('div', 'msg-bubble ' + (isMine ? 'mine' : 'theirs')); bubble.textContent = msg.text;
  var time = mk('div', 'msg-time'); time.textContent = msg.created_at ? fmtTime(msg.created_at) + ' назад' : 'Сега';
  wrap.appendChild(bubble); wrap.appendChild(time); list.appendChild(wrap);
  if (scroll !== false) list.scrollTop = list.scrollHeight;
}

function subscribeMsgs(toUserId) {
  if (STATE.msgSubscription) { STATE.msgSubscription.unsubscribe(); STATE.msgSubscription = null; }
  if (!STATE.sb || !STATE.user) return;
  STATE.msgSubscription = STATE.sb.channel('msgs-' + STATE.user.id)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'to_user_id=eq.' + STATE.user.id }, function (payload) {
      var msg = payload.new;
      if (msg.from_user_id === toUserId) { appendMsg(msg, true); }
      else { updateNotifBadge(); showToast('💬 Ново съобщение!'); }
    }).subscribe();
}

async function sendMsg(text) {
  if (!STATE.sb || !STATE.user || !STATE.currentMsgUserId) return false;
  try {
    await STATE.sb.from('messages').insert({ from_user_id: STATE.user.id, to_user_id: STATE.currentMsgUserId, text: text, read: false });
    sendNotif(STATE.currentMsgUserId, 'message', '@' + (STATE.user.name || STATE.user.email.split('@')[0]) + ' ти прати съобщение', null);
    return true;
  } catch (e) { return false; }
}
