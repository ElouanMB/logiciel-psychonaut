const path = require('path');

const ROOT = process.cwd();
const CONFIG_DIR = path.resolve(ROOT, 'config');
const DATA_DIR = path.resolve(ROOT, 'data');
const RESULTS_DIR = path.resolve(DATA_DIR, 'results');
const RECUEIL_FILE = path.resolve(DATA_DIR, 'recueil.json');
const ENV_FILE = path.resolve(CONFIG_DIR, '.env');
const SESSION_FILE = path.resolve(CONFIG_DIR, '.xf-session.json');
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.XF_BASE || 'https://www.psychonaut.fr';

module.exports = {
  ROOT,
  CONFIG_DIR,
  DATA_DIR,
  RESULTS_DIR,
  RECUEIL_FILE,
  ENV_FILE,
  SESSION_FILE,
  PORT,
  BASE_URL
};
