const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const axiosBase = require('axios');
const cheerio = require('cheerio');
const querystring = require('querystring');
const { BASE_URL } = require('../config/constants');
const configService = require('./configService');

class AuthService {
  /**
   * Verify login and get user profile
   */
  async verifyLogin() {
    const { username, password } = configService.getCredentials();
    
    if (!username || !password) {
      throw new Error('Credentials not configured');
    }

    const jar = new CookieJar();
    const client = wrapper(axiosBase.create({ jar, timeout: 20000 }));

    // Get login page and token
    const loginPageRes = await client.get(`${BASE_URL}/login/`);
    const $login = cheerio.load(loginPageRes.data);
    const token = $login('input[name="_xfToken"]').val();
    
    if (!token) {
      throw new Error('Cannot get login token');
    }

    // Login
    await client.post(`${BASE_URL}/login/login`, querystring.stringify({
      login: username,
      password: password,
      remember: '1',
      _xfToken: token,
      _xfRedirect: BASE_URL
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 0,
      validateStatus: s => s < 400
    });

    // Check if logged in
    const cookies = await jar.getCookies(BASE_URL);
    const xfUser = cookies.find(c => c.key === 'xf_user');
    
    if (!xfUser) {
      throw new Error('Login failed - invalid credentials');
    }

    // Fetch profile page to get username and avatar
    const profileRes = await client.get(`${BASE_URL}/account/`);
    const $profile = cheerio.load(profileRes.data);
    
    // Try to find username
    let displayName = username;
    const usernameEl = $profile('.p-navgroup-link--user .p-navgroup-linkText');
    if (usernameEl.length > 0) {
      displayName = usernameEl.text().trim();
    }

    // Try to find avatar
    let avatar = '/ressources/logo.svg';
    const avatarEl = $profile('.p-navgroup-link--user .avatar img');
    if (avatarEl.length > 0) {
      const avatarSrc = avatarEl.attr('src');
      if (avatarSrc) {
        avatar = avatarSrc.startsWith('http') ? avatarSrc : `${BASE_URL}${avatarSrc}`;
      }
    }

    return { 
      username: displayName,
      avatar: avatar
    };
  }

  /**
   * Post a new thread to the forum
   */
  async postThread(forumId, title, message) {
    const { username, password } = configService.getCredentials();
    
    if (!username || !password) {
      throw new Error('Credentials not configured');
    }

    const jar = new CookieJar();
    const client = wrapper(axiosBase.create({ jar, timeout: 20000 }));

    // Get login page and token
    const loginPageRes = await client.get(`${BASE_URL}/login/`);
    const $login = cheerio.load(loginPageRes.data);
    const loginToken = $login('input[name="_xfToken"]').val();
    
    if (!loginToken) {
      throw new Error('Cannot get login token');
    }

    // Login
    await client.post(`${BASE_URL}/login/login`, querystring.stringify({
      login: username,
      password: password,
      remember: '1',
      _xfToken: loginToken,
      _xfRedirect: BASE_URL
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 0,
      validateStatus: s => s < 400
    });

    // Check if logged in
    const cookies = await jar.getCookies(BASE_URL);
    const xfUser = cookies.find(c => c.key === 'xf_user');
    
    if (!xfUser) {
      throw new Error('Login failed - invalid credentials');
    }

    // Get post-thread page to get CSRF token
    const postThreadPageRes = await client.get(`${BASE_URL}/forums/${forumId}/post-thread`);
    const $postThread = cheerio.load(postThreadPageRes.data);
    const postToken = $postThread('input[name="_xfToken"]').val();
    
    if (!postToken) {
      throw new Error('Cannot get post thread token');
    }

    // Post the thread
    const postRes = await client.post(`${BASE_URL}/forums/${forumId}/add-thread`, querystring.stringify({
      title: title,
      message: message,
      _xfToken: postToken,
      _xfRequestUri: `/forums/${forumId}/post-thread`,
      _xfWithData: '1',
      _xfResponseType: 'json'
    }), {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (postRes.data && postRes.data.status === 'ok' && postRes.data.redirect) {
      return {
        success: true,
        url: postRes.data.redirect.startsWith('http') ? postRes.data.redirect : `${BASE_URL}${postRes.data.redirect}`
      };
    }

    throw new Error('Failed to post thread');
  }
}

module.exports = new AuthService();
