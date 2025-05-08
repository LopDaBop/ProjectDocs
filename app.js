// ProjectDocs – Modern Docs & Folders App

// --- State & Persistence ---
const STORAGE_KEY = 'projectdocs_v2';
let state = {
  folders: {}, // {id: {name, docs: [docId]}}
  docs: {},    // {id: {folderId, name, content}}
  selectedFolder: null,
  selectedDoc: null
};
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load() {
  const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  state.folders = d.folders || {};
  state.docs = d.docs || {};
  state.selectedFolder = d.selectedFolder || null;
  state.selectedDoc = d.selectedDoc || null;
}

// --- Utilities ---
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k.startsWith('on') && typeof attrs[k] === 'function') e[k] = attrs[k];
    else if (attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  for (const c of children) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}
function uuid() { return 'id-' + Math.random().toString(36).slice(2,10) + Date.now(); }

// --- Render Functions ---
function render() {
  const root = document.getElementById('app-root');
  root.innerHTML = '';
  root.appendChild(el('div', {class: 'header-bar'},
    el('h1', {}, 'ProjectDocs'),
    el('button', {onclick: () => showFolders()}, 'Folders')
  ));
  if (state.selectedDoc) {
    renderDocView(root, state.selectedDoc);
  } else if (state.selectedFolder) {
    renderFolderView(root, state.selectedFolder);
  } else {
    renderFoldersList(root);
  }
}

function renderFoldersList(root) {
  root.appendChild(el('h2', {}, 'Your Folders'));
  const ul = el('ul', {class: 'folder-list'});
  const folderEntries = Object.entries(state.folders);
  if (folderEntries.length === 0) {
    ul.appendChild(el('li', {style:'color:#888;padding:2em;text-align:center;font-style:italic;'}, 'No folders yet. Click "+ New Folder" to get started!'));
  } else {
    folderEntries.forEach(([fid, f]) => {
      ul.appendChild(el('li', {class: 'folder-item fade-in'},
        el('span', {style:'font-weight:500'}, f.name),
        el('span', {},
          el('button', {onclick:()=>openFolder(fid), 'aria-label':'Open folder'}, 'Open'),
          el('button', {onclick:()=>renameFolder(fid), 'aria-label':'Rename folder'}, 'Rename'),
          el('button', {onclick:()=>deleteFolder(fid), 'aria-label':'Delete folder'}, 'Delete')
        )
      ));
    });
  }
  root.appendChild(ul);
  root.appendChild(el('button', {onclick: addFolder, style:'margin-top:1em'}, '+ New Folder'));
}

function renderFolderView(root, fid) {
  const folder = state.folders[fid];
  root.appendChild(el('div', {class:'fade-in'},
    el('button', {onclick:()=>{state.selectedFolder=null;save();render();}}, '← Back to Folders'),
    el('h2', {}, folder.name),
    (() => {
      if (folder.docs.length === 0) {
        return el('div', {style:'color:#888;padding:2em;text-align:center;font-style:italic;'}, 'No docs yet. Click "+ New Doc" to create your first document!');
      }
      return el('ul', {class:'doc-list'},
        ...folder.docs.map(did => el('li', {class:'doc-item'},
          el('span', {}, state.docs[did].name),
          el('span', {},
            el('button', {onclick:()=>openDoc(did), 'aria-label':'Open doc'}, 'Open'),
            el('button', {onclick:()=>renameDoc(did), 'aria-label':'Rename doc'}, 'Rename'),
            el('button', {onclick:()=>deleteDoc(did), 'aria-label':'Delete doc'}, 'Delete')
          )
        ))
      );
    })(),
    el('button', {onclick:()=>addDoc(fid), style:'margin-top:1em'}, '+ New Doc')
  ));
}

function renderDocView(root, did) {
  const doc = state.docs[did];
  // Feedback message node
  let msgNode = el('div', {id:'doc-msg', style:'margin-bottom:1em;color:#2563eb;'});
  root.appendChild(el('div', {class:'fade-in'},
    el('button', {onclick:()=>{state.selectedDoc=null;save();render();}}, '← Back to Folder'),
    el('h2', {}, doc.name),
    msgNode,
    el('textarea', {
      value: doc.content,
      oninput: e=>{doc.content=e.target.value;save();},
      style:'width:100%;margin-bottom:1em;',
      'aria-label':'Document content'
    }),
    el('button', {onclick:()=>saveDoc(did, msgNode)}, 'Save')
  ));
}


// --- Folder & Doc Logic ---
function addFolder() {
  const name = prompt('Folder name?');
  if (!name) return;
  const id = uuid();
  state.folders[id] = {name, docs:[]};
  save();
  render();
}
function renameFolder(fid) {
  const name = prompt('New folder name?', state.folders[fid].name);
  if (!name) return;
  state.folders[fid].name = name;
  save();
  render();
}
function deleteFolder(fid) {
  if (!confirm('Delete this folder and all its docs?')) return;
  state.folders[fid].docs.forEach(did=>delete state.docs[did]);
  delete state.folders[fid];
  save();
  render();
}
function openFolder(fid) {
  state.selectedFolder = fid;
  state.selectedDoc = null;
  save();
  render();
}
function addDoc(fid) {
  const name = prompt('Doc name?');
  if (!name) return;
  const id = uuid();
  state.docs[id] = {folderId: fid, name, content: ''};
  state.folders[fid].docs.push(id);
  save();
  render();
}
function renameDoc(did) {
  const name = prompt('New doc name?', state.docs[did].name);
  if (!name) return;
  state.docs[did].name = name;
  save();
  render();
}
function deleteDoc(did) {
  const doc = state.docs[did];
  if (!confirm('Delete this doc?')) return;
  state.folders[doc.folderId].docs = state.folders[doc.folderId].docs.filter(x=>x!==did);
  delete state.docs[did];
  save();
  render();
}
function openDoc(did) {
  state.selectedDoc = did;
  save();
  render();
}
function saveDoc(did, msgNode) {
  // Already saved on input, but show visual feedback
  if (msgNode) {
    msgNode.textContent = '✓ Document saved!';
    setTimeout(() => { msgNode.textContent = ''; }, 1200);
  }
}

function showFolders() {
  state.selectedFolder = null;
  state.selectedDoc = null;
  save();
  render();
}

// --- Init ---
window.onload = function() {
  load();
  render();
};
