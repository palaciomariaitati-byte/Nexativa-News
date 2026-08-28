const { execSync } = require('child_process');

console.log('=== PUSHING NEXORA CLUB PAY TO JAVILO29 ===');
const clubDir = 'D:/SUITE BOLICHES-NEXORAPAY';
try {
  try {
    execSync('git remote remove origin', { cwd: clubDir, stdio: 'pipe' });
  } catch {}
  execSync('git remote add origin https://github.com/Javilo29/nexora-club-pay.git', { cwd: clubDir, stdio: 'pipe' });
  const res1 = execSync('git push -u origin main --force', { cwd: clubDir, encoding: 'utf-8' });
  console.log('NEXORA CLUB PAY PUSHED TO JAVILO29:\n', res1);
} catch (e) {
  console.error('Error pushing club pay:', e.message);
  if (e.stderr) console.error('STDERR:', e.stderr.toString());
}

console.log('=== PUSHING NEXORA PAY TO JAVILO29 ===');
const payDir = 'D:/PROYECTOS_NEXORA/Nexora_Pay';
try {
  try {
    execSync('git remote remove origin', { cwd: payDir, stdio: 'pipe' });
  } catch {}
  execSync('git remote add origin https://github.com/Javilo29/nexora-pay.git', { cwd: payDir, stdio: 'pipe' });
  const res2 = execSync('git push -u origin main --force', { cwd: payDir, encoding: 'utf-8' });
  console.log('NEXORA PAY PUSHED TO JAVILO29:\n', res2);
} catch (e) {
  console.error('Error pushing nexora pay:', e.message);
  if (e.stderr) console.error('STDERR:', e.stderr.toString());
}
