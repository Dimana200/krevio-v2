async function loadMessages(chatId) {
  const { data, error } = await _supabase
    .from('messages')
    .select('*, profiles!messages_from_user_id_fkey(full_name, avatar_url)')
    .or(`and(from_user_id.eq.${STATE.user.id},to_user_id.eq.${chatId}),and(from_user_id.eq.${chatId},to_user_id.eq.${STATE.user.id})`)
    .order('created_at', { ascending: true });

  var list = el('msg-list');
  if (data) {
    list.innerHTML = data.map(m => `
      <div class="msg-bubble ${m.from_user_id === STATE.user.id ? 'sent' : 'received'}">
        <div class="msg-text">${m.content}</div>
        <div class="msg-time">${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
    `).join('');
    list.scrollTop = list.scrollHeight;
  }
}

async function sendDirectMessage(toUserId, content) {
  if (!content.trim() || !STATE.user) return;
  
  const { error } = await _supabase.from('messages').insert([{
    from_user_id: STATE.user.id,
    to_user_id: toUserId,
    content: content.trim()
  }]);

  if (error) showToast('Грешка при изпращане');
}
