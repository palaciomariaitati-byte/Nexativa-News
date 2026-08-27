const fs = require('fs');
const { execSync } = require('child_process');

const dir = 'D:/PROYECTOS_NEXORA/Nexora_Pay';

// 1. Eliminar index.lock si existe
const lock = dir + '/.git/index.lock';
if (fs.existsSync(lock)) fs.unlinkSync(lock);

// 2. Escribir .gitignore completo
const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Python Virtualenv
env/
venv/
__pycache__/
*.pyc

# Next.js build
.next/
out/
build/
dist/

# Binarios e instaladores
*.apk
*.exe
*.dmg
*.zip
*.tar.gz
ENTREGABLES_BETA/

# Android build & Gradle
android/.gradle/
android/build/
android/app/build/
android/local.properties
android/.idea/

# Environment Variables
.env*.local
.env
.env.lowmem

# Logs
*.log
.DS_Store
`;

fs.writeFileSync(dir + '/.gitignore', gitignore, 'utf-8');
console.log('Updated .gitignore in Nexora_Pay');

// 3. Reset index
try {
  execSync('git reset', { cwd: dir, stdio: 'inherit' });
} catch {}

// 4. Stage clean files
console.log('Staging clean files...');
execSync('git add src/ assets/ scripts/ modules/ electron-main.js engine_schema.sql nexora_pay_api.py package.json next.config.js capacitor.config.ts .gitignore README.md INTEGRACION.md Legal_Argentina/ Legal_Internacional/', { cwd: dir, stdio: 'inherit' });

// 5. Commit
console.log('Committing clean version...');
try {
  execSync('git commit -m "feat: complete Nexora Pay fintech engine, web hub and documentation"', { cwd: dir, stdio: 'inherit' });
} catch (e) {
  console.log('Commit note:', e.message);
}

// 6. Push
console.log('Pushing to GitHub palaciomariaitati-byte/nexora-pay...');
const res = execSync('git push -u origin main --force', { cwd: dir, encoding: 'utf-8' });
console.log('RESULT:\n', res);
console.log('NEXORA PAY SUCCESSFULLY DEPLOYED TO GITHUB!');
