document.getElementById('register-btn').onclick = function() {
  const u = document.getElementById('register-username').value.trim().toLowerCase();
  const p = document.getElementById('register-password').value;
  if (!u || !p) {
    document.getElementById('register-msg').textContent = 'Please enter username and password.';
    return;
  }
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (users[u]) {
    document.getElementById('register-msg').textContent = 'Username already exists.';
    return;
  }
  users[u] = { pw: hash(p) };
  localStorage.setItem('users', JSON.stringify(users));
  document.getElementById('register-msg').textContent = 'Registration successful! Redirecting to login...';
  setTimeout(function() {
    window.location.href = 'login.html';
  }, 1000);
};

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h<<5)-h)+str.charCodeAt(i);
  return h.toString();
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h<<5)-h)+str.charCodeAt(i);
  return h.toString();
}
