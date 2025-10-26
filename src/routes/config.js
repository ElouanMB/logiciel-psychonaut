const express = require('express');
const router = express.Router();
const configService = require('../services/configService');
const authService = require('../services/authService');

// Get config (password masked)
router.get('/config', (req, res) => {
  try {
    const config = configService.getConfig();
    res.json({ ok: true, ...config });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Save config
router.post('/config', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = configService.saveConfig(username, password);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Verify login
router.get('/verify-login', async (req, res) => {
  try {
    const profile = await authService.verifyLogin();
    res.json({ ok: true, profile });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

module.exports = router;
