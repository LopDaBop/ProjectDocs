// ProjectDocs: Fancy Minimalistic Docs - Static SPA
// All data is stored in localStorage for static hosting

// --- UTILITIES ---
function $(sel) { return document.querySelector(sel); }
function el(tag, cls = '', html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

// --- STATE ---
const STATE = {
  user: null, // { username }
  folders: {}, // { folderId: { name, files: [fileId, ...] } }
  files: {}, // { fileId: { folderId, name, content, owner } }
};

function saveState() {
  localStorage.setItem('projectdocs', JSON.stringify({
    users: JSON.parse(localStorage.getItem('users') || '{}'),
    folders: STATE.folders,
    files: STATE.files,
  }));
}
function loadState() {
  const d = JSON.parse(localStorage.getItem('projectdocs') || '{}');
  STATE.folders = d.folders || {};
  STATE.files = d.files || {};
}
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}
function loadUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}

// --- AUTH ---
function showLanding() {
  const app = $('#app');
  app.innerHTML = '';
  const wrap = el('div', 'fade-in-up', `
    <h1 style="margin-bottom:1.5em;">ProjectDocs</h1>
    <button class="low-poly-btn" id="goto-login">Login</button>
    <button class="low-poly-btn" id="goto-signup">Sign Up</button>
  `);
  app.appendChild(wrap);
  $('#goto-login').onclick = showLogin;
  $('#goto-signup').onclick = showSignup;
}
function showLogin() {
  const app = $('#app');
  app.innerHTML = '';
  const wrap = el('div', 'fade-in-up', `
    <h2>Login</h2>
    <input type="text" id="login-username" placeholder="Username" style="margin-bottom:0.5em;display:block;width:100%;max-width:320px;" />
    <input type="password" id="login-password" placeholder="Password" style="margin-bottom:0.5em;display:block;width:100%;max-width:320px;" />
    <button class="low-poly-btn" id="login-btn">Login</button>
    <button class="low-poly-btn" id="back-landing">Back</button>
    <div id="login-msg" style="color:#6366f1;font-size:0.95em;margin-top:0.7em;"></div>
  `);
  app.appendChild(wrap);
  $('#login-btn').onclick = login;
  $('#back-landing').onclick = showLanding;
}
function showSignup() {
  const app = $('#app');
  app.innerHTML = '';
  const wrap = el('div', 'fade-in-up', `
    <h2>Sign Up</h2>
    <input type="text" id="signup-username" placeholder="Username" style="margin-bottom:0.5em;display:block;width:100%;max-width:320px;" />
    <input type="password" id="signup-password" placeholder="Password" style="margin-bottom:0.5em;display:block;width:100%;max-width:320px;" />
    <button class="low-poly-btn" id="signup-btn">Create Account</button>
    <button class="low-poly-btn" id="back-landing">Back</button>
    <div id="signup-msg" style="color:#6366f1;font-size:0.95em;margin-top:0.7em;"></div>
  `);
  app.appendChild(wrap);
  $('#signup-btn').onclick = signup;
  $('#back-landing').onclick = showLanding;
}
function login() {
  const u = $('#login-username').value.trim();
  const p = $('#login-password').value;
  const users = loadUsers();
  if (users[u] && users[u].pw === hash(p)) {
    STATE.user = { username: u };
    loadState();
    showHub();
  } else {
    $('#login-msg').textContent = 'Invalid username or password.';
  }
}
function signup() {
  const u = $('#signup-username').value.trim();
  const p = $('#signup-password').value;
  if (!u || !p) {
    $('#signup-msg').textContent = 'Please enter username and password.';
    return;
  }
  const users = loadUsers();
  if (users[u]) {
    $('#signup-msg').textContent = 'Username already exists.';
    return;
  }
  users[u] = { pw: hash(p) };
  saveUsers(users);
  $('#signup-msg').textContent = 'Account created! You can now login.';
  setTimeout(showLogin, 1200);
}
function login() {
  const u = $('#login-username').value.trim();
  const p = $('#login-password').value;
  const users = loadUsers();
  if (users[u] && users[u].pw === hash(p)) {
    STATE.user = { username: u };
    loadState();
    showHub();
  } else {
    $('#login-msg').textContent = 'Invalid username or password.';
  }
}
function signup() {
  const u = $('#login-username').value.trim();
  const p = $('#login-password').value;
  if (!u || !p) {
    $('#login-msg').textContent = 'Please enter username and password.';
    return;
  }
  const users = loadUsers();
  if (users[u]) {
    $('#login-msg').textContent = 'Username already exists.';
    return;
  }
  users[u] = { pw: hash(p) };
  saveUsers(users);
  $('#login-msg').textContent = 'Account created! Please login.';
}
function hash(str) {
  // Simple hash for demo (not secure)
  let h = 0; for (let i = 0; i < str.length; i++) h = ((h<<5)-h)+str.charCodeAt(i); return h.toString();
}

// --- HUB (Folders & Files) ---
function showHub() {
  const app = $('#app');
  app.innerHTML = '';
  const header = el('div', '', `
    <h2>Welcome, ${STATE.user.username}</h2>
    <button class="low-poly-btn" id="logout-btn">Logout</button>
    <h3>Folders</h3>
    <button class="low-poly-btn" id="add-folder-btn">+ New Folder</button>
    <div id="folders-list"></div>
  `);
  app.appendChild(header);
  $('#logout-btn').onclick = () => { STATE.user = null; showLogin(); };
  $('#add-folder-btn').onclick = addFolder;
  renderFolders();
}
function renderFolders() {
  const list = $('#folders-list');
  list.innerHTML = '';
  Object.entries(STATE.folders).forEach(([fid, f]) => {
    if (f.owner !== STATE.user.username) return;
    const folderDiv = el('div', 'folder fade-in-up', `
      <b>${f.name}</b>
      <button class="low-poly-btn" style="float:right;font-size:0.9em;" onclick="">Open</button>
      <button class="low-poly-btn" style="float:right;font-size:0.9em;" onclick="">Rename</button>
      <button class="low-poly-btn" style="float:right;font-size:0.9em;" onclick="">Delete</button>
      <div class="pages-list"></div>
    `);
    // Attach events
    const btns = folderDiv.querySelectorAll('button');
    btns[0].onclick = () => openFolder(fid);
    btns[1].onclick = () => renameFolder(fid);
    btns[2].onclick = () => deleteFolder(fid);
    list.appendChild(folderDiv);
  });
}
function addFolder() {
  const name = prompt('Folder name?');
  if (!name) return;
  const id = 'f_' + Date.now();
  STATE.folders[id] = { name, files: [], owner: STATE.user.username };
  saveState();
  renderFolders();
}
function renameFolder(fid) {
  const name = prompt('New folder name?', STATE.folders[fid].name);
  if (!name) return;
  STATE.folders[fid].name = name;
  saveState();
  renderFolders();
}
function deleteFolder(fid) {
  if (!confirm('Delete this folder and all its pages?')) return;
  STATE.folders[fid].files.forEach(pid => delete STATE.files[pid]);
  delete STATE.folders[fid];
  saveState();
  renderFolders();
}
function openFolder(fid) {
  const app = $('#app');
  app.innerHTML = '';
  const f = STATE.folders[fid];
  const header = el('div', '', `
    <h2>${f.name}</h2>
    <button class="low-poly-btn" id="back-btn">Back</button>
    <button class="low-poly-btn" id="add-page-btn">+ New Page</button>
    <div id="pages-list"></div>
  `);
  app.appendChild(header);
  $('#back-btn').onclick = showHub;
  $('#add-page-btn').onclick = () => addPage(fid);
  renderPages(fid);
}
function renderPages(fid) {
  const list = $('#pages-list');
  list.innerHTML = '';
  STATE.folders[fid].files.forEach(pid => {
    const p = STATE.files[pid];
    const div = el('div', 'page fade-in-up', `
      <b>${p.name}</b>
      <button class="low-poly-btn" style="float:right;font-size:0.9em;" onclick="">Open</button>
      <button class="low-poly-btn" style="float:right;font-size:0.9em;" onclick="">Rename</button>
      <button class="low-poly-btn" style="float:right;font-size:0.9em;" onclick="">Delete</button>
    `);
    const btns = div.querySelectorAll('button');
    btns[0].onclick = () => openPage(pid);
    btns[1].onclick = () => renamePage(pid);
    btns[2].onclick = () => deletePage(fid, pid);
    list.appendChild(div);
  });
}
function addPage(fid) {
  const name = prompt('Page name?');
  if (!name) return;
  const id = 'p_' + Date.now();
  STATE.files[id] = { folderId: fid, name, content: '', owner: STATE.user.username };
  STATE.folders[fid].files.push(id);
  saveState();
  renderPages(fid);
}
function renamePage(pid) {
  const name = prompt('New page name?', STATE.files[pid].name);
  if (!name) return;
  STATE.files[pid].name = name;
  saveState();
  renderPages(STATE.files[pid].folderId);
}
function deletePage(fid, pid) {
  if (!confirm('Delete this page?')) return;
  delete STATE.files[pid];
  STATE.folders[fid].files = STATE.folders[fid].files.filter(id => id !== pid);
  saveState();
  renderPages(fid);
}

// --- PAGE EDITOR ---
function openPage(pid) {
  const p = STATE.files[pid];
  const editable = (STATE.user.username === p.owner);
  const app = $('#app');
  app.innerHTML = '';
  const header = el('div', '', `
    <button class="low-poly-btn" id="back-folder-btn">Back</button>
    <span style="font-size:1.3em;margin-left:1em;">${p.name}</span>
    <button class="low-poly-btn" id="save-btn" style="float:right;">Save</button>
  `);
  app.appendChild(header);
  $('#back-folder-btn').onclick = () => openFolder(p.folderId);
  const textarea = el('textarea', '', '');
  textarea.style = 'width:100%;min-height:60vh;font-size:1.15em;padding:1em;background:rgba(245,247,255,0.7);border:none;resize:vertical;box-shadow:0 1px 8px #dbeafe;';
  textarea.value = p.content;
  textarea.readOnly = !editable;
  textarea.placeholder = editable ? 'Start writing your doc...' : 'View only';
  textarea.classList.add('fade-in-up');
  app.appendChild(textarea);
  $('#save-btn').onclick = () => {
    if (!editable) return;
    p.content = textarea.value;
    saveState();
    $('#save-btn').textContent = 'Saved!';
    setTimeout(() => { $('#save-btn').textContent = 'Save'; }, 1200);
  };
  if (!editable) $('#save-btn').disabled = true;
}

// --- INIT ---
window.onload = () => {
  if (!STATE.user) showLanding();
};
