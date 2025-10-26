async function json(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function el(id) { return document.getElementById(id); }

let filesCache = [];
let notyf = null;

async function loadFiles() {
  try {
    const { files } = await json('/api/results/list-summaries');
    filesCache = files;
    renderFiles();
    await loadGlobalStats();
  } catch (e) {
    console.error(e);
  }
}

function renderFiles() {
  const ul = el('files');
  ul.innerHTML = '';
  const q = (el('file-search')?.value || '').toLowerCase();
  const sort = el('file-sort')?.value || 'recent';
  let items = [...filesCache];
  if (q) items = items.filter(f => f.name.toLowerCase().includes(q));
  if (sort === 'name-asc') items.sort((a,b)=> a.name.localeCompare(b.name, 'fr', {sensitivity:'base'}));
  else if (sort === 'name-desc') items.sort((a,b)=> b.name.localeCompare(a.name, 'fr', {sensitivity:'base'}));
  else items.sort((a,b)=> new Date(b.modifiedAt) - new Date(a.modifiedAt));

  items.forEach(f => {
    const li = document.createElement('li');
    li.className = 'file-item';
    const link = document.createElement('a');
    link.className = 'file-link';
    link.href = `/results/${encodeURIComponent(f.name)}`;
    link.setAttribute('download', f.name);
    link.innerHTML = `<span class="name">${f.name}</span> <span class="date muted">(${new Date(f.modifiedAt).toLocaleString()})</span>`;

    const actions = document.createElement('div');
    actions.className = 'file-actions';
    
    // View details button
    const btnView = document.createElement('button');
    btnView.className = 'icon-btn';
    btnView.title = 'Voir les détails';
    btnView.innerHTML = '<i data-feather="search"></i>';
    btnView.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await showFileDetails(f.name);
    });

    const btnRename = document.createElement('button');
    btnRename.className = 'icon-btn';
    btnRename.title = 'Renommer';
    btnRename.innerHTML = '<i data-feather="edit-2"></i>';
    btnRename.addEventListener('click', (e) => startInlineRename(e, li, f));

    const btnDelete = document.createElement('button');
    btnDelete.className = 'icon-btn danger';
    btnDelete.title = 'Supprimer';
    btnDelete.innerHTML = '<i data-feather="trash-2"></i>';
    btnDelete.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!confirm(`Supprimer ${f.name} ?`)) return;
      try { await json(`/api/results/file?name=${encodeURIComponent(f.name)}`, { method: 'DELETE' });
        notify('Fichier supprimé', 'success');
        await loadFiles();
      } catch (err) { notify('Erreur: ' + err.message, 'error'); }
    });

    actions.appendChild(btnView);
    actions.appendChild(btnRename);
    actions.appendChild(btnDelete);
    li.appendChild(link);
    li.appendChild(actions);
    // Summary line with thread status
    const sum = document.createElement('div');
    sum.className = 'file-summary';
    sum.innerHTML = `<span class="muted">Threads: ${f.threads || 0} • Ouverts: ${f.openThreads || 0} • Fermés: ${f.closedThreads || 0}</span>`;
    const chips = document.createElement('div');
    chips.className = 'label-chips';
    (f.byLabel || []).forEach(entry => {
      const cls = String(entry.label || 'Sans label').toLowerCase();
      const chip = document.createElement('span');
      chip.className = `chip ${cls}`;
      chip.textContent = `${entry.label || 'Sans label'}: ${entry.count}`;
      chips.appendChild(chip);
    });
    sum.appendChild(chips);
    li.appendChild(sum);
    // Collapsible preview - removed
    ul.appendChild(li);
  });
  if (window.feather) { window.feather.replace(); }
}

function startInlineRename(e, li, f){
  e.preventDefault(); e.stopPropagation();
  const link = li.querySelector('.file-link');
  const actions = li.querySelector('.file-actions');
  link.style.display = 'none';
  actions.style.display = 'none';

  const editWrap = document.createElement('div');
  editWrap.style.display = 'flex';
  editWrap.style.alignItems = 'center';
  editWrap.style.gap = '8px';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = f.name;
  const ok = document.createElement('button'); ok.className = 'icon-btn'; ok.innerHTML = '<i data-feather="check"></i>';
  const cancel = document.createElement('button'); cancel.className = 'icon-btn'; cancel.innerHTML = '<i data-feather="x"></i>';
  editWrap.appendChild(input); editWrap.appendChild(ok); editWrap.appendChild(cancel);
  li.insertBefore(editWrap, li.firstChild);
  if (window.feather) window.feather.replace();

  cancel.addEventListener('click', ()=>{
    li.removeChild(editWrap); link.style.display=''; actions.style.display='';
  });
  ok.addEventListener('click', async ()=>{
    let newName = input.value.trim(); if (!newName) return;
    try {
      await json('/api/results/rename', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ oldName: f.name, newName }) });
      notify('Fichier renommé', 'success');
      await loadFiles();
    } catch (err) { notify('Erreur: ' + err.message, 'error'); }
  });
}

function notify(msg, type){
  try {
    if (!notyf && window.Notyf) notyf = new Notyf({ duration: 2000, position: { x:'right', y:'top' } });
    if (notyf) {
      if (type === 'error') notyf.error(msg); else notyf.success(msg);
    } else {
      console[type === 'error' ? 'error' : 'log'](msg);
    }
  } catch { console.log(msg); }
}

async function loadGlobalStats(){
  // Stats band hidden, do nothing
  return;
}
// Removed latest panel rendering

document.getElementById('run-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pages = document.getElementById('pages').value;
  const outName = document.getElementById('outName').value;
  // Show progress bar (determinate style) and clear previous stats
  const progress = el('progress');
  const bar = progress.querySelector('.bar');
  const runStats = el('run-stats');
  progress.classList.remove('error');
  bar.style.width = '0%';
  progress.style.display = 'block';
  runStats.innerHTML = '<span class="muted">Analyse en cours…</span>';
  
  function setBar(p){ bar.style.width = p + '%'; }
  
  try {
    // Use EventSource for real-time progress
    const params = new URLSearchParams();
    if (pages) params.append('pages', pages);
    if (outName) params.append('outName', outName);
    
    const eventSource = new EventSource(`/api/run-stream?${params.toString()}`);
    let resp = null;
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'progress') {
        setBar(data.progress);
      } else if (data.type === 'complete') {
        resp = data;
        eventSource.close();
        handleAnalysisComplete(resp, bar, runStats, progress);
      } else if (data.type === 'error') {
        eventSource.close();
        throw new Error(data.error);
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      runStats.innerHTML = '<span class="chip unknown">Erreur de connexion</span>';
      progress.classList.add('error');
      setBar(100);
    };
    
  } catch (e) {
    runStats.innerHTML = `<span class="chip unknown">Erreur: ${e.message}</span>`;
    progress.classList.add('error');
    setBar(100);
  }
});

async function handleAnalysisComplete(resp, bar, runStats, progress) {
  try {
    console.log('Réponse de /api/run:', resp);
    
    // After run, compute concise stats from the produced JSON
    let resultData = null;
    if (resp && resp.outFile) {
      const base = resp.outFile.split(/[\\\/]/).pop();
      console.log('Tentative de chargement du fichier:', base);
      try {
        const data = await json(`/api/results/file?name=${encodeURIComponent(base)}`);
        resultData = data.result;
      } catch (e) { 
        console.warn('Impossible de charger le fichier généré:', base, e);
        console.log('stdout:', resp.stdout);
        console.log('stderr:', resp.stderr);
      }
    }
    if (!resultData) {
      try {
        const latest = await json('/api/results/latest');
        resultData = latest.result || null;
      } catch (e) {
        console.warn('Impossible de charger le dernier résultat:', e);
      }
    }
    if (Array.isArray(resultData)) {
      const frag = document.createDocumentFragment();
      const wrap = document.createElement('div');
      wrap.className = 'summary';
      const labelSet2 = new Set(resultData.map(r => r.label || 'Sans label'));
      wrap.innerHTML = `
        <span class=\"chip info\">Threads: ${resultData.length}</span>
        <span class=\"chip info\">Labels: ${labelSet2.size}</span>
      `;
      frag.appendChild(wrap);
      // Ajouter une répartition par label (nombre de threads)
      const byLabel = new Map();
      resultData.forEach(r => {
        const key = r.label || 'Sans label';
        byLabel.set(key, (byLabel.get(key) || 0) + 1);
      });
      const wrapLabels = document.createElement('div');
      wrapLabels.className = 'summary';
      const chips = Array.from(byLabel.entries())
        .sort((a,b)=> String(a[0]).localeCompare(String(b[0]), 'fr', {sensitivity:'base'}))
        .map(([k,v])=> `<span class=\"chip info\">${k}: ${v}</span>`)
        .join(' ');
      wrapLabels.innerHTML = `<span class=\"muted\">Threads par label:</span> ${chips}`;
      frag.appendChild(wrapLabels);
      runStats.innerHTML = '';
      runStats.appendChild(frag);
      bar.style.width = '100%';
    } else {
      if (resp && resp.ok) {
        runStats.innerHTML = '<span class="chip info">Terminé</span>';
        bar.style.width = '100%';
      } else {
        runStats.innerHTML = '<span class="chip unknown">Échec de l\'analyse</span>';
        progress.classList.add('error');
        bar.style.width = '100%';
      }
    }
    // Refresh file list
    await loadFiles();
    
    // Hide progress bar after a short delay
    setTimeout(() => { progress.style.display = 'none'; bar.style.width = '0%'; }, 800);
  } catch (e) {
    runStats.innerHTML = `<span class="chip unknown">Erreur: ${e.message}</span>`;
    progress.classList.add('error');
    bar.style.width = '100%';
    setTimeout(() => { progress.style.display = 'none'; bar.style.width = '0%'; }, 800);
  }
}

// Init
document.getElementById('file-search')?.addEventListener('input', renderFiles);
document.getElementById('file-sort')?.addEventListener('change', renderFiles);
loadFiles();

// Details panel management
let currentFileData = null;
let currentFilters = {
  label: '',
  status: '',
  results: '',
  sortDate: 'desc'
};

async function showFileDetails(fileName) {
  try {
    const data = await json(`/api/results/file?name=${encodeURIComponent(fileName)}`);
    currentFileData = data.result;
    
    // Show panel
    const panel = el('details-panel');
    panel.style.display = 'block';
    el('details-title').textContent = `Détails: ${fileName}`;
    
    // Reset filters
    currentFilters = { label: '', status: '', results: '', sortDate: 'desc' };
    
    // Populate label filter
    const labels = new Set();
    currentFileData.forEach(t => {
      if (t.label) labels.add(t.label);
    });
    const labelFilter = el('filter-label');
    labelFilter.innerHTML = '<option value="">Tous les labels</option>';
    Array.from(labels).sort().forEach(label => {
      const opt = document.createElement('option');
      opt.value = label;
      opt.textContent = label;
      labelFilter.appendChild(opt);
    });
    
    renderDetails();
  } catch (e) {
    notify('Erreur: ' + e.message, 'error');
  }
}

function renderDetails() {
  if (!currentFileData) return;
  
  let threads = [...currentFileData];
  
  // Apply filters
  if (currentFilters.label) {
    threads = threads.filter(t => t.label === currentFilters.label);
  }
  if (currentFilters.status === 'open') {
    threads = threads.filter(t => !t.closed);
  } else if (currentFilters.status === 'closed') {
    threads = threads.filter(t => t.closed);
  }
  if (currentFilters.results === 'found') {
    threads = threads.filter(t => t.identifiers && t.identifiers.some(id => id.psychoFound || id.druglabFound));
  } else if (currentFilters.results === 'notfound') {
    threads = threads.filter(t => !t.identifiers || !t.identifiers.some(id => id.psychoFound || id.druglabFound));
  }
  
  // Categorize threads
  const openWithResults = [];
  const openWithoutResults = [];
  const closed = [];
  
  threads.forEach(t => {
    const hasResult = t.identifiers && t.identifiers.some(id => id.psychoFound || id.druglabFound);
    if (t.closed) {
      closed.push(t);
    } else if (hasResult) {
      openWithResults.push(t);
    } else {
      openWithoutResults.push(t);
    }
  });
  
  // Sort by date within each category
  const sortFn = (a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return currentFilters.sortDate === 'desc' ? dateB - dateA : dateA - dateB;
  };
  
  openWithResults.sort(sortFn);
  openWithoutResults.sort(sortFn);
  closed.sort(sortFn);
  
  // Render
  const content = el('details-content');
  content.innerHTML = '';
  
  // Always show all 3 categories
  content.appendChild(createCategorySection('Ouverts avec résultats', openWithResults, 'open'));
  content.appendChild(createCategorySection('Ouverts sans résultats', openWithoutResults, 'open'));
  content.appendChild(createCategorySection('Fermés', closed, 'closed'));
  
  if (window.feather) window.feather.replace();
}

function createCategorySection(title, threads, status) {
  const section = document.createElement('div');
  section.className = 'thread-category';
  
  const heading = document.createElement('h3');
  heading.innerHTML = `${title} <span class="count">(${threads.length})</span>`;
  section.appendChild(heading);
  
  if (threads.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.style.textAlign = 'center';
    empty.style.padding = '20px';
    empty.textContent = 'Aucun thread';
    section.appendChild(empty);
    return section;
  }
  
  threads.forEach(thread => {
    const item = document.createElement('div');
    item.className = 'thread-item';
    
    // Title
    const titleEl = document.createElement('div');
    titleEl.className = 'thread-title';
    const titleLink = document.createElement('a');
    titleLink.href = thread.url;
    titleLink.target = '_blank';
    titleLink.textContent = thread.title;
    titleEl.appendChild(titleLink);
    item.appendChild(titleEl);
    
    // Meta info
    const meta = document.createElement('div');
    meta.className = 'thread-meta';
    
    if (thread.createdAt) {
      const dateItem = document.createElement('span');
      dateItem.className = 'meta-item';
      dateItem.innerHTML = `<i data-feather="calendar"></i> ${new Date(thread.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}`;
      meta.appendChild(dateItem);
    }
    
    if (thread.label) {
      const labelItem = document.createElement('span');
      labelItem.className = 'meta-item';
      labelItem.innerHTML = `<i data-feather="tag"></i> ${thread.label}`;
      meta.appendChild(labelItem);
    }
    
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge ${thread.closed ? 'closed' : 'open'}`;
    statusBadge.innerHTML = `<i data-feather="${thread.closed ? 'lock' : 'unlock'}"></i> ${thread.closed ? 'Fermé' : 'Ouvert'}`;
    meta.appendChild(statusBadge);
    
    item.appendChild(meta);
    
    // Identifiers
    if (thread.identifiers && thread.identifiers.length > 0) {
      const idContainer = document.createElement('div');
      idContainer.className = 'thread-identifiers';
      
      thread.identifiers.forEach(id => {
        const idEl = document.createElement('div');
        const found = id.psychoFound || id.druglabFound;
        idEl.className = `identifier ${found ? 'found' : 'notfound'}`;
        
        const icon = document.createElement('i');
        icon.setAttribute('data-feather', found ? 'check-circle' : 'x-circle');
        idEl.appendChild(icon);
        
        if (id.psychoUrl && id.psychoFound) {
          const link = document.createElement('a');
          link.href = id.psychoUrl;
          link.target = '_blank';
          link.textContent = id.canonical;
          idEl.appendChild(link);
        } else if (id.druglabUrl && id.druglabFound) {
          const link = document.createElement('a');
          link.href = id.druglabUrl;
          link.target = '_blank';
          link.textContent = id.canonical;
          idEl.appendChild(link);
        } else {
          const text = document.createTextNode(id.canonical);
          idEl.appendChild(text);
        }
        
        const statusText = document.createElement('span');
        statusText.textContent = found ? ' (Trouvé)' : ' (Non trouvé)';
        statusText.style.fontSize = '0.8rem';
        statusText.style.opacity = '0.7';
        idEl.appendChild(statusText);
        
        idContainer.appendChild(idEl);
      });
      
      item.appendChild(idContainer);
    }
    
    section.appendChild(item);
  });
  
  return section;
}

// Close details panel
el('close-details')?.addEventListener('click', () => {
  el('details-panel').style.display = 'none';
  currentFileData = null;
});

// Filter changes
el('filter-label')?.addEventListener('change', (e) => {
  currentFilters.label = e.target.value;
  renderDetails();
});
el('filter-status')?.addEventListener('change', (e) => {
  currentFilters.status = e.target.value;
  renderDetails();
});
el('filter-results')?.addEventListener('change', (e) => {
  currentFilters.results = e.target.value;
  renderDetails();
});
el('sort-date')?.addEventListener('change', (e) => {
  currentFilters.sortDate = e.target.value;
  renderDetails();
});
