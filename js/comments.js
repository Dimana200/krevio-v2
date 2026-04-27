async function showComments(videoId) {
  STATE.currentCmtVid = videoId;
  showModal('m-comments');
  var list = el('cmt-list');
  list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3)">Зареждане...</div>';
  
  var { data, error } = await _supabase
    .from('comments')
    .select('*, profiles(full_name, avatar_url)')
    .eq('video_id', videoId)
    .order('created_at', { ascending: true });

  if (error) {
    list.innerHTML = '<div style="padding:20px;color:var(--gold)">Грешка при зареждане</div>';
    return;
  }

  if (data.length === 0) {
    list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3)">Все още няма коментари.<br>Бъди първият!</div>';
  } else {
    list.innerHTML = data.map(c => `
      <div class="cmt-item" style="display:flex;gap:12px;margin-bottom:16px;padding:0 16px">
        <img src="${c.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+c.user_id}" style="width:32px;height:32px;border-radius:50%">
        <div style="flex:1">
          <div style="font-size:.75rem;font-weight:700;color:var(--text2);margin-bottom:2px">${c.profiles?.full_name || 'Потребител'}</div>
          <div style="font-size:.85rem;color:var(--text);line-height:1.4">${c.content}</div>
        </div>
      </div>
    `).join('');
  }
}

async function sendComment() {
  var inp = el('cmt-inp');
  if (!inp || !inp.value.trim() || !STATE.user) return;
  
  var text = inp.value.trim();
  inp.value = '';
  
  const { error } = await _supabase.from('comments').insert([{
    video_id: STATE.currentCmtVid,
    user_id: STATE.user.id,
    content: text
  }]);

  if (error) {
    showToast('Грешка при изпращане');
  } else {
    showComments(STATE.currentCmtVid);
  }
}
