const fs = require('fs');
const path = require('path');
const { RESULTS_DIR } = require('../config/constants');

class ResultsService {
  /**
   * List all result files sorted by modification date (newest first)
   */
  listResults() {
    if (!fs.existsSync(RESULTS_DIR)) return [];
    const files = fs.readdirSync(RESULTS_DIR)
      .filter(f => f.toLowerCase().endsWith('.json'))
      .map(f => {
        const p = path.join(RESULTS_DIR, f);
        const stat = fs.statSync(p);
        return { name: f, path: p, mtime: stat.mtimeMs, size: stat.size };
      })
      .sort((a, b) => b.mtime - a.mtime);
    return files;
  }

  /**
   * Get list of files with basic info
   */
  getFilesList() {
    const files = this.listResults().map(f => ({ 
      name: f.name, 
      modifiedAt: new Date(f.mtime).toISOString(), 
      sizeBytes: f.size 
    }));
    return files;
  }

  /**
   * Get latest result file content
   */
  getLatest() {
    const files = this.listResults();
    if (!files.length) return null;
    const latest = files[0];
    const content = JSON.parse(fs.readFileSync(latest.path, 'utf8'));
    return { file: latest.name, result: content };
  }

  /**
   * Get specific file content by name
   */
  getFileByName(name) {
    if (!name) throw new Error('Missing name');
    const safe = path.basename(name);
    const p = path.join(RESULTS_DIR, safe);
    if (!fs.existsSync(p)) throw new Error('Not found');
    const content = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { file: safe, result: content };
  }

  /**
   * Get summaries for all result files
   */
  getListSummaries() {
    const files = this.listResults();
    const summaries = files.map(f => {
      let threads = 0; 
      let openThreads = 0; 
      let closedThreads = 0; 
      const byLabel = new Map();
      
      try {
        const content = JSON.parse(fs.readFileSync(f.path, 'utf8'));
        if (Array.isArray(content)) {
          threads = content.length;
          content.forEach(r => { 
            const lbl = (r && r.label) ? r.label : 'Sans label'; 
            byLabel.set(lbl, (byLabel.get(lbl) || 0) + 1);
            
            // Check if thread is closed
            if (r && r.title) {
              const titleLower = r.title.toLowerCase();
              if (titleLower.includes('[fermé]') || titleLower.includes('[ferme]') || 
                  titleLower.includes('[closed]') || (r.closed === true)) {
                closedThreads++;
              } else {
                openThreads++;
              }
            } else {
              openThreads++; // Default to open if unknown
            }
          });
        }
      } catch (_) {}
      
      return {
        name: f.name,
        modifiedAt: new Date(f.mtime).toISOString(),
        threads,
        openThreads,
        closedThreads,
        byLabel: Array.from(byLabel.entries()).map(([label, count]) => ({ label, count })),
      };
    });
    return summaries;
  }

  /**
   * Get global stats
   */
  getStats() {
    const files = this.listResults();
    const totalFiles = files.length;
    const totalSizeBytes = files.reduce((a, f) => a + (f.size || 0), 0);
    const latest = files[0] ? { 
      name: files[0].name, 
      modifiedAt: new Date(files[0].mtime).toISOString() 
    } : null;
    return { totalFiles, totalSizeBytes, latest };
  }

  /**
   * Delete a result file
   */
  deleteFile(name) {
    if (!name) throw new Error('Missing name');
    const safe = path.basename(name);
    const p = path.join(RESULTS_DIR, safe);
    if (!fs.existsSync(p)) throw new Error('Not found');
    fs.unlinkSync(p);
    return { deleted: safe };
  }

  /**
   * Rename a result file
   */
  renameFile(oldName, newName) {
    if (!oldName || !newName) throw new Error('Missing names');
    const safeOld = path.basename(oldName);
    let safeNew = path.basename(newName);
    if (!safeNew.toLowerCase().endsWith('.json')) safeNew += '.json';
    
    const pOld = path.join(RESULTS_DIR, safeOld);
    const pNew = path.join(RESULTS_DIR, safeNew);
    
    if (!fs.existsSync(pOld)) throw new Error('Source not found');
    if (fs.existsSync(pNew)) throw new Error('Target exists');
    
    fs.renameSync(pOld, pNew);
    return { from: safeOld, to: safeNew };
  }
}

module.exports = new ResultsService();
