async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (user) {
        currentUser = user;
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        loadFeed();
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }
}

async function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isSignUp = document.getElementById('auth-title').innerText === 'Регистрация';

    try {
        if (isSignUp) {
            const username = document.getElementById('username').value;
            const { data, error } = await _supabase.auth.signUp({ 
                email, 
                password,
                options: { data: { username: username } }
            });
            if (error) throw error;
            
            const { error: profileError } = await _supabase
                .from('profiles')
                .insert([
                    { 
                        id: data.user.id, 
                        username: username,
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
                    }
                ]);
            if (profileError) throw profileError;
            alert('Регистрацията е успешна! Моля, потвърдете имейла си.');
        } else {
            const { error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        }
        checkUser();
    } catch (error) {
        alert(error.message);
    }
}

function toggleAuth() {
    const title = document.getElementById('auth-title');
    const userField = document.getElementById('username-field');
    const btn = document.querySelector('.auth-btn');
    const toggleText = document.querySelector('.auth-toggle');

    if (title.innerText === 'Вход') {
        title.innerText = 'Регистрация';
        userField.style.display = 'block';
        btn.innerText = 'Регистрирай се';
        toggleText.innerText = 'Вече имаш профил? Влез';
    } else {
        title.innerText = 'Вход';
        userField.style.display = 'none';
        btn.innerText = 'Влез';
        toggleText.innerText = 'Нямаш профил? Регистрирай се';
    }
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}
