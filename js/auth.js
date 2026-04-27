async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (user) {
        currentUser = user;
        showMainApp();
    } else {
        showAuth();
    }
}

async function signUp(email, password, username) {
    const { data, error } = await _supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);
    const { error: profileError } = await _supabase.from('profiles').insert([{ id: data.user.id, username }]);
    if (profileError) alert(profileError.message);
    else alert('Регистрацията е успешна!');
}

async function signIn(email, password) {
    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else checkUser();
}

async function signOut() {
    await _supabase.auth.signOut();
    location.reload();
}
