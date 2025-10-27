const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// Create a draft on XenForo
router.post('/create-draft', async (req, res, next) => {
  try {
    const { title, message, prefix_id } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Load session from .xf-session.json
    const sessionPath = path.join(__dirname, '../../config/.xf-session.json');
    const sessionData = await fs.readFile(sessionPath, 'utf8');
    const jar = CookieJar.fromJSON(sessionData);
    
    const client = wrapper(axios.create({ jar, timeout: 20000 }));
    
    // Get CSRF token from cookies
    const cookies = jar.getCookiesSync('https://www.psychonaut.fr');
    const csrfCookie = cookies.find(c => c.key === 'xf_csrf');
    const csrfToken = csrfCookie ? csrfCookie.value : '';
    
    // Create draft via XenForo API
    const draftUrl = 'https://www.psychonaut.fr/forums/resultats.161/draft';
    const draftData = {
      message_html: message,
      title: title,
      prefix_id: prefix_id || '6',
      attachment_hash: '',
      last_date: Math.floor(Date.now() / 1000),
      _xfToken: csrfToken,
      _xfWithData: '1',
      _xfResponseType: 'json'
    };
    
    await client.post(draftUrl, new URLSearchParams(draftData), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    // Return the URL to open
    const forumUrl = `https://www.psychonaut.fr/forums/resultats.161/post-thread`;
    res.json({ success: true, url: forumUrl });
    
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post a thread to the forum
router.post('/post-thread', async (req, res, next) => {
  try {
    const { forumId, title, message } = req.body;
    
    if (!forumId || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await authService.postThread(forumId, title, message);
    res.json(result);
  } catch (error) {
    console.error('Error posting thread:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch info from Psychoactif result page
router.post('/fetch-psychoactif-info', async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }
    
    // Récupérer la page
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    // Extraire les informations du HTML
    const postmsg = $('.postmsg').first().html();
    
    // Produit attendu : récupérer le texte entre "Produit attendu :" et le lien (<a>)
    const productMatch = postmsg.match(/Produit attendu\s*:\s*<b>([^<]+)<\/b>/i);
    const product = productMatch ? productMatch[1].trim() : '';
    
    // Aspect : récupérer le texte entre "Aspect :" et "<br"
    const formMatch = postmsg.match(/Aspect\s*:\s*([^<]+)(?:<br|<)/i);
    const form = formMatch ? formMatch[1].trim() : '';
    
    // Mode d'approvisionnement : récupérer le texte entre "Mode d'approvisionnement :" et "<" ou "br"
    const acquisitionMatch = postmsg.match(/Mode d'approvisionnement\s*:\s*([^<]+?)(?:<|$)/i);
    const acquisition = acquisitionMatch ? acquisitionMatch[1].trim().replace(/\s*<\/br>\s*$/, '') : '';
    
    res.json({
      product,
      form,
      acquisition
    });
    
  } catch (error) {
    console.error('Error fetching Psychoactif info:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
