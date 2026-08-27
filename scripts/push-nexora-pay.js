const { execSync } = require('child_process');

const dir = 'D:/PROYECTOS_NEXORA/Nexora_Pay';

try {
  console.log('1. Initializing git in Nexora_Pay...');
  try {
    execSync('git init', { cwd: dir, stdio: 'pipe' });
  } catch {}

  console.log('2. Staging files...');
  execSync('git add .', { cwd: dir, stdio: 'pipe' });

  console.log('3. Committing...');
  try {
    execSync('git commit -m "feat: initial commit for Nexora Pay multi-asset fintech engine"', { cwd: dir, stdio: 'pipe' });
  } catch (e) {
    console.log('Commit note:', e.message);
  }

  console.log('4. Setting main branch...');
  execSync('git branch -M main', { cwd: dir, stdio: 'pipe' });

  console.log('5. Configuring remote...');
  const remoteUrl = 'https://github.com/palaciomariaitati-byte/nexora-pay.git';
  try {
    execSync('git remote remove origin', { cwd: dir, stdio: 'pipe' });
  } catch {}
  execSync(`git remote add origin ${remoteUrl}`, { cwd: dir, stdio: 'pipe' });

  console.log('6. Pushing to GitHub...');
  const pushRes = execSync('git push -u origin main --force', { cwd: dir, encoding: 'utf-8' });
  console.log('RESULT:\n', pushRes);
  console.log('SUCCESSFULLY PUSHED NEXORA PAY TO GITHUB!');
} catch (err) {
  console.error('ERROR PUSHING:', err.message);
  if (err.stdout) console.log('STDOUT:', err.stdout.toString());
  if (err.stderr) console.log('STDERR:', err.stderr.toString());
}
