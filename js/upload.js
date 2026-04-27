async function uploadVideo(file) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await _supabase.storage.from('videos').upload(fileName, file);
    if (error) return alert('Грешка при качване');
    
    const { data: { publicUrl } } = _supabase.storage.from('videos').getPublicUrl(fileName);
    await _supabase.from('videos').insert([{ user_id: currentUser.id, url: publicUrl }]);
    alert('Видеото е качено!');
}
