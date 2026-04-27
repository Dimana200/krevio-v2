async function loadNotifications() {
    const { data: notes } = await _supabase.from('notifications').select('*').eq('user_id', currentUser.id);
    // Логика за показване на известия
}
