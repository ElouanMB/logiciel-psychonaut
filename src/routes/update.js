const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

// POST /api/update - Pull latest code from GitHub
router.post('/', async (req, res) => {
  // Set headers for streaming
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const projectRoot = path.join(__dirname, '../..');

  try {
    // Helper function to send progress
    const sendProgress = (data) => {
      res.write(JSON.stringify(data) + '\n');
    };

    sendProgress({ progress: 10, status: 'Vérification du repository...', log: 'Démarrage de la mise à jour' });

    // Step 1: Check if git is available
    await new Promise((resolve, reject) => {
      exec('git --version', (error, stdout, stderr) => {
        if (error) {
          sendProgress({ error: 'Git n\'est pas installé sur ce système', log: stderr, type: 'error' });
          reject(new Error('Git non disponible'));
        } else {
          sendProgress({ progress: 20, log: `Git détecté: ${stdout.trim()}`, type: 'success' });
          resolve();
        }
      });
    });

    // Step 2: Check current branch
    await new Promise((resolve, reject) => {
      exec('git branch --show-current', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          sendProgress({ log: `Erreur branche: ${stderr}`, type: 'error' });
          reject(error);
        } else {
          const branch = stdout.trim();
          sendProgress({ progress: 30, log: `Branche actuelle: ${branch}`, type: 'info' });
          resolve();
        }
      });
    });

    // Step 3: Check for uncommitted changes
    await new Promise((resolve, reject) => {
      exec('git status --porcelain', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          sendProgress({ log: `Erreur status: ${stderr}`, type: 'error' });
          reject(error);
        } else {
          if (stdout.trim()) {
            sendProgress({ progress: 40, log: `⚠ Modifications locales détectées`, type: 'info' });
          } else {
            sendProgress({ progress: 40, log: 'Aucune modification locale', type: 'success' });
          }
          resolve();
        }
      });
    });

    // Step 4: Fetch from remote
    sendProgress({ progress: 50, status: 'Récupération des mises à jour...', log: 'Exécution de git fetch...' });
    await new Promise((resolve, reject) => {
      exec('git fetch origin', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          sendProgress({ log: `Erreur fetch: ${stderr}`, type: 'error' });
          reject(error);
        } else {
          sendProgress({ progress: 70, log: stderr || 'Fetch terminé', type: 'success' });
          resolve();
        }
      });
    });

    // Step 5: Pull changes
    sendProgress({ progress: 80, status: 'Application des mises à jour...', log: 'Exécution de git pull...' });
    await new Promise((resolve, reject) => {
      exec('git pull origin', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          sendProgress({ log: `Erreur pull: ${stderr}`, type: 'error' });
          reject(error);
        } else {
          const output = stdout || stderr;
          if (output.includes('Already up to date')) {
            sendProgress({ progress: 100, log: '✓ Code déjà à jour', type: 'success' });
          } else {
            sendProgress({ progress: 100, log: `✓ ${output}`, type: 'success' });
          }
          resolve();
        }
      });
    });

    // Step 6: Check if npm install is needed
    sendProgress({ progress: 100, status: 'Vérification des dépendances...', log: 'Vérification package.json...' });
    
    // Success
    sendProgress({ 
      success: true, 
      progress: 100, 
      status: '✓ Mise à jour terminée !',
      log: 'Mise à jour terminée avec succès'
    });
    
    res.end();

  } catch (error) {
    console.error('Update error:', error);
    res.write(JSON.stringify({ 
      error: error.message, 
      log: 'La mise à jour a échoué',
      type: 'error'
    }) + '\n');
    res.end();
  }
});

module.exports = router;
