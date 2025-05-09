// ProjectDocs – Feature-rich Docs & Folders App

// --- State & Persistence ---
const STORAGE_KEY = 'projectdocs_v3';
let state = {
  folders: {}, // {id: {name, docs: [docId], created, updated}}
  docs: {},    // {id: {folderId, name, content, created, updated}}
  selectedFolder: null,
  selectedDoc: null,
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
  // Sidebar toggle logic
  const sidebar = document.getElementById('sidebar');
  const mainPane = document.getElementById('main-pane');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  let sidebarHidden = false;
  sidebarToggle.onclick = function() {
    sidebarHidden = true;
    sidebar.setAttribute('hidden', 'true');
    mainPane.style.marginLeft = '0';
    // Show button to unhide sidebar
    if (!document.getElementById('show-sidebar-btn')) {
      const btn = document.createElement('button');
      btn.id = 'show-sidebar-btn';
      btn.textContent = '☰';
      btn.title = 'Show sidebar';
      btn.style = 'position:fixed;top:1em;left:1em;z-index:2000;font-size:1.5em;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:0.3em 0.7em;box-shadow:0 2px 8px #0003;cursor:pointer;';
      btn.onclick = function() {
        sidebarHidden = false;
        sidebar.removeAttribute('hidden');
        mainPane.style.marginLeft = '';
        btn.remove();
      };
      document.body.appendChild(btn);
    }
  };
};

function renderSidebar() {
  const sidebar = document.getElementById('folders-list');
  sidebar.innerHTML = '';
  let folders = Object.entries(state.folders);
  if (state.search) folders = folders.filter(([id, f]) => f.name.toLowerCase().includes(state.search.toLowerCase()));
  if (folders.length === 0) {
    sidebar.appendChild(el('div', {style:'color:#888;padding:2em;text-align:center;font-style:italic;'}, 'No folders found.'));
    return;
  }
  folders.sort((a,b)=>a[1].name.localeCompare(b[1].name));
  for (const [fid, f] of folders) {
    sidebar.appendChild(el('div', {
      class:'folder-item'+(state.selectedFolder===fid?' selected':''),
      tabindex:0,
      onclick:()=>selectFolder(fid)
    },
      el('span', {class:'folder-name'}, f.name),
      el('span', {class:'folder-actions'},
        el('button', {title:'Rename', onclick:e=>{e.stopPropagation();renameFolder(fid);}}, '✎'),
        el('button', {title:'Delete', onclick:e=>{e.stopPropagation();if(confirm('Delete this folder and all its docs?')) deleteFolder(fid);}}, '🗑️')
      )
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
  const bg = el('div', {class:'docs-fullpage-bg'});
  root.appendChild(bg);
  const page = el('div', {class:'docs-page'});
  bg.appendChild(page);
  // Toolbar at top: Back, Save, Edit/View, Rename, Delete
  const toolbar = el('div', {class:'docs-toolbar'},
    el('button', {
      style:'background:#2563eb;color:#fff;border-radius:2em;padding:0.5em 1.2em;box-shadow:0 2px 8px #0001;margin-right:1.5em;',
      onclick:()=>{state.selectedDoc=null; save(); renderMainPane();}
    }, '← Back'),
    (docMode==='edit' ?
      el('button', {id:'save-doc-btn', style:'margin-right:1em;'}, 'Save') :
      null
    ),
    (docMode==='edit' ?
      el('button', {id:'switch-read-btn', style:'margin-right:1em;'}, 'View') :
      el('button', {id:'switch-edit-btn', style:'margin-right:1em;'}, 'Edit')
    ),
    el('button', {onclick:()=>renameDoc(did), style:'margin-left:2em;'}, 'Rename'),
    el('button', {onclick:()=>deleteDoc(did), style:'margin-left:0.5em;'}, 'Delete')
  );
  bg.insertBefore(toolbar, page);
  // Doc title at top
  let titleNode;
  if (docMode==='edit') {
    titleNode = document.createElement('input');
    titleNode.type = 'text';
    titleNode.value = doc.name;
    titleNode.className = 'doc-title-input';
    titleNode.style = 'font-size:1.5em;font-weight:600;margin-bottom:1.2em;border:none;background:transparent;width:100%;outline:none;color:inherit;';
    titleNode.oninput = e=>{ doc.name = e.target.value; save(); };
  } else {
    titleNode = document.createElement('div');
    titleNode.textContent = doc.name;
    titleNode.className = 'doc-title';
    titleNode.style = 'font-size:1.5em;font-weight:600;margin-bottom:1.2em;text-align:center;';
  }
  page.appendChild(titleNode);
  if (docMode === 'edit') {
    // Quill editor
    const quillDiv = el('div', {id:'quill-editor'});
    page.appendChild(quillDiv);
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
    document.getElementById('save-doc-btn').onclick = function() {
      doc.content = quill.root.innerHTML;
      saveDoc(did, null);
    };
    document.getElementById('switch-read-btn').onclick = function() {
      doc.content = quill.root.innerHTML;
      docMode = 'read';
      saveDoc(did, null);
      renderDocFullPage(root, did);
    };
  } else {
    // View mode: just content
    page.appendChild(el('div', {class:'doc-read-content'},
      doc.content ? el('div', {innerHTML:doc.content}) : el('span', {style:'color:#aaa;'}, 'Empty document.')
    ));
    document.getElementById('switch-edit-btn').onclick = function() {
      docMode = 'edit';
      renderDocFullPage(root, did);
    };
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
  if (state.theme==='dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}
function toggleTheme() {
  state.theme = state.theme==='dark' ? 'light' : 'dark';
  save();
  applyTheme();
}
