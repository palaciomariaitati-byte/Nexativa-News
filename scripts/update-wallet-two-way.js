const fs = require('fs');
const path = require('path');

const targetDir = 'D:/SUITE BOLICHES-NEXORAPAY';

// =========================================================================
// 1. WALLET DEL CLIENTE CON DOBLE VÍA: MOSTRAR QR + ESCANEAR QR DE BARRA
// =========================================================================
const walletHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Nexora Club Pass — Tu Alcancía Digital de Noche</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
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
      --rose: #f43f5e;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 16px; }
    
    .app-container { max-width: 440px; width: 100%; display: flex; flex-direction: column; gap: 16px; }

    /* HEADER */
    .top-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 4px; }
    .club-brand { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 900; }
    .club-brand span { color: var(--gold); }
    .status-pill { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); display:flex; align-items:center; gap:5px; }
    .status-pill::before { content:''; width:6px; height:6px; background:#34d399; border-radius:50%; box-shadow:0 0 8px #34d399; }

    /* TARJETA DIGITAL ALCANCIA */
    .vip-card {
      background: radial-gradient(circle at 85% 15%, rgba(228,168,52,0.22), transparent 45%),
                  radial-gradient(circle at 15% 85%, rgba(168,85,247,0.22), transparent 45%),
                  linear-gradient(135deg, #111a33 0%, #080d1a 100%);
      border: 1px solid rgba(228, 168, 52, 0.45);
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
    .balance-title { font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .balance-amount { font-family: 'Outfit', sans-serif; font-size: 42px; font-weight: 900; color: #fff; line-height: 1.1; margin-top: 4px; }
    .balance-amount span { font-size: 22px; color: var(--gold); margin-right: 4px; }

    .card-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
    .client-name { font-weight: 800; font-size: 16px; color: #fff; }
    .client-phone { font-size: 11px; color: var(--text-muted); }
    .card-badge-vip { font-size: 10px; font-weight: 900; background: linear-gradient(135deg, var(--gold), #f59e0b); color: #000; padding: 4px 10px; border-radius: 999px; }

    /* ACTION BUTTONS: SCAN BARRA & CARGAR */
    .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .btn-action-main {
      padding: 16px 14px;
      border-radius: 18px;
      border: none;
      font-weight: 900;
      font-size: 13px;
      font-family: 'Outfit', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action-main.scan { background: linear-gradient(135deg, var(--cyan), #0284c7); color: #000; box-shadow: 0 10px 25px rgba(6,182,212,0.3); }
    .btn-action-main.recarga { background: linear-gradient(135deg, var(--gold), #d97706); color: #000; box-shadow: 0 10px 25px rgba(228,168,52,0.3); }
    .btn-action-main:hover { transform: scale(1.02); filter: brightness(1.1); }
    .btn-action-main span.icon { font-size: 22px; }

    /* QR DEL CLIENTE (MODO MOSTRAR) */
    .qr-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 22px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 15px 30px rgba(0,0,0,0.5);
    }
    .qr-img { width: 180px; height: 180px; object-fit: contain; border-radius: 12px; }
    .qr-title { color: #090e1a; font-family: 'Outfit', sans-serif; font-size: 17px; font-weight: 900; margin-top: 12px; }
    .qr-hint { color: #64748b; font-size: 12px; font-weight: 600; margin-top: 4px; max-width: 280px; line-height: 1.4; }

    /* HISTORIAL */
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

    /* MODAL DE CAMARA PARA ESCANEAR LA BARRA */
    .scanner-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(10px); z-index: 150; display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
    .scanner-modal.active { opacity: 1; pointer-events: auto; }
    .scanner-card { background: #0f172a; border: 2px solid var(--cyan); border-radius: 28px; max-width: 400px; width: 100%; padding: 24px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.9); }
    .video-viewport { width: 100%; height: 240px; border-radius: 18px; background: #000; overflow: hidden; position: relative; border: 2px dashed rgba(6,182,212,0.6); margin: 16px 0; }
    #client-camera-video { width: 100%; height: 100%; object-fit: cover; }
    .scan-laser { position: absolute; top: 10%; left: 10%; right: 10%; height: 3px; background: var(--cyan); box-shadow: 0 0 15px var(--cyan); animation: scanMotion 2s infinite ease-in-out; }
    @keyframes scanMotion { 0% { top: 10%; } 50% { top: 90%; } 100% { top: 10%; } }

    /* MODAL DE PAGO TRAS ESCANEAR PUESTO */
    .pay-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 160; display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
    .pay-modal.active { opacity: 1; pointer-events: auto; }
    .pay-card { background: #0f172a; border: 2px solid var(--gold); border-radius: 28px; max-width: 400px; width: 100%; padding: 24px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.9); }
    .input-pay-monto { width: 100%; background: #070b14; border: 2px solid var(--gold); border-radius: 14px; padding: 14px; font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 900; color: #fff; text-align: center; outline: none; margin: 14px 0; }

    /* MODAL DE RECARGA */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
    .modal-backdrop.active { opacity: 1; pointer-events: auto; }
    .modal-card { background: #0f172a; border: 1px solid var(--gold); border-radius: 24px; max-width: 400px; width: 100%; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
    .bank-box { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; margin-bottom: 12px; text-align:left; }
    .bank-title { font-size: 11px; font-weight: 800; color: var(--gold); text-transform: uppercase; margin-bottom: 4px; }
    .bank-alias { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; color: #38bdf8; display: flex; justify-content: space-between; align-items: center; }
    .btn-copy-mini { background: rgba(6,182,212,0.2); border: 1px solid var(--cyan); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 10px; cursor: pointer; }

    /* TOAST */
    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px); background: #0f172a; border: 1px solid var(--emerald); color: #fff; padding: 12px 20px; border-radius: 999px; font-size: 12px; font-weight: 800; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 200; opacity: 0; transition: all 0.3s; }
    .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
  </style>
</head>
<body>

  <div class="app-container">
    
    <!-- HEADER -->
    <div class="top-header">
      <div class="club-brand">NEXORA <span>CLUB & CARRIBAR</span></div>
      <div class="status-pill">Alcancía Prepaga Activa</div>
    </div>

    <!-- TARJETA DIGITAL -->
    <div class="vip-card">
      <div class="card-top">
        <div class="card-label">Nexora Club Pass</div>
        <div class="card-id" id="card-id-text">ID: #7821</div>
      </div>

      <div class="card-balance-box">
        <div class="balance-title">Saldo en Alcancía Prepaga</div>
        <div class="balance-amount"><span id="currency-symbol">$</span><span id="wallet-balance">15.000</span></div>
      </div>

      <div class="card-bottom">
        <div>
          <div class="client-name" id="client-name-text">Lucas Benítez</div>
          <div class="client-phone">Válido en Boliche & Carribar</div>
        </div>
        <div class="card-badge-vip">PAGO 1-CLIC</div>
      </div>
    </div>

    <!-- BOTONES PRINCIPALES DE ACCIÓN -->
    <div class="actions-grid">
      <button class="btn-action-main scan" onclick="openClientScanner()">
        <span class="icon">📷</span>
        <span>Escanear Barra / Carribar</span>
      </button>

      <button class="btn-action-main recarga" onclick="openRecargaModal()">
        <span class="icon">💳</span>
        <span>Recargar Alcancía</span>
      </button>
    </div>

    <!-- CÓDIGO QR PARA QUE EL BARTENDER ESCANEE -->
    <div class="qr-card">
      <img id="qr-wallet-img" class="qr-img" src="" alt="QR de Pago">
      <div class="qr-title">Tu QR Pass Personal</div>
      <div class="qr-hint">
        O mostrale este código al bartender para que te cobre directamente con su escáner en la barra.
      </div>
    </div>

    <!-- HISTORIAL DE CONSUMOS -->
    <div class="history-card">
      <div class="history-header">
        <div class="history-title">Movimientos en Vivo</div>
        <span style="font-size: 11px; color: var(--gold); font-weight: 700;">Circuito Cerrado</span>
      </div>
      <div class="history-list" id="history-list">
        <!-- Generado dinámicamente -->
      </div>
    </div>

  </div>

  <!-- MODAL DE CAMARA PARA ESCANEAR PUESTO DE BARRA -->
  <div class="scanner-modal" id="client-scanner-modal">
    <div class="scanner-card">
      <h2 style="font-family:'Outfit',sans-serif; font-size:20px; font-weight:900; color:#fff;">
        📷 Escanear QR del Mostrador
      </h2>
      <p style="font-size:12px; color:#94a3b8; margin-top:4px;">
        Apuntá al cartel con el QR en la Barra o en el Carribar Exterior.
      </p>

      <div class="video-viewport">
        <video id="client-camera-video" playsinline></video>
        <canvas id="client-camera-canvas" style="display:none;"></canvas>
        <div class="scan-laser"></div>
      </div>

      <div style="font-size:12px; font-weight:700; color:var(--cyan);" id="client-scan-status">
        Buscando QR de Barra o Carribar...
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px;">
        <button style="padding:12px; border-radius:12px; background:rgba(6,182,212,0.2); border:1px solid var(--cyan); color:#fff; font-weight:800; font-size:11px; cursor:pointer;" onclick="simularLecturaPuesto('Barra Central #01', 4500)">
          ⚡ Probar Barra ($4.500)
        </button>
        <button style="padding:12px; border-radius:12px; background:rgba(228,168,52,0.2); border:1px solid var(--gold); color:#fff; font-weight:800; font-size:11px; cursor:pointer;" onclick="simularLecturaPuesto('Carribar Exterior', 5500)">
          ⚡ Probar Burger ($5.500)
        </button>
      </div>

      <button style="margin-top:12px; width:100%; padding:12px; border-radius:12px; background:rgba(255,255,255,0.08); border:1px solid var(--card-border); color:#fff; font-weight:800; font-size:11px; cursor:pointer;" onclick="closeClientScanner()">
        ✕ Cancelar
      </button>
    </div>
  </div>

  <!-- MODAL DE CONFIRMACIÓN DE PAGO -->
  <div class="pay-modal" id="pay-confirm-modal">
    <div class="pay-card">
      <div style="font-size:38px; margin-bottom:6px;">🍹</div>
      <h2 style="font-family:'Outfit',sans-serif; font-size:22px; font-weight:900; color:#fff;" id="pay-puesto-title">
        Pagar en Barra Central
      </h2>
      <p style="font-size:12px; color:var(--text-muted);">Confirmá el monto a transferir desde tu Alcancía</p>
      
      <input type="number" id="input-pay-amount" class="input-pay-monto" value="4500">

      <button style="width:100%; padding:16px; border-radius:16px; border:none; background:linear-gradient(135deg, var(--emerald), #059669); color:#000; font-family:'Outfit',sans-serif; font-size:16px; font-weight:900; cursor:pointer;" onclick="confirmarPagoCliente()">
        ⚡ CONFIRMAR Y PAGAR AHORA
      </button>

      <button style="margin-top:10px; width:100%; padding:10px; border-radius:12px; background:transparent; border:none; color:#94a3b8; font-size:12px; font-weight:700; cursor:pointer;" onclick="closePayModal()">
        Cancelar
      </button>
    </div>
  </div>

  <!-- MODAL DE RECARGA CON CUENTAS BANCARIAS -->
  <div class="modal-backdrop" id="recarga-modal">
    <div class="modal-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <div style="font-family:'Outfit',sans-serif; font-size:18px; font-weight:900;">💳 Cargar Dinero a la Alcancía</div>
        <button style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer;" onclick="closeModal('recarga-modal')">&times;</button>
      </div>

      <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">
        Cargá saldo antes de entrar o en caja. Tu saldo queda guardado para gastar en el boliche y en el carribar.
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

      <button class="btn-action-main recarga" style="width:100%; margin-top:8px;" onclick="cargarSaldoSimulado(15000)">
        ⚡ Simular Carga de $15.000 (Test)
      </button>
    </div>
  </div>

  <!-- TOAST -->
  <div class="toast" id="toast">¡Operación exitosa!</div>

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
        { desc: 'Carribar Exterior: Hamburguesa Completa', time: 'Hoy 03:30 hs', monto: -5500, positivo: false }
      ]
    };

    let clientVideoStream = null;
    let clientScanInterval = null;
    let selectedPuesto = 'Barra Central #01';

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
      document.getElementById('client-name-text').innerText = walletData.nombre;
      document.getElementById('wallet-balance').innerText = walletData.saldo.toLocaleString('es-AR');

      // Generar imagen QR personal
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

    // =========================================================================
    // ESCÁNER DE CÁMARA DEL CLIENTE
    // =========================================================================
    async function openClientScanner() {
      const modal = document.getElementById('client-scanner-modal');
      const video = document.getElementById('client-camera-video');
      const statusText = document.getElementById('client-scan-status');

      modal.classList.add('active');
      statusText.innerText = 'Iniciando cámara...';

      try {
        clientVideoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        video.srcObject = clientVideoStream;
        await video.play();
        statusText.innerText = 'Apuntá al QR del mostrador...';
        startClientQRProcessing();
      } catch (err) {
        statusText.innerText = 'Cámara no disponible en este dispositivo. Podés usar los botones rápidos.';
      }
    }

    function startClientQRProcessing() {
      const video = document.getElementById('client-camera-video');
      const canvas = document.getElementById('client-camera-canvas');
      const ctx = canvas.getContext('2d');

      clientScanInterval = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          if (window.jsQR) {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              simularLecturaPuesto(code.data, 4500);
            }
          }
        }
      }, 150);
    }

    function simularLecturaPuesto(puesto, montoDefecto) {
      closeClientScanner();
      selectedPuesto = puesto;
      document.getElementById('pay-puesto-title').innerText = 'Pagar en ' + puesto;
      document.getElementById('input-pay-amount').value = montoDefecto;
      document.getElementById('pay-confirm-modal').classList.add('active');
    }

    function closeClientScanner() {
      if (clientScanInterval) clearInterval(clientScanInterval);
      if (clientVideoStream) {
        clientVideoStream.getTracks().forEach(track => track.stop());
        clientVideoStream = null;
      }
      document.getElementById('client-scanner-modal').classList.remove('active');
    }

    function closePayModal() {
      document.getElementById('pay-confirm-modal').classList.remove('active');
    }

    function confirmarPagoCliente() {
      const monto = Number(document.getElementById('input-pay-amount').value);
      if (monto <= 0) return;

      if (walletData.saldo < monto) {
        alert('❌ Saldo insuficiente en tu Alcancía. Tu saldo es $' + walletData.saldo.toLocaleString('es-AR'));
        return;
      }

      walletData.saldo -= monto;
      walletData.historial.unshift({
        desc: 'Pago directo en ' + selectedPuesto,
        time: 'Recién',
        monto: -monto,
        positivo: false
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(walletData));

      renderWallet();
      closePayModal();
      playBeep();
      showToast('✅ ¡Pago de $' + monto.toLocaleString('es-AR') + ' enviado con éxito a ' + selectedPuesto + '!');
    }

    // =========================================================================
    // RECARGAS Y UTILIDADES
    // =========================================================================
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
      playBeep();
      showToast('💰 ¡Se acreditaron $' + monto.toLocaleString('es-AR') + ' en tu Alcancía!');
    }

    function playBeep() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 920;
        gain.gain.value = 0.15;
        osc.start();
        setTimeout(() => { osc.stop(); audioCtx.close(); }, 120);
      } catch(e){}
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
console.log('Wallet actualizada con Doble Vía de Escaneo QR en wallet/index.html');
