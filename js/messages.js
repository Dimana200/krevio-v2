async function loadMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;
    
    container.innerHTML = '<div class="empty-state">Нямате нови съобщения</div>';
    
    const { data: messages, error } = await _supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
        
    if (messages && messages.length > 0) {
        // Логика за рендериране на съобщенията
    }
}
