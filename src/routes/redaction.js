const express = require('express');
const router = express.Router();
const redactionService = require('../services/redactionService');

// Récupérer le template par défaut (AVANT les routes avec :id)
router.get('/template', (req, res, next) => {
  try {
    const template = redactionService.getTemplate();
    res.json({ template });
  } catch (error) {
    next(error);
  }
});

// Sauvegarder le template par défaut
router.post('/template', (req, res, next) => {
  try {
    const { template } = req.body;
    
    if (!template) {
      return res.status(400).json({ error: 'Template requis' });
    }
    
    redactionService.saveTemplate(template);
    res.json({ message: 'Template sauvegardé', template });
  } catch (error) {
    next(error);
  }
});

// Récupérer tous les documents
router.get('/', (req, res, next) => {
  try {
    const documents = redactionService.getAllDocuments();
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// Récupérer un document spécifique
router.get('/:id', (req, res, next) => {
  try {
    const document = redactionService.getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    res.json({ document });
  } catch (error) {
    next(error);
  }
});

// Sauvegarder un document (créer ou modifier)
router.post('/', (req, res, next) => {
  try {
    const { document } = req.body;
    
    if (!document || !document.title) {
      return res.status(400).json({ error: 'Titre requis' });
    }
    
    const saved = redactionService.saveDocument(document);
    res.json({ document: saved, message: 'Document sauvegardé' });
  } catch (error) {
    next(error);
  }
});

// Supprimer un document
router.delete('/:id', (req, res, next) => {
  try {
    redactionService.deleteDocument(req.params.id);
    res.json({ message: 'Document supprimé' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
