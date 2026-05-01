function openVideoFromGrid(v){
  STATE.prevPage=document.querySelector('.page.active')?document.querySelector('.page.active').id.replace('page-',''):null;
  history.pushState({page:'feed',videoId:v.id},'',window.location.pathname);
  showPage('feed',false);
  STATE.currentTab='trending';resetFeed();
  var wrap=el('feed-wrap');
  if(wrap){
    wrap.innerHTML='';
    var card=buildCard(v,0);wrap.appendChild(card);
    var sentinel=mk('div','load-more');sentinel.id='sentinel';sentinel.style.display='none';wrap.appendChild(sentinel);
    if(window.lucide)window.lucide.createIcons();
  }
}

function buildVideoGrid(videos,emptyMsg){
  var grid=mk('div','vgrid');
  if(videos&&videos.length>0){
    videos.forEach(function(v){
      var cell=mk('div','vg-cell');
      if(v.thumbnail_url){var img=document.createElement('img');img.src=v.thumbnail_url;cell.appendChild(img);}
      else{var ve=document.createElement('video');ve.src=v.file_url;ve.preload='metadata';ve.muted=true;ve.playsInline=true;ve.addEventListener('loadedmetadata',function(){ve.currentTime=1;});cell.appendChild(ve);}
      cell.appendChild(mk('div','vg-overlay'));
      var info=mk('div','vg-info');var vw=mk('div','vg-views');vw.textContent='👁 '+fmt(v.views||0);info.appendChild(vw);
      if(v.access_level&&v.access_level!=='free'){var vb=mk('div','vg-badge');vb.textContent='🔒';info.appendChild(vb);}
      cell.appendChild(info);
      cell.onclick=function(){openVideoFromGrid(v);};
      grid.appendChild(cell);
    });
  }else{grid.innerHTML="<div style='grid-column:1/-1;padding:30px;text-align:center;color:var(--text2)'>"+emptyMsg+"</div>";}
  return grid;
}

async function renderProfile(){
  var wrap=el('profile-body');if(!wrap)return;wrap.innerHTML='';
  if(!STATE.user){
    var lm=mk('div');lm.style.cssText='padding:60px 20px;text-align:center';
    lm.innerHTML="<div style='font-size:3rem;margin-bottom:16px'>👤</div><div style='font-size:1rem;font-weight:700;margin-bottom:8px'>Влез в акаунта си</div><div style='font-size:.82rem;color:var(--text2);margin-bottom:20px'>За да видиш профила си</div>";
    var lb2=mk('button','btn-gold');lb2.style.cssText='width:auto;padding:12px 32px;margin:0 auto;display:block';lb2.textContent='Вход / Регистрация';lb2.onclick=function(){openModal('m-auth');};
    lm.appendChild(lb2);wrap.appendChild(lm);if(window.lucide)window.lucide.createIcons();return;
  }
  var banner=mk('div','p-banner');banner.appendChild(mk('div','p-banner-gradient'));wrap.appendChild(banner);
  var hero=mk('div','p-hero');
  var avW=mk('div','p-avatar-wrap');
  if(STATE.user.avatar){var ai=document.createElement('img');ai.src=STATE.user.avatar;avW.appendChild(ai);}else avW.textContent='👤';
  var avE=mk('div','p-avatar-edit');avE.textContent='✏️ Смени';avW.appendChild(avE);
  avW.onclick=function(){var inp=el('upl-avatar-inp');if(inp)inp.click();};
  if(!el('upl-avatar-inp')){
    var ai2=document.createElement('input');ai2.type='file';ai2.accept='image/*';ai2.id='upl-avatar-inp';ai2.style.display='none';
    ai2.onchange=async function(){
      if(!this.files||!this.files[0])return;showToast('Качване...');
      var file=this.files[0];var ext=file.name.split('.').pop();var path='avatars/'+STATE.user.id+'.'+ext;
      try{
        var up=await STATE.sb.storage.from('avatars').upload(path,file,{upsert:true,cacheControl:'0'});
        if(up.error)throw up.error;
        var url=STATE.sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
        await STATE.sb.from('profiles').update({avatar_url:url}).eq('id',STATE.user.id);
        STATE.user.avatar=url+'?t='+Date.now();showToast('✅ Снимката е сменена!');renderProfile();
      }catch(e){showToast('Грешка: '+e.message);}
    };
    document.body.appendChild(ai2);
  }
  var nm=mk('div','p-name');nm.textContent=STATE.user.name||STATE.user.email.split('@')[0];
  var hd=mk('div','p-handle');hd.textContent='@'+(STATE.user.name||STATE.user.email.split('@')[0]).toLowerCase().replace(/\s+/g,'_');
  var bio=mk('p','p-bio');bio.textContent=STATE.user.bio||'Добави биография';
  var stats=mk('div','p-stats');var vc=0,fc=0,foc=0;
  if(STATE.sb){
    try{var vr=await STATE.sb.from('videos').select('id',{count:'exact'}).eq('user_id',STATE.user.id);vc=vr.count||0;}catch(e){}
    try{var fr=await STATE.sb.from('follows').select('id',{count:'exact'}).eq('following_id',STATE.user.id);fc=fr.count||0;}catch(e){}
    try{var fo=await STATE.sb.from('follows').select('id',{count:'exact'}).eq('follower_id',STATE.user.id);foc=fo.count||0;}catch(e){}
  }
  [{n:vc,l:'Видеа'},{n:fc,l:'Фена'},{n:foc,l:'Следва'}].forEach(function(s){
    var st=mk('div');var sn=mk('div','pst-n');sn.textContent=s.n;var sl=mk('div','pst-l');sl.textContent=s.l;st.appendChild(sn);st.appendChild(sl);stats.appendChild(st);
  });
  var btns=mk('div','p-action-btns');
  var eb=mk('button','p-edit-btn');eb.textContent='✏️ Редактирай';eb.onclick=function(){var en=el('edit-name');var ebi=el('edit-bio');if(en)en.value=STATE.user.name||'';if(ebi)ebi.value=STATE.user.bio||'';openModal('m-edit-profile');};
  var cb=mk('button','p-creator-btn');cb.textContent='🎬 Creator Панел';cb.onclick=function(){showPage('creator');};
  btns.appendChild(eb);btns.appendChild(cb);
  hero.appendChild(avW);hero.appendChild(nm);hero.appendChild(hd);hero.appendChild(stats);hero.appendChild(bio);hero.appendChild(btns);wrap.appendChild(hero);
  var tabs=mk('div','p-tabs');var tabBtns=[];var grids=[];
  ['📹 Видеа','❤️ Харесани','🔖 Запазени','💎 Премиум'].forEach(function(t,idx){
    var tb=mk('button','p-tab'+(idx===0?' active':''));tb.textContent=t;tabs.appendChild(tb);tabBtns.push(tb);
  });
  wrap.appendChild(tabs);
  var myVids=[];if(STATE.sb){try{var mv=await STATE.sb.from('videos').select('*').eq('user_id',STATE.user.id).order('created_at',{ascending:false}).limit(12);myVids=mv.data||[];}catch(e){}}
  var likedVids=[];if(STATE.sb){try{var lv=await STATE.sb.from('likes').select('video_id').eq('user_id',STATE.user.id);var lids=(lv.data||[]).map(function(l){return l.video_id;});if(lids.length){var lvv=await STATE.sb.from('videos').select('*').in('id',lids);likedVids=lvv.data||[];}}catch(e){}}
  var savedVids=[];if(STATE.sb){try{var sv=await STATE.sb.from('saves').select('video_id').eq('user_id',STATE.user.id);var sids=(sv.data||[]).map(function(s){return s.video_id;});if(sids.length){var svv=await STATE.sb.from('videos').select('*').in('id',sids);savedVids=svv.data||[];}}catch(e){}}
  var premVids=myVids.filter(function(v){return v.access_level&&v.access_level!=='free';});
  [myVids,likedVids,savedVids,premVids].forEach(function(vids,idx){
    var msgs=['Все още нямаш видеа','Не си харесал видеа','Нямаш запазени','Нямаш премиум съдържание'];
    var g=buildVideoGrid(vids,msgs[idx]);g.style.display=idx===0?'grid':'none';wrap.appendChild(g);grids.push(g);
  });
  tabBtns.forEach(function(tb,idx){tb.onclick=function(){tabBtns.forEach(function(t){t.classList.remove('active');});tb.classList.add('active');grids.forEach(function(g,gi){g.style.display=gi===idx?'grid':'none';});};});
  if(window.lucide)window.lucide.createIcons();
}
