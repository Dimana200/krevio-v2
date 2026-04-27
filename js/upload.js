async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = 'Качване...';
    document.body.appendChild(loading);

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        const { data, error: uploadError } = await _supabase.storage
            .from('videos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = _supabase.storage
            .from('videos')
            .getPublicUrl(filePath);

        const { error: dbError } = await _supabase
            .from('videos')
            .insert([{ 
                user_id: currentUser.id, 
                url: publicUrl,
                description: '' 
            }]);

        if (dbError) throw dbError;

        alert('Видеото е качено успешно!');
        showSection('feed');
    } catch (error) {
        alert(error.message);
    } finally {
        loading.remove();
    }
}
