async function checkUser() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (user) {
    STATE.user = user;
    const { data: prof } = await _supabase.from('profiles').select('*').eq('id', user.id).single();
    STATE.profile = prof;
    loadFeed();
  }
}

async function doLogin() {
  var email = el('l-email').value;
  var pass = el('l-pass').value;
  var err = el('l-err');
  err.innerText = '';
  const { data, error } = await _supabase.auth.signInWithPassword({ email, password: pass });
  if (error) { err.innerText = error.message; return; }
  closeModal('m-auth');
  window.location.reload();
}

async function doRegister() {
  var name = el('r-name').value;
  var email = el('r-email').value;
  var pass = el('r-pass').value;
  var err = el('r-err');
  err.innerText = '';
  const { data, error } = await _supabase.auth.signUp({ 
    email, 
    password: pass, 
    options: { data: { full_name: name } } 
  });
  if (error) { err.innerText = error.message; return; }
  if (data.user) {
    await _supabase.from('profiles').insert([{ 
      id: data.user.id, 
      full_name: name, 
      username: name.toLowerCase().replace(/\s/g, '') 
    }]);
  }
  showToast('Готово! Провери имейла си.');
  closeModal('m-auth');
}

async function doLogout() {
  await _supabase.auth.signOut();
  window.location.reload();
}

el('sw-login').onclick = function() {
  el('sw-login').classList.add('active'); el('sw-register').classList.remove('active');
  el('auth-login').style.display = 'block'; el('auth-register').style.display = 'none';
};

el('sw-register').onclick = function() {
  el('sw-register').classList.add('active'); el('sw-login').classList.remove('active');
  el('auth-register').style.display = 'block'; el('auth-login').style.display = 'none';
};
