function createVideoCard(v) {
  var name = v.profiles ? v.profiles.full_name || 'User' : 'User';
  var avatar = v.profiles && v.profiles.avatar_url ? v.profiles.avatar_url : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + name;
  return `
    <div class="v-card">
      <video src="${v.url}" loop playsinline onclick="this.paused?this.play():this.pause()"></video>
      <div class="v-meta">
        <div class="v-user">
          <img src="${avatar}" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--gold)">
          @${name}
        </div>
        <div class="v-desc">${v.description || ''}</div>
      </div>
      <div class="v-actions">
        <div class="v-act-btn"><i data-lucide="heart"></i><span>${v.likes_count || 0}</span></div>
        <div class="v-act-btn" onclick="showComments('${v.id}')"><i data-lucide="message-circle"></i><span>${v.comments_count || 0}</span></div>
        <div class="v-act-btn"><i data-lucide="share-2"></i></div>
      </div>
    </div>`;
}
