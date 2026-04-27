async function handleUpload() {
  var fileInp = el('upl-inp');
  if (!fileInp.files[0] || !STATE.user) return;
  var file = fileInp.files[0];
  var title = el('upl-title').value;
  var desc = el('upl-desc').value;

  el('upl-act').style.display = 'none';
  el('upl-prog').style.display = 'block';

  var fName = Date.now() + '_' + file.name;
  var { data, error } = await _supabase.storage.from('videos').upload(STATE.user.id + '/' + fName, file);

  if (error) { showToast('Грешка при качване'); return; }

  var { data: urlData } = _supabase.storage.from('videos').getPublicUrl(STATE.user.id + '/' + fName);
  
  await _supabase.from('videos').insert([{
    user_id: STATE.user.id,
    url: urlData.publicUrl,
    title: title,
    description: desc
  }]);

  el('upl-prog').style.display = 'none';
  el('upl-suc').style.display = 'block';
  setTimeout(() => { closeModal('m-upload'); window.location.reload(); }, 2000);
}
