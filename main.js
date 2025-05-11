// ProjectDocs main.js
const STORAGE_KEY = 'projectdocs_v4';
let state = {
  folders: {}, // {id: {name, docs: [docId]}}
  docs: {},    // {id: {folderId, name, content}}
  selectedFolder: null,
  theme: 'light',
};
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function load() {
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) {
    try { Object.assign(state, JSON.parse(s)); } catch {}
  }
}
function uuid() {
  return 'f'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);
}
function renderFolders() {
  const list = document.getElementById('folders-list');
  list.innerHTML = '';
  for (const [fid, f] of Object.entries(state.folders)) {
    const li = document.createElement('li');
    li.className = 'folder-item'+(state.selectedFolder===fid?' selected':'');
    li.tabIndex = 0;
    li.onclick = () => { state.selectedFolder = fid; render(); };
    // Folder icon
    const icon = document.createElement('span');
    icon.className = 'folder-icon';
    icon.innerHTML = '■';
    if (f.color) icon.style.background = f.color;
    li.appendChild(icon);
    // Folder name
    const name = document.createElement('span');
    name.textContent = f.name;
    name.className = 'folder-name';
    li.appendChild(name);
    const actions = document.createElement('span');
    actions.className = 'folder-actions';
    // Rename button
    const renameBtn = document.createElement('button');
    renameBtn.title = 'Rename';
    renameBtn.innerHTML = '✎';
    renameBtn.onclick = e => { e.stopPropagation(); renameFolder(fid); };
    actions.appendChild(renameBtn);
    // Color button
    const colorBtn = document.createElement('button');
    colorBtn.textContent = '🎨';
    colorBtn.title = 'Set folder color';
    colorBtn.onclick = e => { e.stopPropagation(); setFolderColor(fid); };
    actions.appendChild(colorBtn);
    // Delete button
    const delBtn = document.createElement('button');
    delBtn.title = 'Delete';
    delBtn.innerHTML = '🗑️';
    delBtn.onclick = e => { e.stopPropagation(); if (confirm('Delete this folder and all its docs?')) deleteFolder(fid); };
    actions.appendChild(delBtn);
    li.appendChild(actions);
    // Apply color if set
    if (f.color) {
      li.classList.add('folder-color');
      li.style.setProperty('--folder-color', f.color);
    } else {
      li.classList.remove('folder-color');
      li.style.removeProperty('--folder-color');
    }
    list.appendChild(li);
  }
}
function renderDocs() {
  const docsList = document.getElementById('docs-list');
  docsList.innerHTML = '';
  let docs = [];
  if (state.selectedFolder && state.folders[state.selectedFolder]) {
    docs = state.folders[state.selectedFolder].docs.map(did=>state.docs[did]).filter(Boolean);
  }
  if (!docs.length) {
    document.getElementById('empty-state').style.display = '';
    return;
  }
  document.getElementById('empty-state').style.display = 'none';
  for (const doc of docs) {
    const li = document.createElement('li');
    li.className = 'doc-item';
    li.tabIndex = 0;
    // Doc color
    if (doc.color) {
      li.style.setProperty('--doc-color', doc.color);
    } else {
      li.style.removeProperty('--doc-color');
    }
    li.onclick = () => { window.location.href = `doc.html?doc=${doc.id}`; };
    // Doc name
    const name = document.createElement('span');
    name.textContent = doc.name;
    name.className = 'doc-name';
    li.appendChild(name);
    // Actions
    const actions = document.createElement('span');
    actions.className = 'doc-actions';
    // Doc color button
    const colorBtn = document.createElement('button');
    colorBtn.className = 'doc-color-btn';
    colorBtn.title = 'Set doc color';
    colorBtn.innerHTML = '🎨';
    colorBtn.onclick = e => { e.stopPropagation(); setDocColor(doc.id); };
    actions.appendChild(colorBtn);
    // Rename
    const renameBtn = document.createElement('button');
    renameBtn.title = 'Rename';
    renameBtn.innerHTML = '✎';
    renameBtn.onclick = e => { e.stopPropagation(); renameDoc(doc.id); };
    actions.appendChild(renameBtn);
    // Delete
    const delBtn = document.createElement('button');
    delBtn.title = 'Delete';
    delBtn.innerHTML = '🗑️';
    delBtn.onclick = e => { e.stopPropagation(); if (confirm('Delete this doc?')) deleteDoc(doc.id); };
    actions.appendChild(delBtn);
    li.appendChild(actions);
    docsList.appendChild(li);
  }
}
function render() {
  renderFolders();
  renderDocs();
  // Only show black folder name in header
  const folderName = state.selectedFolder && state.folders[state.selectedFolder] ? state.folders[state.selectedFolder].name : '';
  document.getElementById('current-folder-name').textContent = folderName || 'Select a folder';
  document.getElementById('add-doc').style.display = state.selectedFolder ? '' : 'none';
  // Remove blue folder name above docs list if present
  let fullNameDiv = document.getElementById('folder-full-name');
  if (fullNameDiv) fullNameDiv.style.display = 'none';
  // Show watermark if no folder selected
  let watermark = document.getElementById('docs-watermark');
  if (!watermark) {
    watermark = document.createElement('div');
    watermark.id = 'docs-watermark';
    watermark.className = 'docs-watermark';
    watermark.textContent = 'ProjectDocs'; // Subtle watermark for branding
    document.querySelector('.main-pane').appendChild(watermark);
  }
  watermark.style.display = state.selectedFolder ? 'none' : '';
}

function addFolder() {
  const name = prompt('Folder name?');
  if (!name) return;
  const fid = uuid();
  state.folders[fid] = {name, docs: []};
  state.selectedFolder = fid;
  save();
  render();
}
function renameFolder(fid) {
  const name = prompt('Rename folder:', state.folders[fid].name);
  if (!name) return;
  state.folders[fid].name = name;
  save();
  render();
}
function setFolderColor(fid) {
  const current = state.folders[fid].color || '';
  let color = prompt('Enter hex color (e.g. #e6f0ff):', current);
  if (!color) return;
  color = color.trim();
  if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(color)) {
    alert('Invalid hex color.');
    return;
  }
  state.folders[fid].color = color;
  save();
  render();
}
function setDocColor(did) {
  const current = state.docs[did].color || '';
  let color = prompt('Enter hex color (e.g. #e6f0ff):', current);
  if (!color) return;
  color = color.trim();
  if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(color)) {
    alert('Invalid hex color.');
    return;
  }
  state.docs[did].color = color;
  save();
  render();
}
function deleteFolder(fid) {
  if (!state.folders[fid]) return;
  for (const did of state.folders[fid].docs) delete state.docs[did];
  delete state.folders[fid];
  if (state.selectedFolder === fid) state.selectedFolder = null;
  save();
  render();
}
function addDoc() {
  if (!state.selectedFolder) return;
  const name = prompt('Document name?');
  if (!name) return;
  const did = uuid();
  state.docs[did] = {id: did, folderId: state.selectedFolder, name, content: ''};
  state.folders[state.selectedFolder].docs.push(did);
  save();
  render();
}
function renameDoc(did) {
  const name = prompt('Rename document:', state.docs[did].name);
  if (!name) return;
  state.docs[did].name = name;
  save();
  render();
}
function deleteDoc(did) {
  const doc = state.docs[did];
  if (!doc) return;
  const folder = state.folders[doc.folderId];
  if (folder) folder.docs = folder.docs.filter(x=>x!==did);
  delete state.docs[did];
  save();
  render();
}
function setup() {
  load();
  render();
  document.getElementById('add-folder').onclick = addFolder;
  document.getElementById('add-doc').onclick = addDoc;
  document.getElementById('theme-toggle').addEventListener('click', function() {
    const btn = this;
    btn.classList.add('toggling');
    setTimeout(() => btn.classList.remove('toggling'), 800);
    document.body.classList.toggle('dark');
    state.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    save();
  });
  document.body.classList.toggle('dark', state.theme==='dark');
}
window.onload = setup;
