async function checkUser() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (user) {
    STATE.user = user;
    const { data: prof } = await _supabase.from('profiles').select('*').eq('id', user.id).single();
    STATE.profile = prof;
  }
  // ВИНАГИ зареждаме фийда, дори и без логнат потребител
  loadFeed();
}

async function doLogin() {
  var email = el('l-email').value;
  var pass = el('l-pass').value;
  var err = el('l-err');
  if(!email || !pass) { err.innerText = "Попълни всички полета"; return; }
  
  const { data, error } = await _supabase.auth.signInWithPassword({ email, password: pass });
  if (error) { err.innerText = "Грешен имейл или парола"; return; }
  
  closeModal('m-auth');
  window.location.reload();
}

async function doRegister() {
  var name = el('r-name').value;
  var email = el('r-email').value;
  var pass = el('r-pass').value;
  var err = el('r-err');
  
  const { data, error } = await _supabase.auth.signUp({ 
    email, 
    password: pass, 
    options: { data: { full_name: name } } 
  });
  
  if (error) { err.innerText = error.message; return; }
  showToast('Успешна регистрация!');
  closeModal('m-auth');
}

async function doLogout() {
  await _supabase.auth.signOut();
  window.location.reload();
}
