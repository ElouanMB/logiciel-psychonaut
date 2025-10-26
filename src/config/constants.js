const path = require('path');

const ROOT = process.cwd();
const DATA_DIR = path.resolve(ROOT, 'data');
const RESULTS_DIR = path.resolve(DATA_DIR, 'results');
const RECUEIL_FILE = path.resolve(DATA_DIR, 'recueil.json');
const ENV_FILE = path.resolve(ROOT, '.env');
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.XF_BASE || 'https://www.psychonaut.fr';

module.exports = {
  ROOT,
  DATA_DIR,
  RESULTS_DIR,
  RECUEIL_FILE,
  ENV_FILE,
  PORT,
  BASE_URL
};
