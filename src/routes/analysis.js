const express = require('express');
const router = express.Router();
const analysisService = require('../services/analysisService');

// Run analysis (classic endpoint)
router.post('/run', async (req, res) => {
  try {
    const pages = Number.isFinite(req.body.pages) ? req.body.pages : parseInt(req.body.pages || '', 10);
    const outName = req.body.outName || '';

    const result = await analysisService.runAnalysis(pages, outName);
    res.json({ ok: result.ok, ...result, progress: 100 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Run analysis with SSE streaming
router.get('/run-stream', (req, res) => {
  const pages = parseInt(req.query.pages, 10) || 0;
  const outName = req.query.outName || '';

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { child, outPath } = analysisService.spawnAnalysis(pages, outName);
  let stdout = '';
  let stderr = '';
  
  child.stdout.on('data', d => { 
    const chunk = d.toString();
    stdout += chunk;
    
    // Parse and send progress
    const progressMatch = chunk.match(/PROGRESS:\s*(\d+)%/);
    if (progressMatch) {
      const progress = parseInt(progressMatch[1], 10);
      res.write(`data: ${JSON.stringify({ type: 'progress', progress })}\n\n`);
    }
  });
  
  child.stderr.on('data', d => { 
    stderr += d.toString(); 
  });
  
  child.on('close', code => {
    let outFile = null;
    const m = stdout.match(/Écrit:\s*(.+)$/m);
    if (m) {
      outFile = m[1].trim();
    } else if (outPath) {
      outFile = outPath;
    }
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      ok: code === 0, 
      code, 
      outFile, 
      stdout, 
      stderr 
    })}\n\n`);
    res.end();
  });

  child.on('error', err => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  });

  req.on('close', () => {
    child.kill();
  });
});

module.exports = router;
