function toggleCreatorMode() {
    const isCreator = document.body.classList.toggle('creator-mode');
    console.log("Creator mode:", isCreator);
    // Допълнителни визуални промени за създатели
}

async function getAnalytics() {
    if (!currentUser) return;
    const { data, error } = await _supabase
        .from('videos')
        .select('likes, views')
        .eq('user_id', currentUser.id);
    
    return data;
}
