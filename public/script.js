// script.js – client‑side logic for RAG UI
const apiBase = '/api';

// Helper to add a message to the chat box
function addMessage(author, text) {
  const chatBox = document.getElementById('chatBox');
  const div = document.createElement('div');
  div.className = `message ${author}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Fetch and display the list of documents
async function loadDocuments() {
  const resp = await fetch(`${apiBase}/documents`);
  if (!resp.ok) return;
  const { documents } = await resp.json();
  const list = document.getElementById('docList');
  list.innerHTML = '';
  documents.forEach((doc) => {
    const li = document.createElement('li');
    li.textContent = `${doc.originalName} (${(doc.sizeBytes / 1024).toFixed(1)} KB)`;
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.style.marginLeft = '1rem';
    delBtn.onclick = async () => {
      await fetch(`${apiBase}/documents/${doc.id}`, { method: 'DELETE' })
        .then(r => r.ok && loadDocuments());
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// Upload selected files
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const input = document.getElementById('fileInput');
  if (!input.files.length) return alert('Select files first');
  const form = new FormData();
  Array.from(input.files).forEach(f => form.append('files', f));
  const resp = await fetch(`${apiBase}/documents/upload`, {
    method: 'POST',
    body: form,
  });
  if (resp.ok) {
    await loadDocuments();
    input.value = '';
  } else {
    const err = await resp.json();
    alert(err.error || 'Upload failed');
  }
});

// Send a chat question
document.getElementById('sendBtn').addEventListener('click', async () => {
  const textarea = document.getElementById('questionInput');
  const question = textarea.value.trim();
  if (!question) return;
  addMessage('user', question);
  textarea.value = '';
  const resp = await fetch(`${apiBase}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (resp.ok) {
    const data = await resp.json();
    addMessage('bot', data.answer);
  } else {
    const err = await resp.json();
    addMessage('bot', err.error || 'Error');
  }
});

// Initial load of documents
loadDocuments();
