// Script Node.js pour se connecter à un forum XenForo et récupérer le HTML d'une page privée
// Dépendances: axios, tough-cookie, axios-cookiejar-support
// Installation (PowerShell):
//   npm install
// Usage:
//   $env:XF_BASE="https://www.psychonaut.fr"; $env:XF_USER="votre_login"; $env:XF_PASS="votre_mot_de_passe"; node .\xenforo-login-fetch.js \
//     --target "/forums/demandes.160"
//   # Sauvegarder dans un fichier
//   $env:XF_BASE="https://www.psychonaut.fr"; $env:XF_USER="..."; $env:XF_PASS="..."; node .\xenforo-login-fetch.js --target "/forums/demandes.160" > mes-demandes.html

const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const axiosBase = require('axios');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
// Charge les variables d'environnement depuis .env si présent
try { require('dotenv').config(); } catch (_) {}

const BASE = process.env.XF_BASE || 'https://www.psychonaut.fr';
const USER = process.env.XF_USER || '';
const PASS = process.env.XF_PASS || '';
const SESSION_FILE = path.resolve(process.cwd(), '.xf-session.json');

function pick(arr) { return arr.find(Boolean); }

async function loadJarFromFile() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return new CookieJar();
    const text = fs.readFileSync(SESSION_FILE, 'utf8');
    const obj = JSON.parse(text);
    return await new Promise((resolve, reject) => {
      CookieJar.deserialize(obj, (err, jar) => {
        if (err || !jar) return resolve(new CookieJar());
        resolve(jar);
      });
    });
  } catch (_) {
    return new CookieJar();
  }
}

async function saveJarToFile(jar) {
  return new Promise((resolve, reject) => {
    jar.serialize((err, serialized) => {
      if (err) return reject(err);
      fs.writeFile(SESSION_FILE, JSON.stringify(serialized), 'utf8', (e) => {
        if (e) return reject(e);
        resolve();
      });
    });
  });
}

async function getLoginPageAndToken(client) {
  const loginPaths = ['/login/login', '/login/'];
  let lastErr = null;
  for (const p of loginPaths) {
    try {
      const res = await client.get(p, { headers: { 'Referer': BASE + '/' } });
      const html = res.data || '';
      // XenForo 2: champ masqué _xfToken
      const m = html.match(/name=["']?_xfToken["']?\s+value=["']([^"']+)["']/i) || html.match(/\b_xfToken\b.*?value=\"([^\"]+)\"/i);
      if (m && m[1]) {
        return { token: m[1], loginPath: p };
      }
      // Certains thèmes utilisent name="_xfToken" sans quotes autour de name
      const m2 = html.match(/_xfToken[^>]*value=['\"]([^'\"]+)['\"]/i);
      if (m2 && m2[1]) {
        return { token: m2[1], loginPath: p };
      }
      throw new Error('Impossible de trouver _xfToken sur ' + p);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Échec récupération page de login');
}

async function loginXenForo(client, token, loginPath) {
  const form = {
    login: USER,
    password: PASS,
    remember: 1,
    cookie_check: 1,
    _xfToken: token,
    redirect: '/',
  };

  const res = await client.post(loginPath, querystring.stringify(form), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': BASE,
      'Referer': BASE + loginPath,
    },
    maxRedirects: 0, // on capture redirection manuelle pour inspection si besoin
    validateStatus: (s) => s >= 200 && s < 400,
  });

  // Cas: 302 vers / (succès) ou vers une 2FA/erreur si mauvais identifiants
  if (res.status === 302 && res.headers.location) {
    const loc = res.headers.location;
    if (/two-step|two_factor|2fa/i.test(loc)) {
      throw new Error('2FA détecté. Ce script ne gère pas la double authentification.');
    }
  }

  // Vérifier si on est authentifié en testant une page de profil ou le cookie xf_user
  const cookies = await client.jar.getCookies(BASE);
  const hasUserCookie = cookies.some(c => /xf_user/i.test(c.key) && c.value);
  if (!hasUserCookie) {
    // Tentative supplémentaire: charger la home pour suivre les redirections
    await client.get('/');
    const cookies2 = await client.jar.getCookies(BASE);
    if (!cookies2.some(c => /xf_user/i.test(c.key) && c.value)) {
      throw new Error('Échec de connexion (pas de cookie xf_user). Vérifie USER/PASS et le token.');
    }
  }
}

async function isLoggedIn(client) {
  try {
    const res = await client.get('/account/', {
      maxRedirects: 0,
      validateStatus: (s) => s >= 200 && s < 400,
      headers: { 'Referer': BASE + '/' },
    });
    if (res.status === 302 && res.headers.location && /login/i.test(res.headers.location)) {
      return false;
    }
    if (res.status === 200) {
      const html = res.data || '';
      if (typeof html === 'string') {
        // Heuristique simple: page compte présente
        if (/Account|Compte|Préférences|Paramètres|Change password/i.test(html)) return true;
        // Si la page de login est renvoyée
        if (/_xfToken/.test(html) && /name=["']?login["']?/i.test(html)) return false;
      }
    }
    // Sinon, vérifier présence du cookie côté client (moins fiable si expiré côté serveur)
    const cookies = await client.jar.getCookies(BASE);
    return cookies.some(c => /xf_user/i.test(c.key) && c.value);
  } catch (_) {
    return false;
  }
}

async function fetchPrivatePage(client, targetPath) {
  const res = await client.get(targetPath, {
    headers: {
      'Referer': BASE + '/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  return res.data;
}

async function main() {
  const args = process.argv.slice(2);
  const targetIndex = Math.max(args.indexOf('--target'), args.indexOf('-t'));
  let target = '/';
  if (targetIndex >= 0 && args[targetIndex + 1]) {
    target = args[targetIndex + 1];
  } else {
    target = '/forums/demandes.160';
  }

  // Charger/sauvegarder automatiquement la session pour éviter de se reconnecter
  const jar = await loadJarFromFile();
  const axios = wrapper(axiosBase.create({
    baseURL: BASE,
    withCredentials: true,
    jar,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
    },
  }));
  // Exposer le jar pour usage ultérieur
  axios.jar = jar;

  try {
    // Si pas connecté (ou session expirée), faire le login avec identifiants
    if (!(await isLoggedIn(axios))) {
      if (!USER || !PASS) {
        console.error('Identifiants requis: définissez XF_USER et XF_PASS (via variables d\'environnement ou .env)');
        process.exit(1);
      }
      const { token, loginPath } = await getLoginPageAndToken(axios);
      await loginXenForo(axios, token, loginPath);
      await saveJarToFile(jar); // persiste la session
    }
    const html = await fetchPrivatePage(axios, target);
    // Sauvegarde de session après la requête (renouvellement éventuel des cookies)
    await saveJarToFile(jar);
    process.stdout.write(typeof html === 'string' ? html : String(html));
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

main();
