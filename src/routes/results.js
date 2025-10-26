const express = require('express');
const router = express.Router();
const resultsService = require('../services/resultsService');

// Get list of result files
router.get('/list', (req, res) => {
  try {
    const files = resultsService.getFilesList();
    res.json({ ok: true, files });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Get latest result file
router.get('/latest', (req, res) => {
  try {
    const result = resultsService.getLatest();
    if (!result) return res.json({ ok: true, result: null });
    res.json({ ok: true, file: result.file, result: result.result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Get specific result file
router.get('/file', (req, res) => {
  try {
    const result = resultsService.getFileByName(req.query.name);
    res.json({ ok: true, file: result.file, result: result.result });
  } catch (e) {
    if (e.message === 'Not found') {
      return res.status(404).json({ ok: false, error: e.message });
    }
    if (e.message === 'Missing name') {
      return res.status(400).json({ ok: false, error: e.message });
    }
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Get summaries for all result files
router.get('/list-summaries', (req, res) => {
  try {
    const files = resultsService.getListSummaries();
    res.json({ ok: true, files });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Get global stats
router.get('/stats', (req, res) => {
  try {
    const stats = resultsService.getStats();
    res.json({ ok: true, ...stats });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Delete a result file
router.delete('/file', (req, res) => {
  try {
    const result = resultsService.deleteFile(req.query.name);
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e.message === 'Not found') {
      return res.status(404).json({ ok: false, error: e.message });
    }
    if (e.message === 'Missing name') {
      return res.status(400).json({ ok: false, error: e.message });
    }
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Rename a result file
router.post('/rename', (req, res) => {
  try {
    const result = resultsService.renameFile(req.body.oldName?.trim(), req.body.newName?.trim());
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e.message === 'Source not found') {
      return res.status(404).json({ ok: false, error: e.message });
    }
    if (e.message === 'Target exists') {
      return res.status(409).json({ ok: false, error: e.message });
    }
    if (e.message === 'Missing names') {
      return res.status(400).json({ ok: false, error: e.message });
    }
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
