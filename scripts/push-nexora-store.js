const fs = require('fs');
const { execSync } = require('child_process');

try {
  const credsPath = process.env.USERPROFILE + '/.git-credentials';
  const creds = fs.readFileSync(credsPath, 'utf-8').trim();
  const firstLine = creds.split('\n')[0].trim();
  const tokenPart = firstLine.replace(/^https?:\/\//, '').split('@')[0];
  const pushUrl = `https://${tokenPart}@github.com/palaciomariaitati-byte/nexora-store.git`;
  
  console.log('Pushing to palaciomariaitati-byte/nexora-store...');
  const res = execSync(`git -C "D:/BARES 2026/Nexora_Store" push ${pushUrl} main --force`, { stdio: 'pipe' });
  console.log('RESULT:', res.toString());
  console.log('SUCCESSFULLY PUSHED TO GITHUB!');
} catch (err) {
  console.error('ERROR:', err.stderr ? err.stderr.toString() : err.message);
}
