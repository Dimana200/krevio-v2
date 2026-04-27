function createVideoCard(video) {
    return `
        <div class="video-card">
            <div class="video-header">
                <img src="${video.profiles?.avatar_url || 'https://via.placeholder.com/40'}" class="user-avatar">
                <span class="username">${video.profiles?.username || 'Потребител'}</span>
            </div>
            <div class="video-container">
                <video src="${video.url}" loop onclick="togglePlay(this)"></video>
            </div>
            <div class="video-actions">
                <div class="action-item" onclick="likeVideo('${video.id}')">
                    <i class="fas fa-heart"></i>
                    <span>${video.likes || 0}</span>
                </div>
                <div class="action-item" onclick="showComments('${video.id}')">
                    <i class="fas fa-comment"></i>
                    <span>${video.comments_count || 0}</span>
                </div>
                <div class="action-item">
                    <i class="fas fa-share"></i>
                </div>
            </div>
        </div>
    `;
}

function togglePlay(video) {
    if (video.paused) {
        document.querySelectorAll('video').forEach(v => v.pause());
        video.play();
    } else {
        video.pause();
    }
}
