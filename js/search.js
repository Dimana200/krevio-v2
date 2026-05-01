function searchByTag(tag) {
  showPage('search');
  var inp = el('search-inp');
  if (inp) { inp.value = tag; inp.dispatchEvent(new Event('input')); }
}

async function renderSearch() {
  var wrap = el('search-list'); if (!wrap || !STATE.sb) return;
  try { var r = await STATE.sb.from('profiles').select('*').limit(20); renderSearchResults(r.data || [], []); } catch (e) { }
  var inp = el('search-inp'); if (!inp) return;
  inp.oninput = async function () {
    var q = this.value.trim();
    if (!q) { try { var r = await STATE.sb.from('profiles').select('*').limit(20); renderSearchResults(r.data || [], []); } catch (e) { } return; }
    try {
      var rp = await STATE.sb.from('profiles').select('*').or('name.ilike.%' + q + '%').limit(10);
      var rv = await STATE.sb.from('videos').select('*').or('title.ilike.%' + q + '%,description.ilike.%' + q + '%').limit(15);
      renderSearchResults(rp.data || [], rv.data || []);
    } catch (e) { }
  };
}

function renderSearchResults(profiles, videos) {
  var wrap = el('search-list'); if (!wrap) return; wrap.innerHTML = ''; var has = false;
  if (profiles && profiles.length > 0) {
    has = true; var lbl = mk('div', 'sec-label'); lbl.textContent = 'Творци'; wrap.appendChild(lbl);
    profiles.forEach(function (c) {
      var row = mk('div', 'creator-row'); var av = mk('div', 'cr-avatar');
      if (c.avatar_url) { var img = document.createElement('img'); img.src = c.avatar_url; av.appendChild(img); } else av.textContent = '👤';
      var inf = mk('div'); inf.style.flex = '1'; var nm = mk('div', 'cr-name'); nm.textContent = c.name || 'Потребител'; inf.appendChild(nm);
      row.appendChild(av); row.appendChild(inf); row.onclick = function () { openCreatorProfile(c.id); }; wrap.appendChild(row);
    });
  }
  if (videos && videos.length > 0) {
    has = true; var lbl2 = mk('div', 'sec-label'); lbl2.textContent = 'Видеа'; wrap.appendChild(lbl2);
    videos.forEach(function (v) {
      var row = mk('div', 'creator-row'); var av = mk('div', 'cr-avatar'); av.textContent = '🎬';
      var inf = mk('div'); inf.style.flex = '1'; var nm = mk('div', 'cr-name'); nm.textContent = v.title; inf.appendChild(nm);
      row.appendChild(av); row.appendChild(inf); row.onclick = function () { openVideoFromGrid(v); }; wrap.appendChild(row);
    });
  }
  if (!has) wrap.innerHTML = "<div style='padding:30px;text-align:center;color:var(--text2)'>Няма резултати</div>";
}
