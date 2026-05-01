async function getProfile(uid){
  if(STATE.profileCache[uid])return STATE.profileCache[uid];
  if(!STATE.sb)return null;
  try{
    var r=await STATE.sb.from('profiles').select('*').eq('id',uid).single();
    if(r.data){
      if(STATE.profileCacheKeys.length>=CONFIG.CACHE_LIMIT){delete STATE.profileCache[STATE.profileCacheKeys.shift()];}
      STATE.profileCache[uid]=r.data;STATE.profileCacheKeys.push(uid);return r.data;
    }
  }catch(e){}
  return null;
}

async function toggleFollow(toId,btn){
  if(!STATE.user){openModal('m-auth');return;}
  if(STATE.user.id===toId){showToast('Не можеш да следваш себе си!');return;}
  var isF=STATE.following[toId]||false;
  try{
    if(isF){
      await STATE.sb.from('follows').delete().eq('follower_id',STATE.user.id).eq('following_id',toId);
      STATE.following[toId]=false;if(btn){btn.textContent='Следвай';btn.classList.remove('following');}showToast('Спря да следваш');
    }else{
      await STATE.sb.from('follows').insert({follower_id:STATE.user.id,following_id:toId});
      STATE.following[toId]=true;if(btn){btn.textContent='✓ Следваш';btn.classList.add('following');}showToast('Следваш! 💬');
      sendNotif(toId,'follow','@'+(STATE.user.name||STATE.user.email.split('@')[0])+' те последва',null);
    }
  }catch(e){showToast('Грешка!');}
}

async function loadFollowing(){
  if(!STATE.sb||!STATE.user)return;
  try{var r=await STATE.sb.from('follows').select('following_id').eq('follower_id',STATE.user.id);if(r.data)r.data.forEach(function(f){STATE.following[f.following_id]=true;});}catch(e){}
}

async function openCreatorProfile(userId){
  if(STATE.user&&userId===STATE.user.id){showPage('profile');return;}
  var modal=el('creator-profile-modal'),body=el('creator-profile-body'),titleEl=el('creator-profile-title');
  if(!modal||!body)return;
  body.innerHTML="<div style='padding:40px;text-align:center;color:var(--text2)'>Зарежда...</div>";
  modal.classList.add('open');if(window.lucide)window.lucide.createIcons();
  var profile=await getProfile(userId);
  if(!profile){body.innerHTML="<div style='padding:40px;text-align:center;color:var(--text2)'>Профилът не е намерен</div>";return;}
  if(titleEl)titleEl.textContent=(profile.name||'ПРОФИЛ').toUpperCase();
  var videos=[];try{var rv=await STATE.sb.from('videos').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(12);videos=rv.data||[];}catch(e){}
  var followersCount=0;try{var rf=await STATE.sb.from('follows').select('id',{count:'exact'}).eq('following_id',userId);followersCount=rf.count||0;}catch(e){}
  var isF=STATE.following[userId]||false;
  body.innerHTML='';
  var banner=mk('div','p-banner');banner.appendChild(mk('div','p-banner-gradient'));body.appendChild(banner);
  var hero=mk('div','p-hero');
  var avW=mk('div','p-avatar-wrap');avW.style.cursor='default';
  if(profile.avatar_url){var ai=document.createElement('img');ai.src=profile.avatar_url+'?t='+Date.now();avW.appendChild(ai);}else avW.textContent='👤';
  var nm=mk('div','p-name');nm.textContent=profile.name||'Потребител';
  var hd=mk('div','p-handle');hd.textContent='@'+(profile.name||'user').toLowerCase().replace(/\s+/g,'_');
  var stats=mk('div','p-stats');
  [{n:videos.length,l:'Видеа'},{n:followersCount,l:'Фена'}].forEach(function(s){var st=mk('div');var sn=mk('div','pst-n');sn.textContent=s.n;var sl=mk('div','pst-l');sl.textContent=s.l;st.appendChild(sn);st.appendChild(sl);stats.appendChild(st);});
  var btns=mk('div','p-action-btns');
  var fb=mk('button','p-edit-btn');fb.textContent=isF?'✓ Следваш':'Следвай';if(isF)fb.classList.add('following');fb.onclick=function(){toggleFollow(userId,fb);};
  var sb2=mk('button','p-creator-btn');sb2.textContent='Абонирай';sb2.onclick=function(){showToast('Скоро!');};
  btns.appendChild(fb);btns.appendChild(sb2);
  hero.appendChild(avW);hero.appendChild(nm);hero.appendChild(hd);hero.appendChild(stats);
  if(profile.bio){var bio=mk('p','p-bio');bio.textContent=profile.bio;hero.appendChild(bio);}
  hero.appendChild(btns);body.appendChild(hero);
  var lbl=mk('div','sec-label');lbl.textContent='Видеа';body.appendChild(lbl);
  body.appendChild(buildVideoGrid(videos,'Все още няма видеа'));
  if(window.lucide)window.lucide.createIcons();
}

async function loadCreatorPanel(){
  if(!STATE.user||!STATE.sb)return;
  try{
    var rv=await STATE.sb.from('videos').select('*').eq('user_id',STATE.user.id).order('created_at',{ascending:false});var videos=rv.data||[];
    var tv=el('cp-val-views');if(tv)tv.textContent=fmt(videos.reduce(function(a,v){return a+(v.views||0);},0));
    var tvid=el('cp-val-videos');if(tvid)tvid.textContent=videos.length;
    var rf=await STATE.sb.from('follows').select('id',{count:'exact'}).eq('following_id',STATE.user.id);var tf=el('cp-val-followers');if(tf)tf.textContent=fmt(rf.count||0);
    if(videos.length>0){var rl=await STATE.sb.from('likes').select('id',{count:'exact'}).in('video_id',videos.map(function(v){return v.id;}));var tl=el('cp-val-likes');if(tl)tl.textContent=fmt(rl.count||0);}
    if(videos.length>0){var best=videos.reduce(function(a,b){return(b.views||0)>(a.views||0)?b:a;});var be=el('cp-best-video');if(be)be.innerHTML="<div style='font-weight:700;color:var(--text);margin-bottom:4px'>"+best.title+"</div><div style='font-size:.75rem;color:var(--text2)'>👁 "+fmt(best.views||0)+" гледания</div>";}
    var list=el('cp-videos-list');if(!list)return;list.innerHTML='';
    if(videos.length===0){list.innerHTML="<div style='color:var(--text2);font-size:.83rem;text-align:center;padding:20px'>Все още нямаш видеа</div>";return;}
    videos.forEach(function(v){
      var row=mk('div','cp-video-row');
      var thumb=mk('div','cp-video-thumb');
      if(v.thumbnail_url){var ti2=document.createElement('img');ti2.src=v.thumbnail_url;thumb.appendChild(ti2);}
      else{var ve=document.createElement('video');ve.src=v.file_url;ve.preload='metadata';ve.muted=true;ve.addEventListener('loadedmetadata',function(){ve.currentTime=1;});thumb.appendChild(ve);}
      var inf=mk('div','cp-video-info');var ti=mk('div','cp-video-title');ti.textContent=v.title||'Без заглавие';var me=mk('div','cp-video-meta');me.textContent='👁 '+fmt(v.views||0);
      var acts=mk('div','cp-video-actions');var db=mk('button','cp-vid-btn');db.textContent='🗑 Изтрий';
      db.onclick=async function(e){e.stopPropagation();if(confirm('Изтрий?')){try{await STATE.sb.from('videos').delete().eq('id',v.id);loadCreatorPanel();showToast('Изтрито!');}catch(e){showToast('Грешка!');}}}; 
      acts.appendChild(db);inf.appendChild(ti);inf.appendChild(me);inf.appendChild(acts);
      var badge=mk('div','cp-video-badge '+(v.access_level==='free'?'free':'paid'));badge.textContent=v.access_level==='free'?'Безплатно':'Премиум';
      row.appendChild(thumb);row.appendChild(inf);row.appendChild(badge);
      row.onclick=function(){openVideoFromGrid(v);};
      list.appendChild(row);
    });
  }catch(e){console.error('loadCreatorPanel:',e);}
}
