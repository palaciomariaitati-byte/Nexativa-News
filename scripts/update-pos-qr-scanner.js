const fs = require('fs');
const path = require('path');

const targetDir = 'D:/SUITE BOLICHES-NEXORAPAY';

const posHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminal POS — Barra Boliche & Carribar Fast-Sales</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
  <!-- jsQR ultra-ligero para escaneo real de cámara sin lag -->
  <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
  <style>
    :root {
      --bg: #070b14;
      --panel: #0d1527;
      --border: rgba(30, 58, 102, 0.6);
      --gold: #e4a834;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --rose: #f43f5e;
      --purple: #a855f7;
    }
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter', sans-serif; user-select:none; }
    body { background: var(--bg); color: #fff; min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }

    /* HEADER */
    header { background: #0c1222; border-bottom: 1px solid var(--border); padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 900; }
    .brand span { color: var(--gold); }
    
    .sector-switch { display: flex; background: rgba(0,0,0,0.5); padding: 4px; border-radius: 999px; border: 1px solid var(--border); gap: 4px; }
    .btn-sector { padding: 8px 18px; border-radius: 999px; border: none; background: transparent; color: #94a3b8; font-weight: 800; font-size: 12px; cursor: pointer; transition: all 0.2s; }
    .btn-sector.active { background: var(--gold); color: #000; box-shadow: 0 0 15px rgba(228,168,52,0.4); }

    /* MAIN LAYOUT */
    .pos-layout { display: grid; grid-template-columns: 1fr 380px; flex: 1; height: calc(100vh - 70px); }

    /* MENU GRID */
    .menu-area { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
    .cat-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-cat { padding: 8px 16px; border-radius: 12px; background: var(--panel); border: 1px solid var(--border); color: #94a3b8; font-weight: 700; font-size: 12px; cursor: pointer; transition: all 0.2s; }
    .btn-cat.active, .btn-cat:hover { background: rgba(6,182,212,0.15); border-color: var(--cyan); color: #fff; }

    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
    .item-card { background: var(--panel); border: 1px solid var(--border); border-radius: 18px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: all 0.15s; min-height: 140px; position: relative; }
    .item-card:hover { transform: scale(1.02); border-color: var(--cyan); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
    .item-card:active { transform: scale(0.98); }
    .item-icon { font-size: 32px; margin-bottom: 6px; }
    .item-title { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 800; line-height: 1.2; }
    .item-price { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 800; color: var(--gold); margin-top: 8px; }

    /* CART & CHECKOUT SIDEBAR */
    .checkout-sidebar { background: #0c1222; border-left: 1px solid var(--border); display: flex; flex-direction: column; justify-content: space-between; padding: 20px; }
    .cart-title { font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
    
    .cart-items { flex: 1; overflow-y: auto; padding: 12px 0; display: flex; flex-direction: column; gap: 8px; }
    .cart-row { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 10px; font-size: 12px; }
    .cart-row-title { font-weight: 700; }
    .cart-row-qty { color: var(--gold); font-weight: 800; margin-right: 6px; }
    .btn-del { color: var(--rose); background: none; border: none; font-size: 14px; cursor: pointer; padding-left: 8px; }

    .client-box { background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 14px; }
    .client-input-row { display: flex; gap: 8px; margin-top: 8px; }
    .input-id { flex: 1; background: #070b14; border: 1px solid var(--border); border-radius: 10px; padding: 10px; color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 800; text-align: center; outline: none; }
    .input-id:focus { border-color: var(--gold); }
    .btn-scan { background: linear-gradient(135deg, var(--gold), #d97706); color: #000; border: none; padding: 0 16px; border-radius: 10px; font-weight: 900; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: transform 0.15s; }
    .btn-scan:hover { transform: scale(1.04); }

    .total-box { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; border-top: 1px solid var(--border); padding-top: 14px; }
    .total-label { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .total-val { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 900; color: #fff; }
    .total-val span { color: var(--gold); }

    .btn-charge { width: 100%; padding: 18px; border-radius: 18px; border: none; background: linear-gradient(135deg, var(--gold), #f59e0b); color: #000; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 25px rgba(228,168,52,0.4); }
    .btn-charge:hover { filter: brightness(1.1); transform: scale(1.02); }
    .btn-charge:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

    /* MODAL DE CÁMARA ESCÁNER QR */
    .scanner-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(10px); z-index: 150; display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
    .scanner-modal.active { opacity: 1; pointer-events: auto; }
    .scanner-card { background: #0f172a; border: 2px solid var(--gold); border-radius: 28px; max-width: 440px; width: 100%; padding: 24px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.9); }
    
    .video-viewport { width: 100%; height: 260px; border-radius: 18px; background: #000; overflow: hidden; position: relative; border: 2px dashed rgba(228,168,52,0.6); margin: 16px 0; display: flex; align-items: center; justify-content: center; }
    #camera-video { width: 100%; height: 100%; object-fit: cover; }
    .scan-laser { position: absolute; top: 10%; left: 10%; right: 10%; height: 3px; background: var(--rose); box-shadow: 0 0 15px var(--rose); animation: scanMotion 2s infinite ease-in-out; }
    @keyframes scanMotion { 0% { top: 10%; } 50% { top: 90%; } 100% { top: 10%; } }

    .scanner-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
    .btn-scanner-test { padding: 12px; border-radius: 12px; background: rgba(6,182,212,0.15); border: 1px solid var(--cyan); color: #fff; font-weight: 800; font-size: 11px; cursor: pointer; }
    .btn-scanner-close { padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: #fff; font-weight: 800; font-size: 11px; cursor: pointer; }

    /* POPUP DE COBRO EXITOSO */
    .success-pop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 200; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
    .success-pop.active { opacity: 1; pointer-events: auto; }
    .success-card { background: #0f172a; border: 2px solid var(--emerald); border-radius: 28px; padding: 32px 24px; text-align: center; max-width: 360px; width: 100%; box-shadow: 0 0 40px rgba(16,185,129,0.4); animation: popScale 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes popScale { 0% { transform: scale(0.8); } 100% { transform: scale(1); } }
  </style>
</head>
<body>

  <header>
    <div class="brand">NEXORA <span>POS FAST-SALES</span></div>

    <div class="sector-switch">
      <button class="btn-sector active" onclick="switchSector('boliche', this)">🍸 Barra Boliche</button>
      <button class="btn-sector" onclick="switchSector('carribar', this)">🍔 Carribar Exterior</button>
    </div>

    <div style="font-size: 12px; font-weight: 700; color: #94a3b8;">
      Cajero: <strong style="color:#fff;">Caja 01</strong>
    </div>
  </header>

  <div class="pos-layout">
    
    <!-- ÁREA DE PRODUCTOS -->
    <div class="menu-area">
      <div class="cat-filters" id="cat-filters">
        <button class="btn-cat active" onclick="filterCat('todos', this)">Todos</button>
        <button class="btn-cat" onclick="filterCat('tragos', this)">🥃 Tragos</button>
        <button class="btn-cat" onclick="filterCat('cervezas', this)">🍺 Cervezas</button>
        <button class="btn-cat" onclick="filterCat('comidas', this)">🍔 Comidas Carribar</button>
      </div>

      <div class="items-grid" id="items-grid">
        <!-- Generado dinámicamente -->
      </div>
    </div>

    <!-- SIDEBAR CHECKOUT -->
    <div class="checkout-sidebar">
      <div>
        <div class="cart-title">
          <span>Comanda Actual</span>
          <button style="background:none; border:none; color:var(--rose); font-size:11px; font-weight:700; cursor:pointer;" onclick="clearCart()">Vaciar</button>
        </div>

        <div class="cart-items" id="cart-items">
          <div style="text-align:center; padding: 40px 0; color:#64748b; font-size:12px;">
            Tocá los productos para sumar a la orden
          </div>
        </div>
      </div>

      <div>
        <div class="client-box">
          <div style="font-size:11px; font-weight:800; color:var(--gold); text-transform:uppercase;">
            ID de Cliente / Wallet Nexora Pay
          </div>
          <div class="client-input-row">
            <input type="text" id="client-id" class="input-id" placeholder="#7821" value="7821">
            <button class="btn-scan" onclick="openCameraScanner()">
              <span>📷</span> ESCANEAR QR
            </button>
          </div>
          <div style="font-size:10px; color:#94a3b8; margin-top:6px; text-align:center;">
            Compatible con Cámara de Celular, Tablet y Pistolas Lectoras
          </div>
        </div>

        <div class="total-box">
          <div class="total-label">Total a Cobrar</div>
          <div class="total-val"><span>$</span><span id="cart-total">0</span></div>
        </div>

        <button id="btn-submit-charge" class="btn-charge" disabled onclick="procesarCobroDirecto()">
          ⚡ DEBITAR SALDO AHORA
        </button>
      </div>
    </div>

  </div>

  <!-- MODAL DE CÁMARA ESCÁNER QR -->
  <div class="scanner-modal" id="scanner-modal">
    <div class="scanner-card">
      <h2 style="font-family:'Outfit',sans-serif; font-size:20px; font-weight:900; color:#fff;">
        📷 Escaneando QR de Wallet
      </h2>
      <p style="font-size:12px; color:#94a3b8; margin-top:4px;">
        Apuntá la cámara al código QR en la pantalla del celular del cliente.
      </p>

      <div class="video-viewport">
        <video id="camera-video" playsinline></video>
        <canvas id="camera-canvas" style="display:none;"></canvas>
        <div class="scan-laser"></div>
      </div>

      <div style="font-size:12px; font-weight:700; color:var(--gold);" id="scan-status-text">
        Buscando código QR en el visor...
      </div>

      <div class="scanner-actions">
        <button class="btn-scanner-test" onclick="simularEscaneoInmediato()">
          ⚡ Probar con Wallet #7821
        </button>
        <button class="btn-scanner-close" onclick="closeCameraScanner()">
          ✕ Cancelar / Cerrar
        </button>
      </div>
    </div>
  </div>

  <!-- POPUP DE COBRO EXITOSO -->
  <div class="success-pop" id="success-pop">
    <div class="success-card">
      <div style="font-size: 54px; margin-bottom: 12px;">✅</div>
      <h2 style="font-family:'Outfit',sans-serif; font-size:24px; font-weight:900; color:#fff;">¡Cobro Exitoso!</h2>
      <div style="font-family:'JetBrains Mono',monospace; font-size:28px; font-weight:900; color:var(--emerald); margin: 10px 0;" id="pop-amount">$0</div>
      <p style="font-size:12px; color:#94a3b8;" id="pop-client">Debitado de Wallet #7821 (Lucas Benítez)</p>
      <div style="font-size:11px; color:var(--gold); font-weight:700; margin-top:8px;" id="pop-new-balance">Nuevo Saldo: $0</div>
      <button style="margin-top:20px; width:100%; padding:14px; border-radius:14px; border:none; background:var(--emerald); color:#000; font-weight:900; font-size:13px; cursor:pointer;" onclick="closeSuccessPop()">
        LISTO PARA SIGUIENTE CLIENTE ➔
      </button>
    </div>
  </div>

  <script>
    let currentSector = 'boliche';
    let activeCategory = 'todos';
    let cart = [];
    let videoStream = null;
    let scanInterval = null;

    const products = [
      { id: 'fernet', name: 'Fernet Branca con Coca', price: 4500, icon: '🥃', sector: 'boliche', cat: 'tragos' },
      { id: 'gin', name: 'Gin Tonic con Pepino', price: 5000, icon: '🍸', sector: 'boliche', cat: 'tragos' },
      { id: 'cerveza_lata', name: 'Cerveza Lata 473cc', price: 2800, icon: '🍺', sector: 'ambos', cat: 'cervezas' },
      { id: 'cerveza_tirada', name: 'Pinta Cerveza Tirada', price: 3200, icon: '🍻', sector: 'ambos', cat: 'cervezas' },
      { id: 'vodka', name: 'Vodka con Speed', price: 4200, icon: '🍹', sector: 'boliche', cat: 'tragos' },
      { id: 'gaseosa', name: 'Gaseosa 500cc / Agua', price: 1800, icon: '🥤', sector: 'ambos', cat: 'tragos' },
      { id: 'burger', name: 'Hamburguesa Completa con Fritas', price: 5500, icon: '🍔', sector: 'carribar', cat: 'comidas' },
      { id: 'lomito', name: 'Lomito Especial Completo', price: 6800, icon: '🥪', sector: 'carribar', cat: 'comidas' },
      { id: 'papas', name: 'Cono de Papas con Cheddar', price: 3000, icon: '🍟', sector: 'carribar', cat: 'comidas' },
      { id: 'combo', name: 'Combo After: Burger + Birra', price: 7500, icon: '👑', sector: 'carribar', cat: 'comidas' }
    ];

    function switchSector(sec, btn) {
      currentSector = sec;
      document.querySelectorAll('.btn-sector').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderMenu();
    }

    function filterCat(cat, btn) {
      activeCategory = cat;
      document.querySelectorAll('.btn-cat').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderMenu();
    }

    function renderMenu() {
      const grid = document.getElementById('items-grid');
      const filtered = products.filter(p => {
        const matchSec = p.sector === 'ambos' || p.sector === currentSector;
        const matchCat = activeCategory === 'todos' || p.cat === activeCategory;
        return matchSec && matchCat;
      });

      grid.innerHTML = filtered.map(p => \`
        <div class="item-card" onclick="addToCart('\${p.id}')">
          <div>
            <div class="item-icon">\${p.icon}</div>
            <div class="item-title">\${p.name}</div>
          </div>
          <div class="item-price">$\${p.price.toLocaleString('es-AR')}</div>
        </div>
      \`).join('');
    }

    function addToCart(id) {
      const p = products.find(i => i.id === id);
      if (!p) return;
      const exist = cart.find(i => i.id === id);
      if (exist) {
        exist.qty++;
      } else {
        cart.push({ ...p, qty: 1 });
      }
      renderCart();
    }

    function removeCartItem(id) {
      cart = cart.filter(i => i.id !== id);
      renderCart();
    }

    function clearCart() {
      cart = [];
      renderCart();
    }

    function renderCart() {
      const cBox = document.getElementById('cart-items');
      const totalEl = document.getElementById('cart-total');
      const btnCharge = document.getElementById('btn-submit-charge');

      if (cart.length === 0) {
        cBox.innerHTML = '<div style="text-align:center; padding: 40px 0; color:#64748b; font-size:12px;">Tocá los productos para sumar a la orden</div>';
        totalEl.innerText = '0';
        btnCharge.disabled = true;
        return;
      }

      let total = 0;
      cBox.innerHTML = cart.map(i => {
        const sub = i.price * i.qty;
        total += sub;
        return \`
          <div class="cart-row">
            <div>
              <span class="cart-row-qty">\${i.qty}x</span>
              <span class="cart-row-title">\${i.name}</span>
            </div>
            <div style="display:flex; align-items:center;">
              <span style="font-family:'JetBrains Mono',monospace; font-weight:800;">$\${sub.toLocaleString('es-AR')}</span>
              <button class="btn-del" onclick="removeCartItem('\${i.id}')">&times;</button>
            </div>
          </div>
        \`;
      }).join('');

      totalEl.innerText = total.toLocaleString('es-AR');
      btnCharge.disabled = false;
    }

    // =========================================================================
    // CÁMARA ESCÁNER QR REAL & DETECCIÓN INSTANTÁNEA
    // =========================================================================
    async function openCameraScanner() {
      const modal = document.getElementById('scanner-modal');
      const video = document.getElementById('camera-video');
      const statusText = document.getElementById('scan-status-text');

      modal.classList.add('active');
      statusText.innerText = 'Iniciando cámara...';

      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        video.srcObject = videoStream;
        await video.play();
        statusText.innerText = 'Apuntá al código QR del cliente...';
        startQRProcessing();
      } catch (err) {
        console.warn('Cámara no disponible o denegada:', err.message);
        statusText.innerText = 'Cámara no detectada en este equipo. Podés usar la simulación o ingresar el ID manual.';
      }
    }

    function startQRProcessing() {
      const video = document.getElementById('camera-video');
      const canvas = document.getElementById('camera-canvas');
      const ctx = canvas.getContext('2d');

      scanInterval = setInterval(() => {
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
              onQRCodeDetected(code.data);
            }
          }
        }
      }, 150);
    }

    function onQRCodeDetected(qrString) {
      closeCameraScanner();
      try {
        const parsed = JSON.parse(qrString);
        if (parsed.id_corto) {
          document.getElementById('client-id').value = parsed.id_corto.replace('#', '');
        } else if (parsed.id) {
          document.getElementById('client-id').value = parsed.id;
        } else {
          document.getElementById('client-id').value = qrString;
        }
      } catch (e) {
        document.getElementById('client-id').value = qrString;
      }
      playBeep();
    }

    function simularEscaneoInmediato() {
      onQRCodeDetected(JSON.stringify({ id_corto: '#7821', nombre: 'Lucas Benítez' }));
    }

    function closeCameraScanner() {
      if (scanInterval) clearInterval(scanInterval);
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
      }
      document.getElementById('scanner-modal').classList.remove('active');
    }

    function playBeep() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.start();
        setTimeout(() => { osc.stop(); audioCtx.close(); }, 120);
      } catch(e){}
    }

    // =========================================================================
    // DÉBITO Y COBRO ATÓMICO
    // =========================================================================
    function procesarCobroDirecto() {
      const idRaw = document.getElementById('client-id').value.trim().replace('#', '');
      let total = 0;
      cart.forEach(i => total += (i.price * i.qty));

      if (total <= 0) return;

      const WALLET_KEY = 'nexora_club_wallet_v1';
      let wallet = { saldo: 15000, nombre: 'Lucas Benítez', historial: [] };
      const stored = localStorage.getItem(WALLET_KEY);
      if (stored) {
        try { wallet = JSON.parse(stored); } catch(e){}
      }

      if (wallet.saldo < total) {
        alert('❌ SALDO INSUFICIENTE. El cliente tiene $' + wallet.saldo.toLocaleString('es-AR') + ' y la compra es de $' + total.toLocaleString('es-AR'));
        return;
      }

      wallet.saldo -= total;
      wallet.historial.unshift({
        desc: (currentSector === 'boliche' ? 'Barra Boliche: ' : 'Carribar Exterior: ') + cart.map(c => c.qty + 'x ' + c.name).join(', '),
        time: 'Recién',
        monto: -total,
        positivo: false
      });
      localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));

      document.getElementById('pop-amount').innerText = '$' + total.toLocaleString('es-AR');
      document.getElementById('pop-client').innerText = 'Debitado de Wallet #' + idRaw + ' (' + wallet.nombre + ')';
      document.getElementById('pop-new-balance').innerText = 'Nuevo Saldo Disponible: $' + wallet.saldo.toLocaleString('es-AR');
      document.getElementById('success-pop').classList.add('active');

      playBeep();
      clearCart();
    }

    function closeSuccessPop() {
      document.getElementById('success-pop').classList.remove('active');
    }

    renderMenu();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(targetDir, 'pos', 'index.html'), posHtml, 'utf-8');
console.log('POS actualizado con Escáner de Cámara QR en vivo!');
