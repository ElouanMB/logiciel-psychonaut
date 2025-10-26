let notyf = null;
let recueilData = [];
let currentEditingProduct = null;
let resourcesCounter = 0;

async function json(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function notify(message, type = 'success') {
  if (!notyf) notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
  notyf[type](message);
}

// Load recueil data
async function loadRecueil() {
  try {
    const data = await json('/api/recueil');
    recueilData = data.products || [];
    renderProducts();
  } catch (e) {
    console.error('Error loading recueil:', e);
    recueilData = [];
    renderProducts();
  }
}

// Save recueil data
async function saveRecueil() {
  try {
    await json('/api/recueil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: recueilData })
    });
    notify('Recueil enregistré', 'success');
  } catch (e) {
    notify('Erreur: ' + e.message, 'error');
  }
}

// Render products grid
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  
  const filteredProducts = recueilData.filter(p => 
    p.name.toLowerCase().includes(searchQuery)
  );
  
  if (filteredProducts.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'flex';
    emptyState.style.flexDirection = 'column';
    emptyState.style.alignItems = 'center';
    return;
  }
  
  grid.style.display = 'grid';
  emptyState.style.display = 'none';
  grid.innerHTML = '';
  
  filteredProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const header = document.createElement('div');
    header.className = 'product-header';
    
    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;
    
    const actions = document.createElement('div');
    actions.className = 'product-actions';
    
    const btnExport = document.createElement('button');
    btnExport.className = 'icon-btn';
    btnExport.title = 'Exporter en PDF';
    btnExport.innerHTML = '<i data-feather="download"></i>';
    btnExport.onclick = () => exportProductPDF(product);
    
    const btnEdit = document.createElement('button');
    btnEdit.className = 'icon-btn';
    btnEdit.title = 'Modifier';
    btnEdit.innerHTML = '<i data-feather="edit-2"></i>';
    btnEdit.onclick = () => editProduct(product);
    
    const btnDelete = document.createElement('button');
    btnDelete.className = 'icon-btn danger';
    btnDelete.title = 'Supprimer';
    btnDelete.innerHTML = '<i data-feather="trash-2"></i>';
    btnDelete.onclick = () => deleteProduct(product);
    
    actions.appendChild(btnExport);
    actions.appendChild(btnEdit);
    actions.appendChild(btnDelete);
    
    header.appendChild(name);
    header.appendChild(actions);
    card.appendChild(header);
    
    if (product.resources && product.resources.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'resources';
      
      product.resources.forEach(res => {
        const li = document.createElement('li');
        li.className = 'resource-item';
        
        const title = document.createElement('div');
        title.className = 'resource-title';
        title.textContent = res.title;
        
        const meta = document.createElement('div');
        meta.className = 'resource-meta';
        
        const link = document.createElement('a');
        link.className = 'resource-link';
        link.href = res.url;
        link.target = '_blank';
        link.textContent = 'Ouvrir';
        link.innerHTML = '<i data-feather="external-link"></i> Ouvrir';
        
        const lang = document.createElement('span');
        lang.className = 'lang-badge';
        lang.textContent = res.lang;
        
        meta.appendChild(link);
        meta.appendChild(lang);
        
        li.appendChild(title);
        li.appendChild(meta);
        ul.appendChild(li);
      });
      
      card.appendChild(ul);
    } else {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.style.textAlign = 'center';
      empty.style.padding = '20px 0';
      empty.textContent = 'Aucune ressource';
      card.appendChild(empty);
    }
    
    grid.appendChild(card);
  });
  
  if (window.feather) window.feather.replace();
}

// Open product modal
function openProductModal(product = null) {
  currentEditingProduct = product;
  resourcesCounter = 0;
  
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('modal-title');
  const nameInput = document.getElementById('product-name');
  const resourcesList = document.getElementById('resources-list');
  
  title.textContent = product ? 'Modifier le produit' : 'Nouveau produit';
  nameInput.value = product ? product.name : '';
  resourcesList.innerHTML = '';
  
  if (product && product.resources) {
    product.resources.forEach(res => addResourceForm(res));
  } else {
    addResourceForm();
  }
  
  modal.style.display = 'flex';
  if (window.feather) window.feather.replace();
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
  currentEditingProduct = null;
}

// Add resource form
function addResourceForm(resource = null) {
  const resourcesList = document.getElementById('resources-list');
  const id = resourcesCounter++;
  
  const div = document.createElement('div');
  div.className = 'resource-form';
  div.dataset.id = id;
  
  div.innerHTML = `
    <div class="resource-form-row">
      <label>
        Titre
        <input type="text" class="resource-title-input" value="${resource ? resource.title : ''}" placeholder="Titre de la ressource" />
      </label>
      <label>
        Lien
        <input type="url" class="resource-url-input" value="${resource ? resource.url : ''}" placeholder="https://..." />
      </label>
      <label>
        Langue
        <select class="resource-lang-input">
          <option value="FR" ${resource && resource.lang === 'FR' ? 'selected' : ''}>FR</option>
          <option value="EN" ${resource && resource.lang === 'EN' ? 'selected' : ''}>EN</option>
        </select>
      </label>
    </div>
    <div class="resource-form-actions">
      <button class="icon-btn danger" onclick="removeResourceForm(${id})" title="Supprimer">
        <i data-feather="trash-2"></i>
      </button>
    </div>
  `;
  
  resourcesList.appendChild(div);
  if (window.feather) window.feather.replace();
}

function removeResourceForm(id) {
  const form = document.querySelector(`[data-id="${id}"]`);
  if (form) form.remove();
}

// Save product
function saveProduct() {
  const name = document.getElementById('product-name').value.trim();
  if (!name) {
    notify('Le nom du produit est requis', 'error');
    return;
  }
  
  const resourceForms = document.querySelectorAll('.resource-form');
  const resources = [];
  
  resourceForms.forEach(form => {
    const title = form.querySelector('.resource-title-input').value.trim();
    const url = form.querySelector('.resource-url-input').value.trim();
    const lang = form.querySelector('.resource-lang-input').value;
    
    if (title && url) {
      resources.push({ title, url, lang });
    }
  });
  
  if (currentEditingProduct) {
    // Update existing product
    const index = recueilData.findIndex(p => p.id === currentEditingProduct.id);
    if (index !== -1) {
      recueilData[index] = { ...currentEditingProduct, name, resources };
    }
  } else {
    // Add new product
    const id = Date.now().toString();
    recueilData.push({ id, name, resources });
  }
  
  saveRecueil();
  renderProducts();
  closeProductModal();
}

// Edit product
function editProduct(product) {
  openProductModal(product);
}

// Delete product
function deleteProduct(product) {
  if (!confirm(`Supprimer le produit "${product.name}" ?`)) return;
  
  recueilData = recueilData.filter(p => p.id !== product.id);
  saveRecueil();
  renderProducts();
  notify('Produit supprimé', 'success');
}

// Export single product to PDF
function exportProductPDF(product) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text(product.name, 20, 20);
  
  doc.setFontSize(12);
  let y = 40;
  
  if (product.resources && product.resources.length > 0) {
    doc.text('Ressources:', 20, y);
    y += 10;
    
    product.resources.forEach((res, index) => {
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${res.title}`, 25, y);
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${res.url} [${res.lang}]`, 30, y);
      doc.setTextColor(0, 0, 0);
      y += 10;
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  } else {
    doc.text('Aucune ressource', 20, y);
  }
  
  doc.save(`${product.name.replace(/[^a-z0-9]/gi, '_')}_ressources.pdf`);
  notify('PDF exporté', 'success');
}

// Export all products to PDF
function exportAllPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text('Recueil de Ressources', 20, 20);
  
  let y = 40;
  
  recueilData.forEach((product, pIndex) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(16);
    doc.text(product.name, 20, y);
    y += 10;
    
    if (product.resources && product.resources.length > 0) {
      doc.setFontSize(11);
      product.resources.forEach((res, rIndex) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(`${rIndex + 1}. ${res.title}`, 25, y);
        y += 7;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`${res.url} [${res.lang}]`, 30, y);
        doc.setTextColor(0, 0, 0);
        y += 7;
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Aucune ressource', 25, y);
      doc.setTextColor(0, 0, 0);
      y += 7;
    }
    
    y += 10;
  });
  
  doc.save('recueil_complet.pdf');
  notify('PDF complet exporté', 'success');
}

// Event listeners
document.getElementById('btn-add-product').addEventListener('click', () => openProductModal());
document.getElementById('btn-add-resource').addEventListener('click', () => addResourceForm());
document.getElementById('btn-save-product').addEventListener('click', saveProduct);
document.getElementById('btn-export-all').addEventListener('click', exportAllPDF);
document.getElementById('search-input').addEventListener('input', renderProducts);

// Close modal on background click
document.getElementById('product-modal').addEventListener('click', (e) => {
  if (e.target.id === 'product-modal') closeProductModal();
});

// Initialize
loadRecueil();
if (window.feather) window.feather.replace();
