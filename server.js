// Simple dashboard web UI to run the analyzer and view results
const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = process.cwd();
const RESULTS_DIR = path.resolve(ROOT, 'results');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(ROOT, 'public')));
// Expose ressources/ so images can be used in the UI
app.use('/ressources', express.static(path.join(ROOT, 'ressources')));
// Expose results/ for direct downloads
app.use('/results', express.static(path.join(ROOT, 'results')));

function listResults() {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  const files = fs.readdirSync(RESULTS_DIR)
    .filter(f => f.toLowerCase().endsWith('.json'))
    .map(f => {
      const p = path.join(RESULTS_DIR, f);
      const stat = fs.statSync(p);
      return { name: f, path: p, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return files;
}

app.get('/api/results/list', (req, res) => {
  try {
    const files = listResults().map(f => ({ name: f.name, modifiedAt: new Date(f.mtime).toISOString() }));
    res.json({ ok: true, files });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/results/latest', (req, res) => {
  try {
    const files = listResults();
    if (!files.length) return res.json({ ok: true, result: null });
    const latest = files[0];
    const content = JSON.parse(fs.readFileSync(latest.path, 'utf8'));
    res.json({ ok: true, file: latest.name, result: content });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/results/file', (req, res) => {
  try {
    const name = req.query.name || '';
    if (!name) return res.status(400).json({ ok: false, error: 'Missing name' });
    const safe = path.basename(name);
    const p = path.join(RESULTS_DIR, safe);
    if (!fs.existsSync(p)) return res.status(404).json({ ok: false, error: 'Not found' });
    const content = JSON.parse(fs.readFileSync(p, 'utf8'));
    res.json({ ok: true, file: safe, result: content });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Delete a result file
app.delete('/api/results/file', (req, res) => {
  try {
    const name = req.query.name || '';
    if (!name) return res.status(400).json({ ok: false, error: 'Missing name' });
    const safe = path.basename(name);
    const p = path.join(RESULTS_DIR, safe);
    if (!fs.existsSync(p)) return res.status(404).json({ ok: false, error: 'Not found' });
    fs.unlinkSync(p);
    res.json({ ok: true, deleted: safe });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Rename a result file
app.post('/api/results/rename', (req, res) => {
  try {
    const oldName = (req.body.oldName || '').trim();
    let newName = (req.body.newName || '').trim();
    if (!oldName || !newName) return res.status(400).json({ ok: false, error: 'Missing names' });
    const safeOld = path.basename(oldName);
    if (!newName.toLowerCase().endsWith('.json')) newName += '.json';
    const safeNew = path.basename(newName);
    const pOld = path.join(RESULTS_DIR, safeOld);
    const pNew = path.join(RESULTS_DIR, safeNew);
    if (!fs.existsSync(pOld)) return res.status(404).json({ ok: false, error: 'Source not found' });
    if (fs.existsSync(pNew)) return res.status(409).json({ ok: false, error: 'Target exists' });
    fs.renameSync(pOld, pNew);
    res.json({ ok: true, from: safeOld, to: safeNew });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/run', (req, res) => {
  const pages = Number.isFinite(req.body.pages) ? req.body.pages : parseInt(req.body.pages || '', 10);
  let outName = (req.body.outName || '').trim();
  if (outName && !outName.toLowerCase().endsWith('.json')) outName += '.json';
  const outPath = outName ? path.join(RESULTS_DIR, outName) : null;

  const args = ['analyze-threads-online.js'];
  if (pages && pages > 0) { args.push('--pages', String(pages)); }
  if (outPath) {
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    args.push('--out', outPath);
  }

  const child = spawn(process.execPath, args, { cwd: ROOT, env: process.env });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', d => { stdout += d.toString(); });
  child.stderr.on('data', d => { stderr += d.toString(); });
  child.on('error', err => {
    res.status(500).json({ ok: false, error: err.message });
  });
  child.on('close', code => {
    // Parse the output file path if analyzer printed it
    let outFile = null;
    const m = stdout.match(/Écrit:\s*(.+)$/m);
    if (m) {
      outFile = m[1].trim();
    } else if (outPath) {
      outFile = outPath;
    }
    res.json({ ok: code === 0, code, outFile, stdout, stderr });
  });
});

app.listen(PORT, () => {
  console.log(`Dashboard disponible sur http://localhost:${PORT}`);
});
