// Analyse en ligne: se connecte à XenForo, parcourt toutes les pages du forum Demandes,
// extrait les threads avec identifiants, classe DrugLab/Autre, et vérifie Psychoactif pour les "Autre".
// Usage (PowerShell):
//   node .\analyze-threads-online.js --out .\demande-report.json
//   npm run analyze:online

const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const axiosBase = require('axios');
const cheerio = require('cheerio');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
try { require('dotenv').config(); } catch (_) {}

const BASE = process.env.XF_BASE || 'https://www.psychonaut.fr';
const USER = process.env.XF_USER || '';
const PASS = process.env.XF_PASS || '';
const SESSION_FILE = path.resolve(process.cwd(), '.xf-session.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (k, s) => { const i = Math.max(args.indexOf(k), args.indexOf(s)); return i >= 0 ? args[i + 1] : null; };
  return {
    out: get('--out', '-o') || null,
    forumPath: '/forums/demandes.160/',
    psychoBase: 'https://www.psychoactif.org',
    druglabBase: 'https://druglab.fr',
    pages: (() => {
      const v = get('--pages', '-n');
      if (!v) return 0; // 0 = toutes
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    })(),
  };
}

async function loadJarFromFile() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return new CookieJar();
    const obj = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    return await new Promise((resolve) => {
      CookieJar.deserialize(obj, (err, jar) => resolve(jar || new CookieJar()));
    });
  } catch (_) { return new CookieJar(); }
}
async function saveJarToFile(jar) {
  return new Promise((resolve, reject) => {
    jar.serialize((err, serialized) => {
      if (err) return reject(err);
      fs.writeFile(SESSION_FILE, JSON.stringify(serialized), 'utf8', (e) => e ? reject(e) : resolve());
    });
  });
}

async function getLoginPageAndToken(client) {
  const loginPaths = ['/login/login', '/login/'];
  let lastErr; for (const p of loginPaths) {
    try {
      const res = await client.get(p, { headers: { Referer: BASE + '/' } });
      const html = res.data || '';
      const m = html.match(/name=["']?_xfToken["']?\s+value=["']([^"']+)["']/i) || html.match(/_xfToken[^>]*value=['\"]([^'\"]+)['\"]/i);
      if (m && m[1]) return { token: m[1], loginPath: p };
      throw new Error('Token _xfToken introuvable');
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Échec récupération page login');
}

async function loginXenForo(client, token, loginPath) {
  const form = { login: USER, password: PASS, remember: 1, cookie_check: 1, _xfToken: token, redirect: '/' };
  const res = await client.post(loginPath, querystring.stringify(form), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: BASE, Referer: BASE + loginPath },
    maxRedirects: 0, validateStatus: (s) => s >= 200 && s < 400,
  });
  if (res.status === 302 && res.headers.location && /two-step|two_factor|2fa/i.test(res.headers.location)) {
    throw new Error('2FA détecté: non géré par ce script');
  }
  const cookies = await client.jar.getCookies(BASE);
  if (!cookies.some(c => /xf_user/i.test(c.key) && c.value)) {
    await client.get('/');
    const c2 = await client.jar.getCookies(BASE);
    if (!c2.some(c => /xf_user/i.test(c.key) && c.value)) {
      throw new Error('Échec de connexion (pas de cookie xf_user).');
    }
  }
}

async function isLoggedIn(client) {
  try {
    const res = await client.get('/account/', { maxRedirects: 0, validateStatus: (s) => s >= 200 && s < 400 });
    if (res.status === 302 && res.headers.location && /login/i.test(res.headers.location)) return false;
    return true;
  } catch { return false; }
}

function createClient(jar) {
  const axios = wrapper(axiosBase.create({
    baseURL: BASE,
    withCredentials: true,
    jar,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' },
  }));
  axios.jar = jar; return axios;
}

function normalizeWhitespace(s) { return (s || '').replace(/[\u00A0\s]+/g, ' ').trim(); }

function extractIdentifiersAll(title) {
  const found = [];
  const have = new Set();
  const add = (type, raw, canonical) => {
    if (!have.has(type + '|' + canonical)) {
      have.add(type + '|' + canonical);
      found.push({ type, raw, canonical });
    }
  };
  // DrugLab: YYYY-NNNN
  const reDrug = /(\b\d{4}-\d{3,6}\b)/g;
  let m;
  while ((m = reDrug.exec(title)) !== null) {
    add('druglab', m[1], m[1]);
  }
  // PSYCHO digits (with or without brackets)
  const rePsy = /PSYCHO\s*(\d{5,7})/gi;
  while ((m = rePsy.exec(title)) !== null) {
    const n = m[1];
    add('autre', `PSYCHO${n}`, `PSYCHO${n}`);
  }
  // Digits inside brackets like [255496]
  const reInBr = /\[(\d{5,7})\]/g;
  while ((m = reInBr.exec(title)) !== null) {
    const n = m[1];
    add('autre', `[${n}]`, `PSYCHO${n}`);
  }
  // Standalone bare digits (avoid double counting)
  const reBare = /(\b\d{5,7}\b)/g;
  while ((m = reBare.exec(title)) !== null) {
    const n = m[1];
    // Skip if already found as part of PSYCHO or brackets
    add('autre', n, `PSYCHO${n}`);
  }
  return found;
}

function isClosedOrDeleted($item) {
  const cls = $item.attr('class') || '';
  if (/is-deleted|is-locked/i.test(cls)) return true;
  return $item.find('.structItem-status--deleted, .structItem-status--locked').length > 0;
}

function extractPrefixLabel($, $item) {
  const label = $item.find('.structItem-title .label').first().text().trim();
  return label || null;
}

function toAbs(url) {
  if (!url) return '';
  if (/^https?:/i.test(url)) return url;
  if (url.startsWith('/')) return BASE + url;
  return BASE.replace(/\/$/, '') + '/' + url;
}

async function getMaxPage($, forumPath) {
  let max = 1;
  $('a[href*="/page-"]').each((_, a) => {
    const href = String(a.attribs.href || '');
    const m = href.match(/\/page-(\d+)/);
    if (m) { const n = parseInt(m[1], 10); if (!Number.isNaN(n)) max = Math.max(max, n); }
  });
  return max;
}

async function fetchPageHtml(client, urlPath) {
  const res = await client.get(urlPath, { headers: { Referer: BASE + '/' } });
  return res.data;
}

async function fetchAllForumPages(client, forumPath, limitPages = 0) {
  const firstHtml = await fetchPageHtml(client, forumPath);
  let $ = cheerio.load(firstHtml);
  const maxPage = await getMaxPage($, forumPath);
  const end = limitPages > 0 ? Math.min(limitPages, maxPage) : maxPage;
  const pages = [{ index: 1, html: firstHtml }];
  for (let i = 2; i <= end; i++) {
    const p = forumPath.replace(/\/?$/, '/') + 'page-' + i;
    const html = await fetchPageHtml(client, p);
    pages.push({ index: i, html });
  }
  return pages;
}

function parseThreadsFromPage(html) {
  const $ = cheerio.load(html);
  const arr = [];
  $('.structItem.structItem--thread').each((_, el) => {
    const $item = $(el);
    const closed = isClosedOrDeleted($item);
    // Le premier lien dans .structItem-title peut être le "label" (ATPidf, SINTES, etc.).
    // On veut le lien de titre du thread.
    let $a = $item.find('.structItem-title a[data-tp-primary="on"]').first();
    if (!$a.length) {
      $a = $item.find('.structItem-title a[href*="/threads/"]').first();
    }
    const title = normalizeWhitespace($a.text());
    const href = $a.attr('href') || '';
    const identifiers = extractIdentifiersAll(title);
    const label = extractPrefixLabel($, $item);
    arr.push({ title, href: toAbs(href), closed, identifiers, label });
  });
  return arr;
}

function buildPsyUrl(canonicalId, psychoBase) {
  return `${psychoBase}/forum/analyse-a-distance.php?identification=${encodeURIComponent(canonicalId)}#divid`;
}

function buildDruglabUrl(drugId, druglabBase) {
  return `${druglabBase.replace(/\/$/, '')}/echantillon/${encodeURIComponent(drugId)}`;
}

async function checkPsychoactif(axiosHttp, canonicalId, psychoBase) {
  try {
    const url = buildPsyUrl(canonicalId, psychoBase);
    const res = await axiosHttp.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', Accept: 'text/html,application/xhtml+xml' },
      timeout: 15000,
      validateStatus: s => s >= 200 && s < 400,
    });
    const html = String(res.data || '');
    // Heuristiques: présence du canonicalId + indices de formulaire/valeurs d'analyse
    if (!new RegExp(canonicalId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(html)) return false;
    if (/name=["']?analyse_id["']?/i.test(html)) return true;
    if (/name=["']?req_subject["']?/i.test(html)) return true;
    if (/Résultats de l'analyse|Molécule attendue|Analyse\s*:/i.test(html)) return true;
    return true; // on a au moins l'ID présent dans la page
  } catch (_) { return false; }
}

async function checkDruglab(axiosHttp, drugId, druglabBase) {
  try {
    const url = buildDruglabUrl(drugId, druglabBase);
    const res = await axiosHttp.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', Accept: 'text/html,application/xhtml+xml' },
      timeout: 15000,
      validateStatus: s => s >= 200 && s < 500, // inspect 404
    });
    return { found: res.status >= 200 && res.status < 300, url };
  } catch (_) {
    return { found: false, url: buildDruglabUrl(drugId, druglabBase) };
  }
}

async function main() {
  const { out, forumPath, psychoBase, druglabBase, pages } = parseArgs();
  // Prépare client connecté (ou session persistée)
  const jar = await loadJarFromFile();
  const xf = createClient(jar);
  if (!(await isLoggedIn(xf))) {
    if (!USER || !PASS) {
      console.error('Identifiants manquants: configurez XF_USER et XF_PASS dans .env');
      process.exit(1);
    }
    const { token, loginPath } = await getLoginPageAndToken(xf);
    await loginXenForo(xf, token, loginPath);
    await saveJarToFile(jar);
  }

  // Récupère toutes les pages du forum Demandes
  const forumPages = await fetchAllForumPages(xf, forumPath, pages);
  const allThreads = forumPages.flatMap(p => parseThreadsFromPage(p.html));
  // Inclure aussi les threads sans identifiant et le signaler dans le JSON

  // Client HTTP simple pour Psychoactif (pas besoin de cookies)
  const http = axiosBase.create({ headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });

  const results = [];
  for (const t of allThreads) {
    const enriched = [];
    for (const id of t.identifiers) {
      if (id.type === 'autre') {
        const found = await checkPsychoactif(http, id.canonical, psychoBase);
        enriched.push({ ...id, psychoUrl: buildPsyUrl(id.canonical, psychoBase), psychoFound: found });
      } else if (id.type === 'druglab') {
        // DrugLab: vérifier l'existence de la page de résultat sur druglab.fr
        const { found, url } = await checkDruglab(http, id.canonical, druglabBase);
        enriched.push({ ...id, druglabUrl: url, druglabFound: found });
      } else {
        enriched.push({ ...id });
      }
    }
    results.push({
      title: t.title,
      url: t.href,
      label: t.label,
      closed: t.closed,
      identifiers: enriched,
      ...(enriched.length === 0 ? { missingIdentifier: true } : {}),
    });
  }

  // Affichage
  const flatIds = results.flatMap(t => t.identifiers.map(i => i));
  const druglabCount = flatIds.filter(i => i.type === 'druglab').length;
  const autreCount = flatIds.filter(i => i.type === 'autre').length;
  const missingCount = results.filter(r => r.identifiers.length === 0).length;
  console.log(`Threads parcourus: ${results.length} (ouverts et fermés)`);
  console.log(`- Sans identifiant détecté: ${missingCount}`);
  console.log(`- Identifiants DrugLab: ${druglabCount}`);
  console.log(`- Identifiants Autre: ${autreCount}`);

  for (const r of results) {
    console.log(`\n• ${r.title}${r.closed ? ' [FERMÉ]' : ''}`);
    console.log(`  - URL: ${r.url}`);
    if (r.label) console.log(`  - Label: ${r.label}`);
    if (r.identifiers && r.identifiers.length) {
      console.log(`  - Identifiants:`);
      for (const id of r.identifiers) {
        console.log(`    • ${id.raw} (canonique: ${id.canonical}) — ${id.type === 'druglab' ? 'DrugLab' : 'Autre'}`);
      }
    }
    const psychoIds = r.identifiers.filter(i => i.type === 'autre' && i.psychoUrl);
    if (psychoIds.length) {
      console.log(`  - Psychoactif:`);
      for (const i of psychoIds) {
        console.log(`    • ${i.canonical}: ${i.psychoFound ? 'Trouvé' : 'Non trouvé'} (${i.psychoUrl})`);
      }
    }
    const dlIds = r.identifiers.filter(i => i.type === 'druglab' && i.druglabUrl);
    if (dlIds.length) {
      console.log(`  - DrugLab:`);
      for (const i of dlIds) {
        console.log(`    • ${i.canonical}: ${i.druglabFound ? 'Trouvé' : 'Non trouvé'} (${i.druglabUrl})`);
      }
    }
  }

  if (out) {
    // S'assurer que le dossier existe; si l'utilisateur a fourni juste un chemin, on crée le répertoire parent
    const ensureDir = (p) => {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    };
    ensureDir(out);
    fs.writeFileSync(out, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nÉcrit: ${out}`);
  } else {
    // Par défaut écrire dans ./results avec timestamp
    const ts = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`;
    const defaultOut = path.resolve(process.cwd(), 'results', `demande-report-${stamp}.json`);
    const dir = path.dirname(defaultOut);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(defaultOut, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nÉcrit: ${defaultOut}`);
  }
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
