async function sendComment() {
  var inp = el('cmt-inp');
  if(!inp.value.trim() || !STATE.user) return;
  await _supabase.from('comments').insert([{
    video_id: STATE.currentCmtVid,
    user_id: STATE.user.id,
    content: inp.value.trim()
  }]);
  inp.value = '';
  showComments(STATE.currentCmtVid);
}
