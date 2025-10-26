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
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = `${f.name} (${new Date(f.modifiedAt).toLocaleString()})`;
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        const data = await json(`/api/results/file?name=${encodeURIComponent(f.name)}`);
        renderResult(data.file, data.result);
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
  } catch (e) {
    console.error(e);
  }
}

function renderResult(fileName, result) {
  el('latest-meta').textContent = fileName ? `Fichier: ${fileName}` : '—';
  if (!result) {
    el('latest-summary').textContent = 'Aucun résultat';
    el('latest-list').innerHTML = '';
    return;
  }
  // Summary
  const flatIds = result.flatMap(r => r.identifiers || []);
  const druglab = flatIds.filter(i => i.type === 'druglab').length;
  const autre = flatIds.filter(i => i.type === 'autre').length;
  const missing = result.filter(r => (r.identifiers || []).length === 0).length;
  el('latest-summary').textContent = `Threads: ${result.length} • Sans identifiant: ${missing} • DrugLab: ${druglab} • Autre: ${autre}`;

  // List
  const container = el('latest-list');
  container.innerHTML = '';
  const list = document.createElement('ul');
  result.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${r.url}" target="_blank">${r.title}</a>${r.closed ? ' [FERMÉ]' : ''}${r.label ? ` — <em>${r.label}</em>` : ''}`;
    if (r.identifiers && r.identifiers.length) {
      const sub = document.createElement('ul');
      r.identifiers.forEach(i => {
        const si = document.createElement('li');
        si.textContent = `${i.raw} (${i.type})`;
        if (i.psychoUrl) {
          const a = document.createElement('a');
          a.href = i.psychoUrl; a.target = '_blank'; a.textContent = ' Psychoactif';
          si.append(' — ', i.psychoFound ? 'Trouvé' : 'Non trouvé', ' (', a, ')');
        }
        if (i.druglabUrl) {
          const a = document.createElement('a');
          a.href = i.druglabUrl; a.target = '_blank'; a.textContent = ' DrugLab';
          si.append(' — ', i.druglabFound ? 'Trouvé' : 'Non trouvé', ' (', a, ')');
        }
        sub.appendChild(si);
      });
      li.appendChild(sub);
    } else if (r.missingIdentifier) {
      const p = document.createElement('div');
      p.className = 'muted';
      p.textContent = 'Aucun identifiant détecté';
      li.appendChild(p);
    }
    list.appendChild(li);
  });
  container.appendChild(list);
}

async function loadLatest() {
  try {
    const data = await json('/api/results/latest');
    renderResult(data.file, data.result);
  } catch (e) {
    console.error(e);
  }
}

document.getElementById('run-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pages = document.getElementById('pages').value;
  const outName = document.getElementById('outName').value;
  el('run-log').textContent = 'Analyse en cours…';
  try {
    const resp = await json('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages: pages ? parseInt(pages, 10) : undefined, outName: outName || undefined })
    });
    el('run-log').textContent = resp.stdout || '(aucune sortie)';
    await loadFiles();
    await loadLatest();
  } catch (e) {
    el('run-log').textContent = 'Erreur: ' + e.message;
  }
});

loadFiles();
loadLatest();
