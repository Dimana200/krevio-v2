function createVideoElement(video) {
    return `
        <div class="video-card">
            <div class="video-header">
                <img src="${video.profiles.avatar_url || 'https://via.placeholder.com/40'}" class="user-avatar">
                <span>${video.profiles.username}</span>
            </div>
            <video src="${video.url}" controls class="video-player"></video>
            <div class="video-actions">
                <button onclick="likeVideo('${video.id}')">❤️</button>
                <button onclick="showComments('${video.id}')">💬</button>
            </div>
        </div>
    `;
}
