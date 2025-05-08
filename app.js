// ProjectDocs – Feature-rich Docs & Folders App

// --- State & Persistence ---
const STORAGE_KEY = 'projectdocs_v3';
let state = {
  folders: {}, // {id: {name, docs: [docId], fav: bool, created, updated}}
  docs: {},    // {id: {folderId, name, content, fav: bool, created, updated}}
  selectedFolder: null,
  selectedDoc: null,
  showFav: false,
  search: '',
  theme: 'light'
};
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load() {
  const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  state.folders = d.folders || {};
  state.docs = d.docs || {};
  state.selectedFolder = d.selectedFolder || null;
  state.selectedDoc = d.selectedDoc || null;
  state.showFav = d.showFav || false;
  state.search = d.search || '';
  state.theme = d.theme || 'light';
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
function now() { return new Date().toISOString(); }

// --- Render Functions ---
window.onload = function() {
  load();
  applyTheme();
  renderSidebar();
  renderTopbar();
  renderMainPane();
  setupHandlers();
};

function renderSidebar() {
  const sidebar = document.getElementById('folders-list');
  sidebar.innerHTML = '';
  let folders = Object.entries(state.folders);
  if (state.showFav) folders = folders.filter(([id, f]) => f.fav);
  if (state.search) folders = folders.filter(([id, f]) => f.name.toLowerCase().includes(state.search.toLowerCase()));
  if (folders.length === 0) {
    sidebar.appendChild(el('div', {style:'color:#888;padding:2em;text-align:center;font-style:italic;'}, 'No folders found.'));
    return;
  }
  folders.sort((a,b)=>a[1].name.localeCompare(b[1].name));
  for (const [fid, f] of folders) {
    sidebar.appendChild(el('div', {
      class:'folder-item fade-in'+(state.selectedFolder===fid?' selected':''),
      tabindex:0,
      onclick:()=>selectFolder(fid)
    },
      el('span', {}, f.name),
      el('button', {class:'fav-btn'+(f.fav?' fav':''), title:'Favorite', onclick:(e)=>{e.stopPropagation();toggleFavFolder(fid);}}, '★')
    ));
  }
}

function renderTopbar() {
  document.getElementById('search-box').value = state.search;
  document.getElementById('toggle-fav').className = state.showFav ? 'fav' : '';
}
function renderMainPane() {
  const docsList = document.getElementById('docs-list');
  const docView = document.getElementById('doc-view');
  docsList.innerHTML = '';
  docView.innerHTML = '';
  // If a doc is open, show full-page doc view (hide sidebar/topbar)
  if (state.selectedDoc) {
    document.getElementById('folders-list').style.display = 'none';
    document.getElementById('topbar').style.display = 'none';
    docView.style.gridColumn = '1 / span 2';
    docView.style.width = '100vw';
    docView.style.minHeight = '100vh';
    docView.style.background = '#f8fafc';
    renderDocFullPage(docView, state.selectedDoc);
    return;
  } else {
    document.getElementById('folders-list').style.display = '';
    document.getElementById('topbar').style.display = '';
    docView.style.gridColumn = '';
    docView.style.width = '';
    docView.style.minHeight = '';
    docView.style.background = '';
  }
  if (!state.selectedFolder) {
    docsList.appendChild(el('div', {style:'color:#888;padding:2em;text-align:center;font-style:italic;'}, 'Select a folder to view its docs.'));
    return;
  }
  let docs = state.folders[state.selectedFolder]?.docs.map(id=>[id, state.docs[id]]).filter(x=>!!x[1]) || [];
  if (state.showFav) docs = docs.filter(([id, d])=>d.fav);
  if (state.search) docs = docs.filter(([id, d])=>d.name.toLowerCase().includes(state.search.toLowerCase()));
  const docsHeader = el('div', {style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5em;'},
    el('h2', {style:'margin:0;font-size:1.2em;'}, 'Docs'),
    el('button', {onclick:addDoc, style:'margin-left:1em;font-size:1em;'}, '+ New Doc')
  );
  docsList.appendChild(docsHeader);
  if (docs.length === 0) {
    docsList.appendChild(el('div', {style:'color:#888;padding:2em;text-align:center;font-style:italic;'}, 'No docs found.'));
    return;
  }
  docs.sort((a,b)=>a[1].name.localeCompare(b[1].name));
  for (const [did, d] of docs) {
    docsList.appendChild(el('div', {
      class:'doc-item fade-in'+(state.selectedDoc===did?' selected':''),
      tabindex:0,
      onclick:()=>selectDoc(did)
    },
      el('span', {}, d.name),
      el('button', {class:'fav-btn'+(d.fav?' fav':''), title:'Favorite', onclick:(e)=>{e.stopPropagation();toggleFavDoc(did);}}, '★')
    ));
  }
}


// Session doc mode (edit/read) per session
let docMode = 'read';
function renderDocFullPage(root, did) {
  const doc = state.docs[did];
  root.innerHTML = '';
  // Floating back button
  const backBtn = el('button', {
    style:'position:fixed;top:2em;left:2em;z-index:1000;padding:0.7em 1.2em;font-size:1.1em;border-radius:2em;background:#2563eb;color:#fff;border:none;box-shadow:0 2px 8px #0002;cursor:pointer;',
    onclick:()=>{
      state.selectedDoc=null; save(); renderMainPane();
    }
  }, '← Back');
  root.appendChild(backBtn);
  // Mode toggle
  const modeToggle = el('div', {style:'margin:2em auto 1em auto;max-width:700px;text-align:right;'},
    el('span', {style:'margin-right:1em;font-size:1.2em;font-weight:600;'}, doc.name),
    el('button', {
      style:'margin-right:0.5em;',
      disabled: docMode==='read',
      onclick:()=>{docMode='read';renderDocFullPage(root, did);}
    }, 'Read'),
    el('button', {
      disabled: docMode==='edit',
      onclick:()=>{docMode='edit';renderDocFullPage(root, did);}
    }, 'Edit'),
    el('button', {onclick:()=>renameDoc(did), style:'margin-left:1.5em;'}, 'Rename'),
    el('button', {onclick:()=>deleteDoc(did), style:'margin-left:0.5em;'}, 'Delete')
  );
  root.appendChild(modeToggle);
  // Content area
  const contentWrap = el('div', {style:'margin:0 auto;max-width:700px;background:#fff;border-radius:8px;box-shadow:0 2px 12px #0001;padding:2em;min-height:60vh;'},
  );
  root.appendChild(contentWrap);
  if (docMode==='edit') {
    // Show Quill
    const quillDiv = el('div', {id:'quill-editor', style:'background:#fff;'});
    contentWrap.appendChild(quillDiv);
    const saveBtn = el('button', {id:'save-doc-btn', style:'margin-top:1em;'}, 'Save');
    contentWrap.appendChild(saveBtn);
    // Quill init
    const quill = new Quill('#quill-editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ]
      }
    });
    quill.root.innerHTML = doc.content || '';
    saveBtn.onclick = function() {
      doc.content = quill.root.innerHTML;
      saveDoc(did, null);
    };
  } else {
    // Read mode: render HTML
    contentWrap.innerHTML = `<div style="font-size:1.12em;line-height:1.7;color:#222;">${doc.content||'<span style=\'color:#aaa\'>Empty document.</span>'}</div>`;
  }
}


// --- Handlers & Logic ---
function setupHandlers() {
  document.getElementById('add-folder-btn').onclick = addFolder;
  document.getElementById('toggle-fav').onclick = ()=>{state.showFav=!state.showFav;save();renderSidebar();renderTopbar();renderMainPane();};
  document.getElementById('theme-btn').onclick = ()=>{toggleTheme();};
  document.getElementById('search-box').oninput = e=>{state.search=e.target.value;save();renderSidebar();renderMainPane();};
  document.getElementById('export-btn').onclick = exportData;
  document.getElementById('import-btn').onclick = ()=>document.getElementById('import-file').click();
  document.getElementById('import-file').onchange = importData;
}
function addFolder() {
  const name = prompt('Folder name?');
  if (!name) return;
  const id = uuid();
  state.folders[id] = {name, docs:[], fav:false, created:now(), updated:now()};
  save();
  renderSidebar();
}
function selectFolder(fid) {
  state.selectedFolder = fid;
  state.selectedDoc = null;
  save();
  renderSidebar();
  renderMainPane();
}
function toggleFavFolder(fid) {
  state.folders[fid].fav = !state.folders[fid].fav;
  save();
  renderSidebar();
}
function addDoc() {
  if (!state.selectedFolder) return;
  const name = prompt('Doc name?');
  if (!name) return;
  const id = uuid();
  state.docs[id] = {folderId: state.selectedFolder, name, content: '', fav:false, created:now(), updated:now()};
  state.folders[state.selectedFolder].docs.push(id);
  save();
  renderMainPane();
}
function selectDoc(did) {
  state.selectedDoc = did;
  save();
  renderMainPane();
}
function toggleFavDoc(did) {
  state.docs[did].fav = !state.docs[did].fav;
  save();
  renderMainPane();
}
function saveDoc(did, msgNode) {
  if (msgNode) {
    msgNode.textContent = '✓ Document saved!';
    setTimeout(() => { msgNode.textContent = ''; }, 1200);
  }
  state.docs[did].updated = now();
  save();
}
function renameDoc(did) {
  const name = prompt('New doc name?', state.docs[did].name);
  if (!name) return;
  state.docs[did].name = name;
  state.docs[did].updated = now();
  save();
  renderMainPane();
}
function deleteDoc(did) {
  const doc = state.docs[did];
  if (!confirm('Delete this doc?')) return;
  state.folders[doc.folderId].docs = state.folders[doc.folderId].docs.filter(x=>x!==did);
  delete state.docs[did];
  save();
  renderMainPane();
}
function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'projectdocs-backup.json';
  a.click();
}
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.location.reload();
    } catch {
      alert('Import failed: Invalid file.');
    }
  };
  reader.readAsText(file);
}
function applyTheme() {
  document.body.style.background = state.theme==='dark'
    ? 'linear-gradient(120deg,#222 0%,#2d3748 100%)'
    : 'linear-gradient(120deg,#f8fafc 0%,#e0e7ef 100%)';
  document.body.style.color = state.theme==='dark' ? '#f1f5fb' : '#222';
}
function toggleTheme() {
  state.theme = state.theme==='dark' ? 'light' : 'dark';
  save();
  applyTheme();
}
