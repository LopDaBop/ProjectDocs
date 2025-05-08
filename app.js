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

// --- HUB (Folders & Files) ---
function showHub() {
  const username = localStorage.getItem('currentUser');
  if (!username) {
    window.location.href = 'login.html';
    return;
  }
  STATE.user = { username };
  const app = $('#app');
  app.innerHTML = '';
  const header = el('div', '', `
    <h2>Welcome, ${username}</h2>
    <button class="low-poly-btn" id="logout-btn">Logout</button>
    <h3>Folders</h3>
    <button class="low-poly-btn" id="add-folder-btn">+ New Folder</button>
    <div id="folders-list"></div>
  `);
  app.appendChild(header);
  $('#logout-btn').onclick = function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  };
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
showHub();
