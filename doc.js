// ProjectDocs doc.js
const STORAGE_KEY = 'projectdocs_v4';
let state = {};
function load() {
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) {
    try { state = JSON.parse(s); } catch {}
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function getParam(key) {
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}
const did = getParam('doc');
let doc, mode = 'read';
function render() {
  doc = state.docs && state.docs[did];
  if (!doc) {
    document.getElementById('doc-title').textContent = 'Document not found';
    document.getElementById('doc-content').innerHTML = '<div class="empty-state">Document not found.</div>';
    document.getElementById('edit-btn').style.display = 'none';
    document.getElementById('view-btn').style.display = 'none';
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('rename-btn').style.display = 'none';
    document.getElementById('delete-btn').style.display = 'none';
    return;
  }
  document.getElementById('doc-title').textContent = doc.name;
  if (mode==='edit') {
    document.getElementById('edit-btn').style.display = 'none';
    document.getElementById('view-btn').style.display = '';
    document.getElementById('save-btn').style.display = '';
    const editorDiv = document.createElement('div');
    editorDiv.id = 'quill-editor';
    document.getElementById('doc-content').innerHTML = '';
    document.getElementById('doc-content').appendChild(editorDiv);
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
    document.getElementById('save-btn').onclick = function() {
      save();
      mode = 'read';
      render();
    };
  } else {
    document.getElementById('edit-btn').style.display = '';
    document.getElementById('view-btn').style.display = 'none';
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('doc-content').innerHTML = doc.content || '<span style="color:#aaa">Empty document.</span>';
  }
}
function setup() {
  load();
  render();
  document.getElementById('edit-btn').onclick = function() { mode = 'edit'; render(); };
  document.getElementById('view-btn').onclick = function() { mode = 'read'; render(); };
  document.getElementById('back-btn').onclick = function() {
    window.location.href = `index.html?folder=${encodeURIComponent(doc.folderId)}`;
  };
  document.getElementById('rename-btn').onclick = function() {
    const name = prompt('Rename document:', doc.name);
    if (!name) return;
    doc.name = name;
    save();
    render();
  };
  document.getElementById('delete-btn').onclick = function() {
    if (!confirm('Delete this doc?')) return;
    const folder = state.folders[doc.folderId];
    if (folder) folder.docs = folder.docs.filter(x=>x!==did);
    delete state.docs[did];
    save();
    window.location.href = `index.html?folder=${encodeURIComponent(doc.folderId)}`;
  };
  document.getElementById('theme-toggle-doc').addEventListener('click', function() {
    const btn = this;
    btn.classList.add('toggling');
    setTimeout(() => btn.classList.remove('toggling'), 800);
    document.body.classList.toggle('dark');
    state.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    save();
  });
  document.body.classList.toggle('dark', state.theme==='dark');

  // Download button
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) downloadBtn.onclick = downloadDoc;
}
// Download button logic
function downloadDoc() {
  if (!doc) return;
  // Prepare HTML content for download
  const htmlContent = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>${doc.name}</title></head><body>${doc.content || ''}</body></html>`;
  const blob = new Blob([htmlContent], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (doc.name || 'document') + '.html';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

window.onload = setup;
