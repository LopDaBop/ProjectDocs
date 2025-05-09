// ProjectDocs doc.html: View/Edit single doc
// Get doc id from query string
function getParam(key) {
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}
const did = getParam('doc');
const STORAGE_KEY = 'projectdocs_v3';
let state = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
if (!state.docs || !state.docs[did]) {
  document.getElementById('doc-root').textContent = 'Document not found.';
  throw new Error('Doc not found');
}
let doc = state.docs[did];
let mode = 'read'; // or 'edit'

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const root = document.getElementById('doc-root');
  root.innerHTML = '';
  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'docs-toolbar';
  toolbar.appendChild(btn('← Back', ()=>{window.location.href='index.html?folder='+encodeURIComponent(doc.folderId);}));
  toolbar.appendChild(btn('Save', ()=>saveDoc()));
  toolbar.appendChild(btn(mode==='edit'?'View':'Edit', ()=>{mode=mode==='edit'?'read':'edit';render();}));
  toolbar.appendChild(btn('Rename', renameDoc));
  toolbar.appendChild(btn('Delete', deleteDoc));
  root.appendChild(toolbar);
  // Title
  let titleNode;
  if (mode==='edit') {
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
  root.appendChild(titleNode);
  // Content
  if (mode==='edit') {
    const quillDiv = document.createElement('div');
    quillDiv.id = 'quill-editor';
    root.appendChild(quillDiv);
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
    quill.on('text-change', ()=>{
      doc.content = quill.root.innerHTML;
    });
  } else {
    const content = document.createElement('div');
    content.className = 'doc-read-content';
    content.innerHTML = doc.content || '<span style="color:#aaa">Empty document.</span>';
    root.appendChild(content);
  }
}

function btn(label, onclick) {
  const b = document.createElement('button');
  b.textContent = label;
  b.onclick = onclick;
  b.style.marginRight = '1em';
  return b;
}
function saveDoc() {
  save();
  render();
}
function renameDoc() {
  const name = prompt('New doc name?', doc.name);
  if (!name) return;
  doc.name = name;
  save();
  render();
}
function deleteDoc() {
  if (!confirm('Delete this doc?')) return;
  const fid = doc.folderId;
  state.folders[fid].docs = state.folders[fid].docs.filter(x=>x!==did);
  delete state.docs[did];
  save();
  window.location.href = 'index.html?folder='+encodeURIComponent(fid);
}
render();
