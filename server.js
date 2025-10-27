/**
 * Psychonaut Dashboard Server
 * Main entry point for the application
 */

const express = require('express');
const path = require('path');
const { ROOT, PORT } = require('./src/config/constants');
const errorHandler = require('./src/middlewares/errorHandler');

// Import routes
const resultsRoutes = require('./src/routes/results');
const analysisRoutes = require('./src/routes/analysis');
const configRoutes = require('./src/routes/config');
const recueilRoutes = require('./src/routes/recueil');
const redactionRoutes = require('./src/routes/redaction');
const forumRoutes = require('./src/routes/forum');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(ROOT, 'public')));
app.use('/ressources', express.static(path.join(ROOT, 'ressources')));
app.use('/data/results', express.static(path.join(ROOT, 'data', 'results')));

// API Routes
app.use('/api/results', resultsRoutes);
app.use('/api', analysisRoutes);
app.use('/api', configRoutes);
app.use('/api/recueil', recueilRoutes);
app.use('/api/redaction', redactionRoutes);
app.use('/api/forum', forumRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dashboard disponible sur http://localhost:${PORT}`);
  console.log(`📁 Résultats: data/results/`);
  console.log(`📚 Recueil: data/recueil.json`);
  console.log(`📝 Rédaction: data/redaction.json`);
});
