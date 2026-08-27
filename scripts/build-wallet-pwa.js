const fs = require('fs');
const path = require('path');

const targetDir = 'D:/SUITE BOLICHES-NEXORAPAY';

// =========================================================================
// 1. WALLET PWA DEL CLIENTE (wallet/index.html)
// =========================================================================
const walletHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Nexora Club Wallet — Tu Tarjeta Digital de Noche</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #060913;
      --card: #0d1527;
      --card-border: rgba(30, 58, 102, 0.6);
      --gold: #e4a834;
      --gold-glow: rgba(228, 168, 52, 0.35);
      --purple: #a855f7;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 16px; }
    
    .app-container { max-width: 440px; width: 100%; display: flex; flex-direction: column; gap: 16px; }

    /* HEADER */
    .top-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 4px; }
    .club-brand { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 900; }
    .club-brand span { color: var(--gold); }
    .status-pill { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }

    /* TARJETA DIGITAL VIP */
    .vip-card {
      background: radial-gradient(circle at 80% 20%, rgba(228,168,52,0.2), transparent 45%),
                  radial-gradient(circle at 20% 80%, rgba(168,85,247,0.2), transparent 45%),
                  linear-gradient(135deg, #111a33 0%, #080d1a 100%);
      border: 1px solid rgba(228, 168, 52, 0.4);
      border-radius: 24px;
      padding: 24px 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 30px var(--gold-glow);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 220px;
      position: relative;
      overflow: hidden;
    }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .card-label { font-size: 11px; font-weight: 800; color: var(--gold); text-transform: uppercase; letter-spacing: 1.5px; }
    .card-id { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; color: #fff; background: rgba(0,0,0,0.4); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
    
    .card-balance-box { margin: 16px 0; }
    .balance-title { font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
    .balance-amount { font-family: 'Outfit', sans-serif; font-size: 40px; font-weight: 900; color: #fff; line-height: 1.1; margin-top: 4px; }
    .balance-amount span { font-size: 20px; color: var(--gold); margin-right: 4px; }

    .card-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
    .client-name { font-weight: 800; font-size: 16px; color: #fff; }
    .client-phone { font-size: 11px; color: var(--text-muted); }
    .card-badge-vip { font-size: 10px; font-weight: 900; background: linear-gradient(135deg, var(--gold), #f59e0b); color: #000; padding: 4px 10px; border-radius: 999px; }

    /* QR BOX */
    .qr-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 15px 30px rgba(0,0,0,0.5);
    }
    .qr-img { width: 190px; height: 190px; object-fit: contain; border-radius: 12px; }
    .qr-title { color: #090e1a; font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 900; margin-top: 14px; }
    .qr-hint { color: #64748b; font-size: 12px; font-weight: 600; margin-top: 4px; max-width: 280px; }

    /* ACTION BUTTONS */
    .actions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .btn-act {
      padding: 14px;
      border-radius: 16px;
      border: 1px solid var(--card-border);
      background: var(--card);
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-act.primary { background: linear-gradient(135deg, var(--gold), #d97706); color: #000; border: none; }
    .btn-act:hover { transform: scale(1.02); }

    /* HISTORIAL DE MOVIMIENTOS */
    .history-card { background: var(--card); border: 1px solid var(--card-border); border-radius: 20px; padding: 18px; }
    .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .history-title { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .history-list { display: flex; flex-direction: column; gap: 10px; }
    .history-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(0,0,0,0.3); border-radius: 12px; font-size: 12px; }
    .hist-desc { font-weight: 700; color: #fff; }
    .hist-time { font-size: 10px; color: var(--text-muted); }
    .hist-amount { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 13px; }
    .hist-amount.negative { color: #f87171; }
    .hist-amount.positive { color: #34d399; }

    /* MODAL DE RECARGA */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
    .modal-backdrop.active { opacity: 1; pointer-events: auto; }
    .modal-card { background: #0f172a; border: 1px solid var(--gold); border-radius: 24px; max-width: 400px; width: 100%; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .modal-title { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 900; }
    
    .bank-box { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; margin-bottom: 12px; }
    .bank-title { font-size: 11px; font-weight: 800; color: var(--gold); text-transform: uppercase; margin-bottom: 4px; }
    .bank-alias { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; color: #38bdf8; display: flex; justify-content: space-between; align-items: center; }
    .btn-copy-mini { background: rgba(6,182,212,0.2); border: 1px solid var(--cyan); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 10px; cursor: pointer; }

    /* TOAST */
    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px); background: #0f172a; border: 1px solid var(--gold); color: #fff; padding: 12px 20px; border-radius: 999px; font-size: 12px; font-weight: 800; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 200; opacity: 0; transition: all 0.3s; }
    .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
  </style>
</head>
<body>

  <div class="app-container">
    
    <!-- HEADER -->
    <div class="top-header">
      <div class="club-brand">DISCO <span>& CARRIBAR</span></div>
      <div class="status-pill">● Billetera Activa</div>
    </div>

    <!-- TARJETA DIGITAL -->
    <div class="vip-card">
      <div class="card-top">
        <div class="card-label">Nexora Club Pass</div>
        <div class="card-id" id="card-id-text">ID: #7821</div>
      </div>

      <div class="card-balance-box">
        <div class="balance-title">Saldo Disponible para Consumos</div>
        <div class="balance-amount"><span id="currency-symbol">$</span><span id="wallet-balance">15.000</span></div>
      </div>

      <div class="card-bottom">
        <div>
          <div class="client-name" id="client-name-text">Lucas Benítez</div>
          <div class="client-phone">WhatsApp: +54 9 3786 40-1234</div>
        </div>
        <div class="card-badge-vip">CLUB VIP</div>
      </div>
    </div>

    <!-- QR CODE DE PAGO -->
    <div class="qr-card">
      <img id="qr-wallet-img" class="qr-img" src="" alt="QR de Pago">
      <div class="qr-title">Código QR Personal</div>
      <div class="qr-hint">Mostrá este código en la barra o en el carribar exterior para pagar en 1 segundo.</div>
    </div>

    <!-- BOTONES DE ACCIÓN -->
    <div class="actions-row">
      <button class="btn-act primary" onclick="openRecargaModal()">
        <span>💳</span> Recargar Saldo
      </button>
      <button class="btn-act" onclick="simularPremioDJ()">
        <span>🎉</span> Probar Premio DJ
      </button>
    </div>

    <!-- HISTORIAL -->
    <div class="history-card">
      <div class="history-header">
        <div class="history-title">Últimos Movimientos</div>
        <span style="font-size: 11px; color: var(--gold); font-weight: 700;">Válido en Boliche & Carribar</span>
      </div>
      <div class="history-list" id="history-list">
        <!-- Generado dinámicamente -->
      </div>
    </div>

  </div>

  <!-- MODAL DE RECARGA -->
  <div class="modal-backdrop" id="recarga-modal">
    <div class="modal-card">
      <div class="modal-head">
        <div class="modal-title">💳 Recargar Saldo</div>
        <button style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer;" onclick="closeModal('recarga-modal')">&times;</button>
      </div>
      <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
        Acercate a la caja de entrada o transferí por Brubank / Banco Nación y mostrá tu comprobante con tu ID <strong style="color:#fff;" id="modal-id-text">#7821</strong>.
      </p>

      <div class="bank-box">
        <div class="bank-title">Brubank (Transferencia Inmediata)</div>
        <div class="bank-alias">
          <span>NEXORA.BRUBANK</span>
          <button class="btn-copy-mini" onclick="copyText('NEXORA.BRUBANK')">Copiar</button>
        </div>
      </div>

      <div class="bank-box">
        <div class="bank-title">Banco Nación (BNA)</div>
        <div class="bank-alias">
          <span>NEXORA.NACION</span>
          <button class="btn-copy-mini" onclick="copyText('NEXORA.NACION')">Copiar</button>
        </div>
      </div>

      <button class="btn-act primary" style="width:100%; margin-top:8px;" onclick="cargarSaldoSimulado(10000)">
        ⚡ Simular Carga de $10.000 (Test)
      </button>
    </div>
  </div>

  <!-- TOAST -->
  <div class="toast" id="toast">¡Operación realizada con éxito!</div>

  <script>
    const STORAGE_KEY = 'nexora_club_wallet_v1';

    let walletData = {
      id_personal: 'NEX-CLUB-7821',
      id_corto: '#7821',
      nombre: 'Lucas Benítez',
      telefono: '5493786401234',
      saldo: 15000,
      historial: [
        { desc: 'Carga de Saldo Inicial en Caja', time: 'Hoy 23:45 hs', monto: 15000, positivo: true },
        { desc: 'Barra Central: 2x Fernet Branca', time: 'Hoy 01:15 hs', monto: -9000, positivo: false },
        { desc: 'Carribar Exterior: Hamburguesa Completa', time: 'Hoy 03:30 hs', monto: -5500, positivo: false },
        { desc: 'Premio DJ Sorteo en Vivo 04:00', time: 'Hoy 04:00 hs', monto: 5000, positivo: true }
      ]
    };

    function initWallet() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { walletData = JSON.parse(stored); } catch(e){}
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(walletData));
      }
      renderWallet();
    }

    function renderWallet() {
      document.getElementById('card-id-text').innerText = 'ID: ' + walletData.id_corto;
      document.getElementById('modal-id-text').innerText = walletData.id_corto;
      document.getElementById('client-name-text').innerText = walletData.nombre;
      document.getElementById('wallet-balance').innerText = walletData.saldo.toLocaleString('es-AR');

      // Generar imagen QR
      const qrData = JSON.stringify({
        id: walletData.id_personal,
        id_corto: walletData.id_corto,
        nombre: walletData.nombre
      });
      const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=' + encodeURIComponent(qrData);
      document.getElementById('qr-wallet-img').src = qrUrl;

      // Render Historial
      const hList = document.getElementById('history-list');
      hList.innerHTML = walletData.historial.slice(0, 6).map(h => \`
        <div class="history-item">
          <div>
            <div class="hist-desc">\${h.desc}</div>
            <div class="hist-time">\${h.time}</div>
          </div>
          <div class="hist-amount \${h.positivo ? 'positive' : 'negative'}">
            \${h.positivo ? '+' : ''}\${h.monto.toLocaleString('es-AR')}
          </div>
        </div>
      \`).join('');
    }

    function openRecargaModal() {
      document.getElementById('recarga-modal').classList.add('active');
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('active');
    }

    function copyText(txt) {
      navigator.clipboard.writeText(txt);
      showToast('¡Alias copiado al portapapeles! 📋');
    }

    function cargarSaldoSimulado(monto) {
      walletData.saldo += monto;
      walletData.historial.unshift({
        desc: 'Recarga de Saldo en Caja de Entrada',
        time: 'Recién',
        monto: monto,
        positivo: true
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(walletData));
      renderWallet();
      closeModal('recarga-modal');
      showToast('¡Se acreditaron $' + monto.toLocaleString('es-AR') + ' en tu Wallet! 💰');
    }

    function simularPremioDJ() {
      const premio = 5000;
      walletData.saldo += premio;
      walletData.historial.unshift({
        desc: '🎉 ¡Premio DJ por Meta de Baile en Vivo!',
        time: 'Recién',
        monto: premio,
        positivo: true
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(walletData));
      renderWallet();
      showToast('🎉 ¡Ganaste un Premio de $5.000 acreditado por el DJ!');
    }

    function showToast(txt) {
      const t = document.getElementById('toast');
      t.innerText = txt;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3500);
    }

    initWallet();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(targetDir, 'wallet', 'index.html'), walletHtml, 'utf-8');
console.log('Wallet PWA creada en wallet/index.html');
