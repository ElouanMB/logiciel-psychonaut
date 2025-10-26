const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { ROOT, RESULTS_DIR } = require('../config/constants');

class AnalysisService {
  /**
   * Run analysis with optional progress callback
   */
  runAnalysis(pages, outName, onProgress = null) {
    return new Promise((resolve, reject) => {
      let outPath = null;
      if (outName) {
        let safeName = outName.trim();
        if (!safeName.toLowerCase().endsWith('.json')) safeName += '.json';
        outPath = path.join(RESULTS_DIR, safeName);
        
        // Ensure directory exists
        const outDir = path.dirname(outPath);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      }

      const args = ['analyze-threads-online.js'];
      if (pages && pages > 0) args.push('--pages', String(pages));
      if (outPath) args.push('--out', outPath);

      const child = spawn(process.execPath, args, { cwd: ROOT, env: process.env });
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', d => { 
        const chunk = d.toString();
        stdout += chunk;
        
        // Parse progress messages
        if (onProgress) {
          const progressMatch = chunk.match(/PROGRESS:\s*(\d+)%/);
          if (progressMatch) {
            const progress = parseInt(progressMatch[1], 10);
            onProgress(progress);
          }
        }
      });
      
      child.stderr.on('data', d => { 
        stderr += d.toString(); 
      });
      
      child.on('error', err => {
        reject(err);
      });
      
      child.on('close', code => {
        // Parse the output file path if analyzer printed it
        let outFile = null;
        const m = stdout.match(/Écrit:\s*(.+)$/m);
        if (m) {
          outFile = m[1].trim();
        } else if (outPath) {
          outFile = outPath;
        }
        
        resolve({ 
          ok: code === 0, 
          code, 
          outFile, 
          stdout, 
          stderr 
        });
      });
    });
  }

  /**
   * Create a spawned child process for streaming
   */
  spawnAnalysis(pages, outName) {
    let outPath = null;
    if (outName) {
      let safeName = outName.trim();
      if (!safeName.toLowerCase().endsWith('.json')) safeName += '.json';
      outPath = path.join(RESULTS_DIR, safeName);
      
      const outDir = path.dirname(outPath);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    }

    const args = ['analyze-threads-online.js'];
    if (pages && pages > 0) args.push('--pages', String(pages));
    if (outPath) args.push('--out', outPath);

    return { 
      child: spawn(process.execPath, args, { cwd: ROOT, env: process.env }),
      outPath 
    };
  }
}

module.exports = new AnalysisService();
