function openUpload() { if (!STATE.user) { openModal('m-auth'); return; } resetUpload(); openModal('m-upload'); }

function bindUpload() {
  var dz = el('upl-dz'), inp = el('upl-inp');
  if (dz && inp) {
    dz.onclick = function () { inp.click(); };
    inp.onchange = function () { if (this.files && this.files[0]) setFile(this.files[0]); };
    dz.ondragover = function (e) { e.preventDefault(); dz.classList.add('over'); };
    dz.ondragleave = function () { dz.classList.remove('over'); };
    dz.ondrop = function (e) { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); };
  }
  var rm = el('upl-fi-rm'); if (rm) rm.onclick = resetUpload;
  var go = el('upl-go-btn'); if (go) go.onclick = startUpload;
  var cancel = el('upl-cancel-btn'); if (cancel) cancel.onclick = function () { closeModal('m-upload'); resetUpload(); };
}

function setFile(f) {
  STATE.uploadFile = f;
  var dz = el('upl-dz'); if (dz) dz.style.display = 'none';
  var fi = el('upl-fi'); if (fi) fi.style.display = 'flex';
  var fn = el('upl-fi-name'); if (fn) fn.textContent = f.name;
  var fs = el('upl-fi-size'); if (fs) fs.textContent = fmtBytes(f.size);
}

function resetUpload() {
  STATE.uploadFile = null; STATE.uploadAccess = 'free';
  var inp = el('upl-inp'); if (inp) inp.value = '';
  var dz = el('upl-dz'); if (dz) dz.style.display = 'block';
  var fi = el('upl-fi'); if (fi) fi.style.display = 'none';
  var prog = el('upl-prog'); if (prog) prog.style.display = 'none';
  var suc = el('upl-suc'); if (suc) suc.style.display = 'none';
  var act = el('upl-act'); if (act) act.style.display = 'block';
  var bar = el('upl-bar'); if (bar) bar.style.width = '0';
  var ti = el('upl-title'); if (ti) ti.value = '';
  var de = el('upl-desc'); if (de) de.value = '';
  document.querySelectorAll('.mono-opt').forEach(function (o, i) { o.classList.toggle('selected', i === 0); });
}

async function startUpload() {
  if (!STATE.uploadFile) { showToast('Избери видео!'); return; }
  var ti = el('upl-title'); if (!ti || !ti.value.trim()) { showToast('Въведи заглавие!'); return; }
  var token = ''; try { var s = await STATE.sb.auth.getSession(); if (s.data && s.data.session) token = s.data.session.access_token; } catch (e) { }
  if (!token) { showToast('Влез в акаунта!'); return; }
  var act = el('upl-act'); var prog = el('upl-prog');
  if (act) act.style.display = 'none'; if (prog) prog.style.display = 'block';
  var b = el('upl-bar'); var pc = el('upl-pct');
  if (b) b.style.width = '10%'; if (pc) pc.textContent = 'Изпращане...';
  try {
    var amap = { free: 'free', paid: 'fan', subscribers: 'studio' };
    var de = el('upl-desc');
    var formData = new FormData();
    formData.append('video', STATE.uploadFile, STATE.uploadFile.name);
    formData.append('title', ti.value.trim());
    formData.append('description', de ? de.value : '');
    formData.append('access', amap[STATE.uploadAccess] || 'free');
    formData.append('token', token);
    if (b) b.style.width = '30%'; if (pc) pc.textContent = 'Качване...';
    var resp = await fetch(CONFIG.BACKEND + '/upload', { method: 'POST', body: formData });
    if (b) b.style.width = '90%';
    if (resp.ok) {
      if (prog) prog.style.display = 'none';
      var suc = el('upl-suc'); if (suc) suc.style.display = 'block';
      showToast('✅ Качено успешно!');
      setTimeout(function () { closeModal('m-upload'); resetUpload(); renderFeed(); }, 2000);
    } else {
      if (act) act.style.display = 'block'; if (prog) prog.style.display = 'none';
      showToast('❌ Грешка: ' + resp.status);
    }
  } catch (err) {
    if (act) act.style.display = 'block'; if (prog) prog.style.display = 'none';
    showToast('❌ ' + err.message);
  }
}
