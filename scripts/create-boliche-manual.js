const fs = require('fs');
const path = require('path');

const targetDir = 'D:/SUITE BOLICHES-NEXORAPAY';

// =========================================================================
// 1. MANUAL DE USUARIO Y CLAVES DE ACCESO EN LA RAÍZ
// =========================================================================
const manualContent = `# 👑 NEXORA CLUB & CARRIBAR PASS — MANUAL OFICIAL Y CLAVES DE ACCESO

Bienvenido a la suite oficial de cobros rápidos en circuito cerrado (Closed-Loop Fintech) para Boliches, Discotecas y Carribares.

---

## 🔐 CLAVES Y PINS DE ACCESO POR SECTOR

| Sector / Módulo | URL / Archivo | PIN Rápido | Contraseña Alternativa | Permisos |
| :--- | :--- | :--- | :--- | :--- |
| 🍸 **Barra Boliche** | \`pos/index.html\` | **\`1111\`** | \`barra2026\` | Venta rápida de tragos, botellas y cervezas. Sin acceso a caja general. |
| 🍔 **Carribar Exterior** | \`pos/index.html\` | **\`2222\`** | \`carribar2026\` | Venta rápida de hamburguesas, lomitos y papas. Sin acceso a caja general. |
| 💵 **Caja de Recargas** | \`wallet/index.html\` | **\`3333\`** | \`caja2026\` | Acreditación de saldo inicial por efectivo o transferencia bancaria. |
| 👑 **Master Admin & DJ** | \`dashboard/index.html\` | **\`2026\`** | \`admin2026\` | Facturación total en vivo, arqueo ciego y sorteos/premios en pantalla. |
| 🎙️ **Nora Voice Stock** | \`stock_nora/index.html\` | **\`2026\`** | \`nora2026\` | Carga de inventario y mercadería por voz. |

---

## 🚀 CÓMO OPERAR EL SISTEMA (PASO A PASO)

### 1. Ingreso del Cliente (Carga de la Alcancía)
1. El cliente escanea el cartel QR en la entrada o barra y se le abre su **Wallet Pass** con su ID único (ej: \`#7821\`).
2. El cliente transfiere dinero a la cuenta **Brubank / Banco Nación** del boliche o paga en efectivo en la caja de entrada.
3. El cajero de entrada le acredita el saldo en su wallet (ej: \`$15.000 ARS\`).
4. **El dinero real ya está en la cuenta del boliche antes de servir una sola copa.**

### 2. Consumo en la Barra del Boliche
1. El bartender ingresa con su **PIN \`1111\`**.
2. Marca los tragos en la pantalla táctil (1-clic).
3. Toca **"📷 ESCANEAR QR"** y apunta al celular del cliente (o el cliente escanea el cartel de la barra).
4. El sistema debita el saldo en **menos de 1 segundo con confirmación sonora (Beep ✅)**.

### 3. Consumo en el Carribar Exterior (A la salida o toda la noche)
1. El cocinero/cajero del carribar ingresa con su **PIN \`2222\`**.
2. Marca las hamburguesas o lomitos.
3. Debita del saldo remanente que al cliente le sobró del boliche.

### 4. Animación DJ & Pantalla Gigante
1. El DJ ingresa a \`dashboard/index.html\` con el **PIN \`2026\`**.
2. En los momentos pico de la noche, selecciona un ID o lanza un sorteo en vivo.
3. Presiona **"🎉 Acreditar Premio ($5.000)"** y el saldo de regalo aparece en el celular del cliente en tiempo real.

---

## 🛠️ ESPECIFICACIONES TÉCNICAS
- **Cero Dependencia de Redes Interbancarias:** El débito es interno e instantáneo.
- **Auditoría Ciega:** Ningún empleado maneja dinero en la barra, eliminando robos y pérdidas.
- **Persistencia Híbrida:** Funciona en la nube (Vercel + Supabase) y en red local con respaldo offline.
`;

fs.writeFileSync(path.join(targetDir, 'MANUAL_DE_USUARIO_Y_CLAVES.md'), manualContent, 'utf-8');
fs.writeFileSync(path.join(targetDir, 'CLAVES_DE_ACCESO.txt'), `=== CLAVES DE ACCESO NEXORA CLUB & CARRIBAR ===
BARRA BOLICHE: 1111 (barra2026)
CARRIBAR EXTERIOR: 2222 (carribar2026)
CAJA RECARGAS: 3333 (caja2026)
MASTER ADMIN & DJ: 2026 (admin2026)
NORA VOICE STOCK: 2026 (nora2026)
`, 'utf-8');

console.log('Manual de usuario y claves de acceso creados en la raíz!');
