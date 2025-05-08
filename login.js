document.getElementById('login-btn').onclick = function() {
  const u = document.getElementById('login-username').value.trim().toLowerCase();
  const p = document.getElementById('login-password').value;
  if (!u || !p) {
    document.getElementById('login-msg').textContent = 'Please enter username and password.';
    return;
  }
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (users[u] && users[u].pw === hash(p)) {
    localStorage.setItem('currentUser', u);
    window.location.href = 'index.html';
  } else {
    document.getElementById('login-msg').textContent = 'Invalid username or password.';
  }
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
