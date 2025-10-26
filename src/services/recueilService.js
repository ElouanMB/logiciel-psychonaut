const fs = require('fs');
const path = require('path');
const { RECUEIL_FILE } = require('../config/constants');

class RecueilService {
  /**
   * Get all products
   */
  getProducts() {
    if (!fs.existsSync(RECUEIL_FILE)) {
      return [];
    }
    const data = JSON.parse(fs.readFileSync(RECUEIL_FILE, 'utf8'));
    return data.products || [];
  }

  /**
   * Save products
   */
  saveProducts(products) {
    if (!Array.isArray(products)) {
      throw new Error('Invalid data');
    }
    
    const recueilDir = path.dirname(RECUEIL_FILE);
    if (!fs.existsSync(recueilDir)) {
      fs.mkdirSync(recueilDir, { recursive: true });
    }
    
    fs.writeFileSync(RECUEIL_FILE, JSON.stringify({ products }, null, 2), 'utf8');
    return { message: 'Recueil saved' };
  }
}

module.exports = new RecueilService();
