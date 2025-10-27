let notyf = null;
let currentDocId = null;
let documents = [];
let recueilData = [];
let defaultTemplate = `
Produit présumé : [B][/B]
Forme du produit : 
Mode d'acquisition : 

Motivation.s de l'analyse : 
Molécule.s trouvée.s : [B][/B]

[I]Quantification[/I] :
[I] : % base, donc % [sel] (entre % et % si l'on tient compte des 10% d'incertitude).[/I]
[URL='https://www.psychonaut.fr/threads/resultats-danalyse-a-distance-comprendre-et-interpreter.34634']Comprendre les équivalences[/URL]


[HEADING=1]Répertoire des ressources[/HEADING]




La personne a l'origine de l'analyse est invitée à remplir le [URL='https://www.psychoactif.org/limesurvey/index.php/595719?']questionnaire d'évalution[/URL] !
`;

function notify(message, type = 'success') {
  if (!notyf) notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
  if (type === 'error') {
    notyf.error(message);
  } else if (type === 'info') {
    notyf.success(message); // Notyf n'a pas de type info par défaut
  } else {
    notyf.success(message);
  }
}

// Chargement des documents sauvegardés
async function loadDocuments() {
  try {
    const res = await fetch('/api/redaction');
    if (res.ok) {
      const data = await res.json();
      documents = data.documents || [];
      renderDocumentsList();
    }
  } catch (e) {
    console.error('Erreur chargement documents:', e);
    documents = [];
    renderDocumentsList();
  }
}

// Chargement du recueil pour insertion
async function loadRecueil() {
  try {
    const res = await fetch('/api/recueil');
    if (res.ok) {
      const data = await res.json();
      recueilData = data.products || [];
    }
  } catch (e) {
    console.error('Erreur chargement recueil:', e);
    recueilData = [];
  }
}

// Chargement du template par défaut
async function loadTemplate() {
  try {
    const res = await fetch('/api/redaction/template');
    if (res.ok) {
      const data = await res.json();
      if (data.template) {
        defaultTemplate = data.template;
      }
    }
  } catch (e) {
    console.error('Erreur chargement template:', e);
  }
}

// Afficher la liste des documents
function renderDocumentsList() {
  const list = document.getElementById('documents-list');
  const emptyState = document.getElementById('empty-docs');
  
  if (documents.length === 0) {
    list.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }
  
  list.style.display = 'flex';
  emptyState.style.display = 'none';
  
  list.innerHTML = documents.map(doc => `
    <div class="document-item ${currentDocId === doc.id ? 'active' : ''}" onclick="loadDocument('${doc.id}')">
      <button class="doc-delete" onclick="event.stopPropagation(); deleteDocument('${doc.id}')" title="Supprimer">
        <i data-feather="trash-2"></i>
      </button>
      <div class="doc-name">${escapeHtml(doc.title || 'Sans titre')}</div>
      <div class="doc-date">${formatDate(doc.date)}</div>
      <div class="doc-preview">${escapeHtml(doc.content.substring(0, 60))}...</div>
    </div>
  `).join('');
  
  if (window.feather) window.feather.replace();
}

// Charger un document dans l'éditeur
function loadDocument(id) {
  const doc = documents.find(d => d.id === id);
  if (!doc) return;
  
  currentDocId = id;
  document.getElementById('doc-title').value = doc.title || '';
  document.getElementById('markdown-editor').value = doc.content || '';
  updateEditorStats();
  renderDocumentsList();
}

// Nouveau document
function newDocument() {
  currentDocId = null;
  document.getElementById('doc-title').value = '';
  document.getElementById('markdown-editor').value = defaultTemplate;
  updateEditorStats();
  renderDocumentsList();
}

// Supprimer un document
async function deleteDocument(id) {
  if (!confirm('Voulez-vous vraiment supprimer ce document ?')) return;
  
  try {
    const res = await fetch(`/api/redaction/${id}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) throw new Error('Erreur suppression');
    
    if (currentDocId === id) {
      newDocument();
    }
    await loadDocuments();
    notify('Document supprimé', 'success');
  } catch (e) {
    notify('Erreur: ' + e.message, 'error');
  }
}

// Sauvegarder le document
async function saveDocument() {
  const title = document.getElementById('doc-title').value.trim();
  const content = document.getElementById('markdown-editor').value;
  
  if (!title) {
    notify('Veuillez donner un titre au document', 'error');
    return;
  }
  
  const doc = {
    id: currentDocId || generateId(),
    title,
    content,
    date: new Date().toISOString()
  };
  
  try {
    const res = await fetch('/api/redaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: doc })
    });
    
    if (!res.ok) throw new Error('Erreur sauvegarde');
    
    currentDocId = doc.id;
    await loadDocuments();
    notify('Document sauvegardé', 'success');
  } catch (e) {
    notify('Erreur: ' + e.message, 'error');
  }
}

// Copier le texte dans le presse-papier
async function copyMarkdown() {
  const content = document.getElementById('markdown-editor').value;
  
  try {
    await navigator.clipboard.writeText(content);
    notify('Markdown copié dans le presse-papier', 'success');
  } catch (e) {
    // Fallback pour navigateurs anciens
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    notify('Markdown copié', 'success');
  }
}

// Ouvrir le forum avec titre et prefix, copier le contenu
async function postToForum() {
  const title = document.getElementById('doc-title').value.trim();
  const content = document.getElementById('markdown-editor').value;
  
  if (!title) {
    notify('Veuillez donner un titre au document', 'error');
    return;
  }
  
  if (!content) {
    notify('Le contenu est vide', 'error');
    return;
  }
  
  // Copier le contenu dans le presse-papiers
  try {
    await navigator.clipboard.writeText(content);
    notify('Contenu copié ! Collez-le (Ctrl+V) dans l\'éditeur du forum', 'success');
  } catch (e) {
    console.error('Erreur copie:', e);
    notify('Ouvrez le forum et copiez manuellement le contenu', 'error');
  }
  
  // Ouvrir le forum avec titre et prefix pré-remplis
  const params = new URLSearchParams({
    title: title,
    prefix_id: '6'  // Label "Résultat"
  });
  
  const url = `https://www.psychonaut.fr/forums/resultats.161/post-thread?${params.toString()}`;
  window.open(url, '_blank');
}

// Modal de recherche de ressources
function openResourceModal() {
  const modal = document.getElementById('resource-modal');
  modal.style.display = 'flex';
  renderProductsList();
  if (window.feather) window.feather.replace();
}

function closeResourceModal() {
  const modal = document.getElementById('resource-modal');
  modal.style.display = 'none';
}

// Afficher les produits du recueil
function renderProductsList() {
  const list = document.getElementById('products-list');
  const search = document.getElementById('resource-search').value.toLowerCase();
  
  const filtered = recueilData.filter(p => 
    p.name.toLowerCase().includes(search)
  );
  
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Aucune molécule trouvée</p></div>';
    return;
  }
  
  list.innerHTML = filtered.map(product => `
    <div class="product-item" onclick="insertProductResources('${product.id}')">
      <div class="product-name">${escapeHtml(product.name)}</div>
      <div class="product-resources">
        ${product.resources.map(res => `
          <span class="resource-badge ${res.type === 'note' ? 'note' : ''}">
            <i data-feather="${res.type === 'note' ? 'file-text' : 'link'}"></i>
            ${res.type === 'note' ? 'Note' : res.title || 'Lien'}
          </span>
        `).join('')}
      </div>
    </div>
  `).join('');
  
  if (window.feather) window.feather.replace();
}

// Insérer les ressources d'un produit dans l'éditeur
function insertProductResources(productId) {
  const product = recueilData.find(p => p.id === productId);
  if (!product) return;
  
  const editor = document.getElementById('markdown-editor');
  const cursorPos = editor.selectionStart;
  const textBefore = editor.value.substring(0, cursorPos);
  const textAfter = editor.value.substring(cursorPos);
  
  let insertion = '\n';
  
  product.resources.forEach(res => {
    if (res.type === 'link') {
      insertion += `[URL='${res.url}']${res.title || 'Lien'}[/URL]`;
      if (res.lang) {
        insertion += ` [${res.lang}]`;
      }
      insertion += '\n';
    } else if (res.type === 'note') {
      insertion += `${res.text}\n\n`;
    }
  });
  
  insertion += '\n';
  
  editor.value = textBefore + insertion + textAfter;
  editor.selectionStart = editor.selectionEnd = cursorPos + insertion.length;
  editor.focus();
  updateEditorStats();
  
  closeResourceModal();
  notify(`Ressources de "${product.name}" insérées`, 'success');
}

// Formatage BBCode (toolbar)
function applyFormat(format, level = 1) {
  const editor = document.getElementById('markdown-editor');
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selectedText = editor.value.substring(start, end);
  const textBefore = editor.value.substring(0, start);
  const textAfter = editor.value.substring(end);
  
  let replacement = '';
  let cursorOffset = 0;
  
  switch(format) {
    case 'bold':
      replacement = `[B]${selectedText || 'texte en gras'}[/B]`;
      cursorOffset = 3;
      break;
    case 'italic':
      replacement = `[I]${selectedText || 'texte en italique'}[/I]`;
      cursorOffset = 3;
      break;
    case 'heading':
      replacement = `[HEADING=${level}]${selectedText || 'Titre'}[/HEADING]`;
      cursorOffset = 10 + level.toString().length;
      break;
    case 'list':
      replacement = `[*] ${selectedText || 'élément'}`;
      cursorOffset = 4;
      break;
    case 'link':
      replacement = `[URL='url']${selectedText || 'texte du lien'}[/URL]`;
      cursorOffset = 6;
      break;
    case 'code':
      replacement = `[CODE]${selectedText || 'code'}[/CODE]`;
      cursorOffset = 6;
      break;
  }
  
  editor.value = textBefore + replacement + textAfter;
  editor.selectionStart = start + cursorOffset;
  editor.selectionEnd = start + replacement.length - cursorOffset;
  editor.focus();
  updateEditorStats();
}

// Mise à jour des statistiques de l'éditeur
function updateEditorStats() {
  const content = document.getElementById('markdown-editor').value;
  
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lines = content.split('\n').length;
  
  document.getElementById('char-count').textContent = `${chars} caractères`;
  document.getElementById('word-count').textContent = `${words} mots`;
  document.getElementById('line-count').textContent = `${lines} lignes`;
}

// Utilitaires
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Modal de configuration du template
function openTemplateModal() {
  const modal = document.getElementById('template-modal');
  document.getElementById('template-editor').value = defaultTemplate;
  modal.style.display = 'flex';
}

function closeTemplateModal() {
  const modal = document.getElementById('template-modal');
  modal.style.display = 'none';
}

async function saveTemplate() {
  const newTemplate = document.getElementById('template-editor').value;
  
  try {
    const res = await fetch('/api/redaction/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: newTemplate })
    });
    
    if (!res.ok) throw new Error('Erreur sauvegarde template');
    
    defaultTemplate = newTemplate;
    closeTemplateModal();
    notify('Template sauvegardé', 'success');
  } catch (e) {
    notify('Erreur: ' + e.message, 'error');
  }
}

// Convertir BBCode en HTML pour l'aperçu
function bbcodeToHtml(text) {
  let html = text;
  
  // Headings [HEADING=x]...[/HEADING]
  html = html.replace(/\[HEADING=(\d)\](.*?)\[\/HEADING\]/gi, (match, level, content) => {
    return `<h${level}>${content}</h${level}>`;
  });
  
  // Gras [B]...[/B]
  html = html.replace(/\[B\](.*?)\[\/B\]/gi, '<strong>$1</strong>');
  
  // Italique [I]...[/I]
  html = html.replace(/\[I\](.*?)\[\/I\]/gi, '<em>$1</em>');
  
  // Liens [URL='...']...[/URL]
  html = html.replace(/\[URL='(.*?)'\](.*?)\[\/URL\]/gi, '<a href="$1" target="_blank">$2</a>');
  html = html.replace(/\[URL=(.*?)\](.*?)\[\/URL\]/gi, '<a href="$1" target="_blank">$2</a>');
  
  // Code [CODE]...[/CODE]
  html = html.replace(/\[CODE\](.*?)\[\/CODE\]/gi, '<code>$1</code>');
  
  // Quote [QUOTE]...[/QUOTE]
  html = html.replace(/\[QUOTE\](.*?)\[\/QUOTE\]/gi, '<blockquote>$1</blockquote>');
  
  // Size [SIZE=x]...[/SIZE]
  html = html.replace(/\[SIZE=(\d+)\](.*?)\[\/SIZE\]/gi, '<span style="font-size: $1px">$2</span>');
  
  // Liste [*]
  html = html.replace(/\[\*\]\s*(.*?)(?=\n|$)/gi, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/gi, '<ul>$&</ul>');
  
  // Retours à la ligne
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

// Modal d'aperçu
function openPreviewModal() {
  const content = document.getElementById('markdown-editor').value;
  const html = bbcodeToHtml(content);
  
  document.getElementById('preview-content').innerHTML = html;
  document.getElementById('preview-modal').style.display = 'flex';
}

function closePreviewModal() {
  document.getElementById('preview-modal').style.display = 'none';
}

// Event listeners
document.getElementById('btn-new-doc').addEventListener('click', newDocument);
document.getElementById('btn-config-template').addEventListener('click', openTemplateModal);
document.getElementById('btn-preview').addEventListener('click', openPreviewModal);
document.getElementById('btn-post-forum').addEventListener('click', postToForum);
document.getElementById('btn-save-doc').addEventListener('click', saveDocument);
document.getElementById('btn-copy-markdown').addEventListener('click', copyMarkdown);
document.getElementById('btn-insert-resource').addEventListener('click', openResourceModal);

document.getElementById('markdown-editor').addEventListener('input', updateEditorStats);

document.getElementById('resource-search').addEventListener('input', renderProductsList);

// Toolbar buttons
document.querySelectorAll('.toolbar-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const format = btn.getAttribute('data-format');
    const level = btn.getAttribute('data-level') || 1;
    applyFormat(format, parseInt(level));
  });
});

// Close modal on background click
document.getElementById('resource-modal').addEventListener('click', (e) => {
  if (e.target.id === 'resource-modal') closeResourceModal();
});

document.getElementById('template-modal').addEventListener('click', (e) => {
  if (e.target.id === 'template-modal') closeTemplateModal();
});

// Raccourcis clavier
document.getElementById('markdown-editor').addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key.toLowerCase()) {
      case 'b':
        e.preventDefault();
        applyFormat('bold');
        break;
      case 'i':
        e.preventDefault();
        applyFormat('italic');
        break;
      case 's':
        e.preventDefault();
        saveDocument();
        break;
    }
  }
});

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  feather.replace();
  
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-icon-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
  
  await loadTemplate();
  await loadRecueil();
  await loadDocuments();
  
  if (documents.length === 0) {
    newDocument();
  }
  
  updateEditorStats();
});
