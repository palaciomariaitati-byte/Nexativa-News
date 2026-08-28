const fs = require('fs');
const { execSync } = require('child_process');

const dir = 'D:/SUITE BOLICHES-NEXORAPAY';

console.log('1. Creando .gitignore en Suite Boliches...');
const gitignore = `node_modules/
.DS_Store
*.log
`;
fs.writeFileSync(dir + '/.gitignore', gitignore, 'utf-8');

console.log('2. Inicializando Git...');
try {
  execSync('git init', { cwd: dir, stdio: 'pipe' });
} catch {}

console.log('3. Agregando archivos...');
execSync('git add .', { cwd: dir, stdio: 'inherit' });

console.log('4. Creando commit inicial...');
try {
  execSync('git commit -m "feat: complete Nexora Club & Carribar closed-loop fintech suite"', { cwd: dir, stdio: 'inherit' });
} catch (e) {
  console.log('Commit note:', e.message);
}

console.log('5. Asignando rama main y origen remoto...');
execSync('git branch -M main', { cwd: dir, stdio: 'pipe' });

const remoteUrl = 'https://github.com/palaciomariaitati-byte/nexora-club-pay.git';
try {
  execSync('git remote remove origin', { cwd: dir, stdio: 'pipe' });
} catch {}
execSync(`git remote add origin ${remoteUrl}`, { cwd: dir, stdio: 'pipe' });

console.log('6. Intentando push a GitHub palaciomariaitati-byte/nexora-club-pay...');
try {
  const pushRes = execSync('git push -u origin main --force', { cwd: dir, encoding: 'utf-8' });
  console.log('RESULT:\n', pushRes);
  console.log('SUCCESSFULLY PUSHED TO GITHUB!');
} catch (err) {
  console.log('Repo pendiente de creación en GitHub:', err.message);
}
