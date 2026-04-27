async function searchVideos(query) {
    const { data } = await _supabase.from('videos').select('*').ilike('title', `%${query}%`);
    // Логика за показване на резултати
}
