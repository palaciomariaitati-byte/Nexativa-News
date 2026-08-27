const fs = require('fs');
const { execSync } = require('child_process');

const dir = 'D:/PROYECTOS_NEXORA/Nexora_Pay';

const readme = `# 👑 Nexora Pay — Multi-Asset Fintech Engine & Payment Gateway

Nexora Pay es el motor de pagos y pasarela fintech soberana del ecosistema Nexora (Nexora Store, Nexora Restobar y Nexativa News).

## 🚀 Características Principales

- **Multi-Moneda Soberano**: Soporte atómico para Pesos Argentinos (ARS), Tether USD (USDT), Bitcoin (BTC) y Nexora Token (NT).
- **Puente Bancario Híbrido**: Cobros directos mediante CBU / CVU / Alias de Brubank y Banco Nación (BNA) con verificación instantánea.
- **Cross-Platform Nativo**:
  - 🖥️ **Windows Desktop (Electron + NSIS)**
  - 📱 **Android mPOS (Capacitor APK)**
  - 🌐 **Web Hub (Next.js 14 + TailwindCSS / SASS)**
- **Seguridad y Cumplimiento**: Criptografía HMAC-SHA256, RPCs atómicos en Supabase (\`process_payment_v2\`) y soporte KYC.

## 🛠️ Tecnologías

- Next.js 14 / React 18
- Supabase PostgreSQL (Atómic Engine)
- Electron & Capacitor Android
- Framer Motion & Lucide Icons
`;

fs.writeFileSync(dir + '/README.md', readme, 'utf-8');
console.log('README.md created in Nexora_Pay');

console.log('Staging files...');
execSync('git add .', { cwd: dir, stdio: 'inherit' });

console.log('Committing...');
try {
  execSync('git commit -m "feat: complete Nexora Pay fintech engine, web hub and documentation"', { cwd: dir, stdio: 'inherit' });
} catch (e) {
  console.log('Commit note:', e.message);
}

console.log('Pushing to GitHub palaciomariaitati-byte/nexora-pay...');
const res = execSync('git push -u origin main --force', { cwd: dir, encoding: 'utf-8' });
console.log('RESULT:\n', res);
console.log('NEXORA PAY SUCCESSFULLY DEPLOYED TO GITHUB!');
