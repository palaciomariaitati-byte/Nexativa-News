const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = 'D:/PROYECTOS_NEXORA/Nexora_Pay';

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log('Removing temp directory:', dirPath);
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (e) {
      console.log('Could not remove:', dirPath, e.message);
    }
  }
}

console.log('Cleaning temp build artifacts in Nexora_Pay...');
removeDir(path.join(dir, '.next'));
removeDir(path.join(dir, 'out'));
removeDir(path.join(dir, 'android', '.gradle'));
removeDir(path.join(dir, 'android', 'build'));
removeDir(path.join(dir, 'android', 'app', 'build'));

console.log('Staging clean source code...');
execSync('git add src/ assets/ scripts/ modules/ electron-main.js engine_schema.sql nexora_pay_api.py package.json next.config.js capacitor.config.ts .gitignore README.md INTEGRACION.md Legal_Argentina/ Legal_Internacional/', { cwd: dir, stdio: 'inherit' });

console.log('Committing...');
try {
  execSync('git commit -m "feat: complete Nexora Pay multi-asset fintech engine and cross-platform architecture"', { cwd: dir, stdio: 'inherit' });
} catch (e) {
  console.log('Commit note:', e.message);
}

console.log('Pushing to GitHub palaciomariaitati-byte/nexora-pay...');
const pushRes = execSync('git push -u origin main --force', { cwd: dir, encoding: 'utf-8' });
console.log('RESULT:\n', pushRes);
console.log('NEXORA PAY SUCCESSFULLY PUSHED TO GITHUB!');
