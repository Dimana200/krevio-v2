async function showComments(videoId) {
    // В index.33.html това отваряше секция, тук е логиката за зареждане
    console.log("Зареждане на коментари за видео:", videoId);
    const { data: comments, error } = await _supabase
        .from('comments')
        .select('*, profiles(username)')
        .eq('video_id', videoId);

    if (error) return console.error(error);
    
    // Тук можеш да добавиш логика за показване в модален прозорец или нова секция
    alert("Функцията за коментари е активна за видео: " + videoId);
}

async function likeVideo(videoId) {
    console.log("Харесване на видео:", videoId);
    // Логика за ъпдейт на лайкове в базата данни
    const { data, error } = await _supabase.rpc('increment_likes', { video_id: videoId });
    if (error) console.error("Грешка при лайк:", error.message);
}
