const express = require('express');
const router = express.Router();
const recueilService = require('../services/recueilService');

// Get recueil data
router.get('/', (req, res) => {
  try {
    const products = recueilService.getProducts();
    res.json({ ok: true, products });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Save recueil data
router.post('/', (req, res) => {
  try {
    const { products } = req.body;
    const result = recueilService.saveProducts(products);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

module.exports = router;
