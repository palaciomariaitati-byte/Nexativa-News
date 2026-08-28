const fs = require('fs');

const storePagePath = 'D:/BARES 2026/Nexora_Store/app/page.tsx';
let content = fs.readFileSync(storePagePath, 'utf-8');

const newProductObj = `  {
    id: "nexora-club-pay",
    name: "Nexora Club & Carribar Pass (Closed-Loop)",
    category: "Gastronomía & Boliches",
    price: "$150 USD / $180.000 ARS",
    description: "Sistema cerrado de cobros rápidos por QR, billetera digital prepaga para clientes, punto de venta táctil 1-clic para barras y carribares exteriores, control de stock por voz asistido por Nora IA y panel de gamificación en vivo para DJs.",
    features: [
      "Alcancía digital prepaga: recarga de saldo antes de entrar o en caja",
      "Débito atómico instantáneo (<1 seg) con confirmación por Beep sonoro",
      "Separación de roles con PINs: Barra (1111), Carribar (2222), DJ Master (2026)",
      "Doble vía de escaneo: el cliente escanea el cartel o el bartender escanea al cliente",
      "Premios y sorteos DJ en vivo acreditados al celular en tiempo real",
      "Carga de mercadería por voz con Nora IA (cajones, botellas, medallones, panes)",
      "Auditoría y arqueo ciego diario sin fugas de dinero ni comisiones bancarias"
    ],
    status: "active",
    badge: "👑 NUEVO FINTECH",
    icon: "🍸",
    downloadUrl: "https://github.com/palaciomariaitati-byte/nexora-club-pay",
    demoUrl: "https://nexora-club-pay.vercel.app"
  },`;

if (!content.includes('nexora-club-pay')) {
  content = content.replace(/(const apps: App\[\] = \[|const apps = \[)/, `$1\n${newProductObj}`);
  fs.writeFileSync(storePagePath, content, 'utf-8');
  console.log('Nexora Club Pass agregado a Nexora Store app/page.tsx!');
} else {
  console.log('Ya existía en app/page.tsx');
}
