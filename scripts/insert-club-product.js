const fs = require('fs');

const storePagePath = 'D:/BARES 2026/Nexora_Store/app/page.tsx';
let content = fs.readFileSync(storePagePath, 'utf-8');

const newProductSoftware = `  {
    id: 'nexora_club_pay',
    nombre: 'Nexora Club & Carribar Pass (Closed-Loop)',
    subtitulo: '👑 Ecosistema Fintech Cerrado para Boliches, Barras & Carribares',
    descripcion: 'Sistema cerrado de cobros rápidos por QR, billetera digital prepaga para clientes, punto de venta táctil 1-clic para barras y carribares exteriores, control de stock por voz asistido por Nora IA y panel de gamificación en vivo para DJs.',
    categoria: 'Discotecas, Bares & Foodtrucks',
    icono: '🍸',
    version: '1.0.0 (Suite Oficial)',
    precioUsd: 150,
    destacado: true,
    tipoEntrega: 'web',
    urlAcceso: 'https://nexora-club-pay.vercel.app',
    tipoVersion: 'comercial',
    visible: true,
    caracteristicas: [
      '💰 Alcancía digital prepaga: recarga de saldo antes de entrar o en caja',
      '⚡ Débito atómico instantáneo (<1 segundo) con confirmación por Beep sonoro',
      '🔐 Separación de roles con PINs: Barra (1111), Carribar (2222), DJ Master (2026)',
      '📷 Doble vía de escaneo: el cliente escanea el cartel o el bartender escanea al cliente',
      '🎉 Premios y sorteos DJ en vivo acreditados al celular en tiempo real',
      '🎙️ Carga de mercadería por voz con Nora IA (cajones, botellas, medallones, panes)',
      '📊 Auditoría y arqueo ciego diario sin fugas de dinero ni comisiones por trago'
    ],
  },`;

if (!content.includes('nexora_club_pay')) {
  content = content.replace('const INITIAL_SOFTWARE_CATALOG: Software[] = [', `const INITIAL_SOFTWARE_CATALOG: Software[] = [\n${newProductSoftware}`);
  fs.writeFileSync(storePagePath, content, 'utf-8');
  console.log('Nexora Club & Carribar Pass agregado exitosamente a INITIAL_SOFTWARE_CATALOG en Nexora Store!');
}
