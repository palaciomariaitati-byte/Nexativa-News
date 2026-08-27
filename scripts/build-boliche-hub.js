const fs = require('fs');
const path = require('path');

const targetDir = 'D:/SUITE BOLICHES-NEXORAPAY';

// =========================================================================
// 1. PORTAL CENTRAL DE LANZAMIENTO (D:/SUITE BOLICHES-NEXORAPAY/index.html)
// =========================================================================
const hubHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexora Club & Carribar — Suite de Pagos y Gestión Nocturna</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #050811;
      --card-bg: rgba(13, 20, 36, 0.85);
      --border: rgba(30, 58, 102, 0.5);
      --gold: #e4a834;
      --gold-glow: rgba(228, 168, 52, 0.3);
      --cyan: #06b6d4;
      --cyan-glow: rgba(6, 182, 212, 0.3);
      --purple: #a855f7;
      --emerald: #10b981;
    }
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter', sans-serif; }
    body { background: var(--bg); color: #fff; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 24px 16px; }
    
    .header { text-align: center; max-width: 800px; margin: 20px auto 40px; }
    .badge-top { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 999px; background: rgba(228,168,52,0.15); border: 1px solid var(--gold); color: var(--gold); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px; }
    .title { font-family: 'Outfit', sans-serif; font-size: 38px; font-weight: 900; line-height: 1.1; margin-bottom: 12px; }
    .title span { background: linear-gradient(135deg, var(--gold), #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .desc { color: #94a3b8; font-size: 14px; line-height: 1.6; }

    .grid-modules { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 1100px; margin: 0 auto; width: 100%; }
    .mod-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 24px; padding: 28px 24px; display: flex; flex-direction: column; justify-content: space-between; text-decoration: none; color: inherit; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden; }
    .mod-card:hover { transform: translateY(-6px); border-color: var(--cyan); box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 25px var(--cyan-glow); }
    .mod-card.gold:hover { border-color: var(--gold); box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 25px var(--gold-glow); }
    .mod-card.purple:hover { border-color: var(--purple); box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 25px rgba(168,85,247,0.3); }
    .mod-card.emerald:hover { border-color: var(--emerald); box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 25px rgba(16,185,129,0.3); }

    .mod-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
    .mod-tag { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--gold); margin-bottom: 6px; }
    .mod-title { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 8px; }
    .mod-desc { font-size: 12px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; flex-grow: 1; }

    .btn-enter { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s; }
    .mod-card:hover .btn-enter { background: var(--cyan); color: #000; font-weight: 900; }
    .mod-card.gold:hover .btn-enter { background: var(--gold); color: #000; font-weight: 900; }
    .mod-card.purple:hover .btn-enter { background: var(--purple); color: #fff; font-weight: 900; }
    .mod-card.emerald:hover .btn-enter { background: var(--emerald); color: #000; font-weight: 900; }

    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); }
  </style>
</head>
<body>

  <div class="header">
    <div class="badge-top">👑 Ecosistema Boliche & Gastronomía Nocturna</div>
    <h1 class="title">NEXORA <span>CLUB & CARRIBAR</span></h1>
    <p class="desc">
      Sistema cerrado de cobros rápidos, billetera digital prepaga, control de barras, carribar exterior, stock por voz con Nora y premios en vivo para DJs.
    </p>
  </div>

  <div class="grid-modules">
    
    <!-- 1. WALLET CLIENTE -->
    <a href="wallet/index.html" class="mod-card gold">
      <div>
        <div class="mod-icon">📱</div>
        <div class="mod-tag">Billetera PWA del Cliente</div>
        <h2 class="mod-title">Wallet Nexora Pay</h2>
        <p class="mod-desc">
          Tarjeta digital con QR personal para que el cliente cargue saldo, compre en barra o carribar y reciba premios del DJ.
        </p>
      </div>
      <div class="btn-enter">
        <span>Abrir Wallet Cliente</span>
        <span>➔</span>
      </div>
    </a>

    <!-- 2. POS BARRA & CARRIBAR -->
    <a href="pos/index.html" class="mod-card">
      <div>
        <div class="mod-icon">🍸</div>
        <div class="mod-tag">Punto de Venta Rápido</div>
        <h2 class="mod-title">POS Barra & Carribar</h2>
        <p class="mod-desc">
          Pantalla táctil de 1-clic para bartenders y cajeros del carribar. Débito instantáneo por QR o ID con sonido de confirmación.
        </p>
      </div>
      <div class="btn-enter">
        <span>Abrir Terminal POS</span>
        <span>➔</span>
      </div>
    </a>

    <!-- 3. DASHBOARD MASTER & PREMIOS DJ -->
    <a href="dashboard/index.html" class="mod-card purple">
      <div>
        <div class="mod-icon">🎧</div>
        <div class="mod-tag">Control Central & Gamificación</div>
        <h2 class="mod-title">Master Control & DJ</h2>
        <p class="mod-desc">
          Métricas en tiempo real, arqueos de caja ciegos y acreditación de premios o saldo de regalo a clientes en vivo durante la noche.
        </p>
      </div>
      <div class="btn-enter">
        <span>Abrir Master Dashboard</span>
        <span>➔</span>
      </div>
    </a>

    <!-- 4. STOCK & INVENTARIO NORA VOZ -->
    <a href="stock_nora/index.html" class="mod-card emerald">
      <div>
        <div class="mod-icon">🎙️</div>
        <div class="mod-tag">Asistencia por Voz Nora IA</div>
        <h2 class="mod-title">Stock por Voz Nora</h2>
        <p class="mod-desc">
          Carga de cajones de cerveza, botellas, medallones y panes hablándole directamente a Nora con lenguaje natural.
        </p>
      </div>
      <div class="btn-enter">
        <span>Abrir Nora Stock</span>
        <span>➔</span>
      </div>
    </a>

  </div>

  <div class="footer">
    Nexora Pay &copy; 2026 • Arquitectura Cerrada de Alto Rendimiento • Cero Bloat • 100% RAM Friendly
  </div>

</body>
</html>`;

fs.writeFileSync(path.join(targetDir, 'index.html'), hubHtml, 'utf-8');
console.log('Portal principal creado en:', path.join(targetDir, 'index.html'));
