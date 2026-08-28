const { execSync } = require('child_process');

console.log('1. Pushing Nexora Club Pay to palaciomariaitati-byte/nexora-club-pay...');
const clubDir = 'D:/SUITE BOLICHES-NEXORAPAY';
try {
  try { execSync('git remote remove origin', { cwd: clubDir, stdio: 'pipe' }); } catch {}
  execSync('git remote add origin https://github.com/palaciomariaitati-byte/nexora-club-pay.git', { cwd: clubDir, stdio: 'pipe' });
  const resClub = execSync('git push -u origin main --force', { cwd: clubDir, encoding: 'utf-8' });
  console.log('NEXORA CLUB PAY PUSHED TO GITHUB:\n', resClub);
} catch (e) {
  console.log('Club pay push note:', e.message);
}

console.log('2. Pushing Nexora Store...');
try {
  const resStore = execSync('node scripts/push-nexora-store.js', { encoding: 'utf-8' });
  console.log('NEXORA STORE PUSHED:\n', resStore);
} catch (e) {
  console.log('Store push note:', e.message);
}
