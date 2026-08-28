const fs = require('fs');
const { execSync } = require('child_process');

const catalogPaths = [
  'D:/BARES 2026/Nexora_Store/catalog/store_catalog.json',
  'D:/NEXORA STORE/catalog/store_catalog.json'
];

const newProduct = {
  "id": "nexora-club-pay",
  "name": "Nexora Club & Carribar Pass (Closed-Loop Fintech)",
  "short_name": "Nexora Club Pass",
  "category": "Discotecas, Bares & Foodtrucks",
  "version": "v1.0.0",
  "price_ars": 180000,
  "price_usd": 150,
  "billing_cycle": "Pago Único / Licencia Perpetua",
  "description": "Sistema cerrado de cobros rápidos por QR, billetera digital prepaga para clientes, punto de venta táctil 1-clic para barras y carribares exteriores, control de stock por voz asistido por Nora IA y panel de gamificación en vivo para DJs y pantallas gigantes.",
  "features": [
    "Alcancía digital prepaga: recarga de saldo antes de entrar o en caja",
    "Débito atómico instantáneo (<1 segundo) con confirmación por Beep sonoro",
    "Separación de roles con PINs: Barra Boliche (1111), Carribar (2222), DJ Master (2026)",
    "Doble vía de escaneo: el cliente escanea el cartel o el bartender escanea al cliente",
    "Premios y sorteos DJ en vivo acreditados al celular en tiempo real",
    "Carga de mercadería por voz con Nora IA (cajones, botellas, medallones, panes)",
    "Auditoría y arqueo ciego diario sin fugas de dinero ni comisiones bancarias por trago",
    "Manual de usuario y claves de acceso incluidas en la raíz"
  ],
  "download_links": {
    "web_pwa": "https://nexora-club-pay.vercel.app",
    "github_source": "https://github.com/palaciomariaitati-byte/nexora-club-pay",
    "manual_claves": "MANUAL_DE_USUARIO_Y_CLAVES.md"
  },
  "status": "Publicado",
  "badge": "NUEVO FINTECH"
};

catalogPaths.forEach(p => {
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      const exists = data.systems.find(s => s.id === newProduct.id);
      if (!exists) {
        data.systems.unshift(newProduct);
        data.total_systems = data.systems.length;
        fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
        console.log('Agregado a catálogo:', p);
      }
    } catch (e) {
      console.log('Error en catálogo:', p, e.message);
    }
  }
});

// Actualizar repositorios en GitHub
console.log('Pushing updates to Nexora Club Pay repo...');
try {
  execSync('git add . && git commit -m "feat: add user manual, access PINs and sector security gate"', { cwd: 'D:/SUITE BOLICHES-NEXORAPAY', stdio: 'inherit' });
  execSync('git push -u origin main --force', { cwd: 'D:/SUITE BOLICHES-NEXORAPAY', stdio: 'inherit' });
} catch (e) {
  console.log('Nexora Club Pay push note:', e.message);
}

console.log('Pushing updates to Nexora Store repo...');
try {
  execSync('git add . && git commit -m "feat: publish Nexora Club & Carribar Pass (USD 150) to official store catalog"', { cwd: 'D:/BARES 2026/Nexora_Store', stdio: 'inherit' });
  const pushRes = execSync('node scripts/push-nexora-store.js', { encoding: 'utf-8' });
  console.log('Store push result:\n', pushRes);
} catch (e) {
  console.log('Store push note:', e.message);
}
