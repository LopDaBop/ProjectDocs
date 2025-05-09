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
    const name = document.createElement('span');
    name.textContent = f.name;
    name.className = 'folder-name';
    li.appendChild(name);
    const actions = document.createElement('span');
    actions.className = 'folder-actions';
    // Rename button
    const renameBtn = document.createElement('button');
    renameBtn.textContent = 'Rename';
    renameBtn.title = 'Rename';
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
    li.onclick = () => { window.location.href = `doc.html?doc=${doc.id}`; };
    const name = document.createElement('span');
    name.textContent = doc.name;
    name.className = 'doc-name';
    li.appendChild(name);
    const actions = document.createElement('span');
    actions.className = 'doc-actions';
    const renameBtn = document.createElement('button');
    renameBtn.title = 'Rename';
    renameBtn.innerHTML = '✎';
    renameBtn.onclick = e => { e.stopPropagation(); renameDoc(doc.id); };
    actions.appendChild(renameBtn);
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
  const folder = state.selectedFolder && state.folders[state.selectedFolder];
  document.getElementById('current-folder-name').textContent = folder ? folder.name : 'Select a folder';
  document.getElementById('add-doc').style.display = folder ? '' : 'none';
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
  document.getElementById('theme-toggle').onclick = () => {
    state.theme = (state.theme==='dark'?'light':'dark');
    document.body.classList.toggle('dark', state.theme==='dark');
    save();
  };
  document.body.classList.toggle('dark', state.theme==='dark');
}
window.onload = setup;
