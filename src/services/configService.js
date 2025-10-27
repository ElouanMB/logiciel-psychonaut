const fs = require('fs');
const { ENV_FILE } = require('../config/constants');

class ConfigService {
  /**
   * Parse .env file and extract credentials
   */
  parseEnvFile() {
    if (!fs.existsSync(ENV_FILE)) {
      return { username: '', password: '' };
    }
    
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const lines = envContent.split('\n');
    let username = '';
    let password = '';
    
    lines.forEach(line => {
      const [key, ...valParts] = line.split('=');
      let val = valParts.join('=').trim();
      // Remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key.trim() === 'XF_USER') username = val;
      if (key.trim() === 'XF_PASS') password = val;
    });
    
    return { username, password };
  }

  /**
   * Get config with masked password
   */
  getConfig() {
    const { username, password } = this.parseEnvFile();
    return { username, password: password ? '********' : '' };
  }

  /**
   * Save config to .env file
   */
  saveConfig(username, password) {
    if (!username || !password) {
      throw new Error('Username and password required');
    }
    
    // Don't overwrite if password is masked
    let newPassword = password;
    if (password === '********') {
      const existing = this.parseEnvFile();
      newPassword = existing.password;
    }

    // Escape quotes in values and wrap in double quotes
    const escapeValue = (val) => {
      return '"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    };
    
    const envContent = `XF_USER=${escapeValue(username)}\nXF_PASS=${escapeValue(newPassword)}\n`;
    
    // Ensure config directory exists
    const { CONFIG_DIR } = require('../config/constants');
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    fs.writeFileSync(ENV_FILE, envContent, 'utf8');
    
    return { message: 'Config saved' };
  }

  /**
   * Get credentials (unmasked)
   */
  getCredentials() {
    return this.parseEnvFile();
  }
}

module.exports = new ConfigService();
