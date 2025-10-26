async function json(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function el(id) { return document.getElementById(id); }

async function loadFiles() {
  try {
    const { files } = await json('/api/results/list');
    const ul = el('files');
    ul.innerHTML = '';
    files.forEach(f => {
      const li = document.createElement('li');
      li.className = 'file-item';
      const link = document.createElement('a');
      link.className = 'file-link';
      link.href = `/results/${encodeURIComponent(f.name)}`;
      link.setAttribute('download', f.name);
      link.innerHTML = `<span class="name">${f.name}</span> <span class="date muted">(${new Date(f.modifiedAt).toLocaleString()})</span>`;

      const actions = document.createElement('div');
      actions.className = 'file-actions';

      const btnRename = document.createElement('button');
      btnRename.className = 'icon-btn';
      btnRename.title = 'Renommer';
      btnRename.innerHTML = '<i data-feather="edit-2"></i>';
      btnRename.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newName = prompt('Nouveau nom du fichier (.json sera ajouté si absent):', f.name);
        if (!newName) return;
        try {
          const resp = await json('/api/results/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldName: f.name, newName })
          });
          await loadFiles();
        } catch (err) {
          alert('Erreur de renommage: ' + err.message);
        }
      });

      const btnDelete = document.createElement('button');
      btnDelete.className = 'icon-btn danger';
      btnDelete.title = 'Supprimer';
      btnDelete.innerHTML = '<i data-feather="trash-2"></i>';
      btnDelete.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Supprimer ${f.name} ?`)) return;
        try {
          await json(`/api/results/file?name=${encodeURIComponent(f.name)}`, { method: 'DELETE' });
          await loadFiles();
        } catch (err) {
          alert('Erreur de suppression: ' + err.message);
        }
      });

      actions.appendChild(btnRename);
      actions.appendChild(btnDelete);

      li.appendChild(link);
      li.appendChild(actions);
      ul.appendChild(li);
    });
    if (window.feather) { window.feather.replace(); }
  } catch (e) {
    console.error(e);
  }
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
  // Gentle fake progression while waiting for backend (no infinite loop)
  let timers = [];
  function setBar(p){ bar.style.width = p + '%'; }
  setBar(15);
  timers.push(setTimeout(()=> setBar(40), 700));
  timers.push(setTimeout(()=> setBar(65), 1800));
  timers.push(setTimeout(()=> setBar(82), 3600));
  try {
    const resp = await json('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages: pages ? parseInt(pages, 10) : undefined, outName: outName || undefined })
    });
    // After run, compute concise stats from the produced JSON
    let resultData = null;
    if (resp && resp.outFile) {
      const base = resp.outFile.split(/[\\\/]/).pop();
      try {
        const data = await json(`/api/results/file?name=${encodeURIComponent(base)}`);
        resultData = data.result;
      } catch (e) { /* ignore, fallback below */ }
    }
    if (!resultData) {
      try {
        const latest = await json('/api/results/latest');
        resultData = latest.result || null;
      } catch (e) {/* ignore */}
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
      setBar(100);
    } else {
      if (resp && resp.ok) {
        runStats.innerHTML = '<span class="chip info">Terminé</span>';
        setBar(100);
      } else {
        runStats.innerHTML = '<span class="chip unknown">Échec de l\'analyse</span>';
        progress.classList.add('error');
        setBar(100);
      }
    }
  // Refresh file list
  await loadFiles();
  } catch (e) {
    runStats.innerHTML = `<span class="chip unknown">Erreur: ${e.message}</span>`;
    progress.classList.add('error');
    setBar(100);
  }
  // Clear timers and hide progress bar after a short delay
  timers.forEach(t => clearTimeout(t));
  setTimeout(() => { progress.style.display = 'none'; bar.style.width = '0%'; }, 800);
});

loadFiles();
