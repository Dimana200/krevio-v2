async function sendNotif(toUserId,type,text,videoId){
  if(!STATE.sb||!STATE.user||toUserId===STATE.user.id)return;
  try{await STATE.sb.from('notifications').insert({user_id:toUserId,from_user_id:STATE.user.id,type:type,text:text,video_id:videoId||null,read:false});}catch(e){}
}

function subscribeNotifs(){
  if(!STATE.sb||!STATE.user)return;
  if(STATE.notifSubscription){STATE.notifSubscription.unsubscribe();STATE.notifSubscription=null;}
  STATE.notifSubscription=STATE.sb.channel('notifs-'+STATE.user.id)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+STATE.user.id},function(payload){
      updateNotifBadge();showToast('🔔 '+payload.new.text);
    }).subscribe();
}

async function updateNotifBadge(){
  var badge=el('inbox-badge');if(!badge)return;
  if(!STATE.sb||!STATE.user){badge.classList.remove('show');return;}
  try{
    var r=await STATE.sb.from('notifications').select('id',{count:'exact'}).eq('user_id',STATE.user.id).eq('read',false);
    var cnt=r.count||0;badge.textContent=cnt;
    if(cnt>0)badge.classList.add('show');else badge.classList.remove('show');
  }catch(e){}
}

async function markNotifsRead(){
  if(!STATE.sb||!STATE.user)return;
  try{await STATE.sb.from('notifications').update({read:true}).eq('user_id',STATE.user.id).eq('read',false);}catch(e){}
  var badge=el('inbox-badge');if(badge)badge.classList.remove('show');
}

async function renderInbox(){
  var wrap=el('inbox-list');if(!wrap)return;
  wrap.innerHTML="<div style='padding:20px;text-align:center;color:var(--text2)'>Зарежда...</div>";
  if(!STATE.sb||!STATE.user){wrap.innerHTML="<div style='padding:40px;text-align:center;color:var(--text2)'>Влез за да видиш известията</div>";return;}
  try{
    var r=await STATE.sb.from('notifications').select('*').eq('user_id',STATE.user.id).order('created_at',{ascending:false}).limit(50);
    wrap.innerHTML='';var data=r.data||[];
    if(data.length===0){wrap.innerHTML="<div style='padding:40px;text-align:center;color:var(--text2)'>Нямаш известия все още</div>";return;}
    data.forEach(function(n){
      var item=mk('div','notif-item'+(n.read?'':' unread'));
      var icons={like:'❤️',comment:'💬',follow:'👤',message:'📩',purchase:'💎'};
      var av=mk('div','notif-av');av.textContent=icons[n.type]||'🔔';
      var txt=mk('div','notif-txt');txt.textContent=n.text;
      var time=mk('div','notif-time');time.textContent=fmtTime(n.created_at)+' назад';
      item.appendChild(av);item.appendChild(txt);item.appendChild(time);
      if(!n.read){var dot=mk('div','notif-dot');item.appendChild(dot);}
      item.onclick=async function(){
        try{await STATE.sb.from('notifications').update({read:true}).eq('id',n.id);}catch(e){}
        item.classList.remove('unread');var dot2=item.querySelector('.notif-dot');if(dot2)dot2.remove();
        if(n.type==='follow'&&n.from_user_id){openCreatorProfile(n.from_user_id);}
        else if(n.type==='message'&&n.from_user_id){var profile=await getProfile(n.from_user_id);openMessages(n.from_user_id,profile?(profile.name||'Потребител'):'Потребител');}
        else if((n.type==='like'||n.type==='comment')&&n.video_id){openComments(n.video_id);}
        else if(n.type==='purchase'&&n.from_user_id){openCreatorProfile(n.from_user_id);}
      };
      wrap.appendChild(item);
    });
  }catch(e){wrap.innerHTML="<div style='padding:20px;text-align:center;color:var(--text2)'>Грешка при зареждане</div>";}
}
