const fs = require('fs');
const path = require('path');

const targetDir = 'D:/SUITE BOLICHES-NEXORAPAY';

// =========================================================================
// 2. POS BARRA & CARRIBAR (pos/index.html)
// =========================================================================
const posHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminal POS — Barra Boliche & Carribar Fast-Sales</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070b14;
      --panel: #0d1527;
      --border: rgba(30, 58, 102, 0.6);
      --gold: #e4a834;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --rose: #f43f5e;
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
    .btn-scan { background: rgba(228,168,52,0.2); border: 1px solid var(--gold); color: var(--gold); padding: 0 14px; border-radius: 10px; font-weight: 800; font-size: 12px; cursor: pointer; }

    .total-box { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; border-top: 1px solid var(--border); padding-top: 14px; }
    .total-label { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .total-val { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 900; color: #fff; }
    .total-val span { color: var(--gold); }

    .btn-charge { width: 100%; padding: 18px; border-radius: 18px; border: none; background: linear-gradient(135deg, var(--gold), #f59e0b); color: #000; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 25px rgba(228,168,52,0.4); }
    .btn-charge:hover { filter: brightness(1.1); transform: scale(1.02); }
    .btn-charge:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

    /* TOAST SUCCESS MODAL */
    .success-pop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
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
          <div style="font-size:11px; font-weight:800; color:var(--gold); text-transform:uppercase;">ID de Cliente / Wallet Nexora Pay</div>
          <div class="client-input-row">
            <input type="text" id="client-id" class="input-id" placeholder="#7821" value="7821">
            <button class="btn-scan" onclick="simularEscaneoQR()">📷 QR</button>
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

    function simularEscaneoQR() {
      document.getElementById('client-id').value = '7821';
      alert('📷 Código QR escaneado con éxito: Wallet #7821 (Lucas Benítez)');
    }

    function procesarCobroDirecto() {
      const idRaw = document.getElementById('client-id').value.trim().replace('#', '');
      let total = 0;
      cart.forEach(i => total += (i.price * i.qty));

      if (total <= 0) return;

      // Obtener wallet de localStorage para sincronizar
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

      // Mostrar popup exitoso
      document.getElementById('pop-amount').innerText = '$' + total.toLocaleString('es-AR');
      document.getElementById('pop-client').innerText = 'Debitado de Wallet #' + idRaw + ' (' + wallet.nombre + ')';
      document.getElementById('pop-new-balance').innerText = 'Nuevo Saldo Disponible: $' + wallet.saldo.toLocaleString('es-AR');
      document.getElementById('success-pop').classList.add('active');

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
console.log('POS Barra & Carribar creado en pos/index.html');

// =========================================================================
// 3. MASTER DASHBOARD & PREMIOS DJ EN VIVO (dashboard/index.html)
// =========================================================================
const dashHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Master Control & DJ Gamification — Nexora Club</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #050913;
      --card: #0d1527;
      --border: rgba(30, 58, 102, 0.6);
      --gold: #e4a834;
      --purple: #a855f7;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --rose: #f43f5e;
    }
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter', sans-serif; }
    body { background: var(--bg); color: #fff; min-height: 100vh; padding: 24px 20px; }
    
    .top-bar { max-width: 1200px; margin: 0 auto 24px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 900; }
    .brand span { color: var(--gold); }

    .main-wrap { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

    /* STATS ROW */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 20px; }
    .stat-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .stat-val { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 900; color: #fff; margin-top: 4px; }

    /* DJ GAMIFICATION BOX */
    .dj-box {
      background: radial-gradient(circle at 10% 20%, rgba(168,85,247,0.25), transparent 45%),
                  radial-gradient(circle at 90% 80%, rgba(228,168,52,0.2), transparent 45%),
                  linear-gradient(135deg, #121026 0%, #090e1a 100%);
      border: 1px solid var(--purple);
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(168,85,247,0.25);
    }
    .dj-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .dj-title { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 900; color: #fff; display: flex; align-items: center; gap: 10px; }
    
    .dj-controls { display: grid; grid-template-columns: 1fr 1fr auto; gap: 14px; align-items: flex-end; }
    .dj-input { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--border); border-radius: 14px; padding: 12px 16px; color: #fff; font-size: 13px; outline: none; }
    .dj-input:focus { border-color: var(--purple); }

    .btn-giveaway {
      background: linear-gradient(135deg, var(--purple), #ec4899);
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 14px 28px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(168,85,247,0.4);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-giveaway:hover { transform: scale(1.03); filter: brightness(1.1); }

    /* TABLA DE AUDITORIA */
    .table-card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: rgba(0,0,0,0.4); color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 16px 20px; border-bottom: 1px solid var(--border); }
    td { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
    tr:last-child td { border-bottom: none; }
  </style>
</head>
<body>

  <div class="top-bar">
    <div class="brand">NEXORA <span>MASTER DJ & CONTROL</span></div>
    <div style="display:flex; gap:10px;">
      <a href="../pos/index.html" style="text-decoration:none; padding:8px 16px; border-radius:12px; background:rgba(255,255,255,0.05); color:#fff; font-size:12px; font-weight:700; border:1px solid var(--border);">🍸 Abrir POS</a>
      <a href="../stock_nora/index.html" style="text-decoration:none; padding:8px 16px; border-radius:12px; background:rgba(16,185,129,0.15); color:var(--emerald); font-size:12px; font-weight:700; border:1px solid var(--emerald);">🎙️ Nora Stock</a>
    </div>
  </div>

  <div class="main-wrap">
    
    <!-- STATS -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Recaudación Total Noche</div>
        <div class="stat-val" style="color:var(--emerald);">$1.450.000</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ventas Barra Boliche</div>
        <div class="stat-val">$980.000</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ventas Carribar Exterior</div>
        <div class="stat-val" style="color:var(--gold);">$470.000</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Wallets Activas Presentes</div>
        <div class="stat-val" style="color:var(--cyan);">340 Clientes</div>
      </div>
    </div>

    <!-- DJ LIVE GAMIFICATION & PREMIOS EN PANTALLA -->
    <div class="dj-box">
      <div class="dj-head">
        <div class="dj-title">
          <span>🎧</span>
          <span>Control DJ & Premios en Pantalla Gigante</span>
        </div>
        <span style="font-size:11px; font-weight:800; padding:4px 12px; border-radius:999px; background:rgba(168,85,247,0.3); color:#e9d5ff;">
          SINCRONIZADO EN TIEMPO REAL
        </span>
      </div>

      <p style="font-size:13px; color:#cbd5e1; margin-bottom:18px;">
        Acreditá saldo de regalo directamente al celular del cliente ganador de sorteos, rondas de baile o metas de consumo.
      </p>

      <div class="dj-controls">
        <div>
          <label style="display:block; font-size:11px; font-weight:800; color:#cbd5e1; margin-bottom:6px;">ID del Cliente Ganador</label>
          <input type="text" id="dj-client-id" class="dj-input" placeholder="#7821" value="#7821">
        </div>
        <div>
          <label style="display:block; font-size:11px; font-weight:800; color:#cbd5e1; margin-bottom:6px;">Monto del Premio ($ ARS)</label>
          <input type="number" id="dj-premio-monto" class="dj-input" value="5000">
        </div>
        <button class="btn-giveaway" onclick="otorgarPremioDJ()">
          🎉 ACREDITAR PREMIO AHORA
        </button>
      </div>
    </div>

    <!-- AUDITORIA DE CLIENTES -->
    <div class="table-card">
      <div style="padding:18px 20px; font-family:'Outfit',sans-serif; font-size:16px; font-weight:900; border-bottom:1px solid var(--border);">
        Wallets Activas en el Boliche & Carribar
      </div>
      <table>
        <thead>
          <tr>
            <th>ID Wallet</th>
            <th>Cliente</th>
            <th>Saldo Actual</th>
            <th>Último Consumo</th>
            <th>Sector</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color:var(--gold);">#7821</strong></td>
            <td>Lucas Benítez</td>
            <td><span style="font-family:'JetBrains Mono',monospace; font-weight:800; color:var(--emerald);">$15.000</span></td>
            <td>Carribar: 1x Hamburguesa Completa</td>
            <td>Carribar Exterior</td>
          </tr>
          <tr>
            <td><strong style="color:var(--gold);">#8914</strong></td>
            <td>Martina Gómez</td>
            <td><span style="font-family:'JetBrains Mono',monospace; font-weight:800; color:var(--emerald);">$8.500</span></td>
            <td>Barra: 2x Gin Tonic</td>
            <td>Barra VIP</td>
          </tr>
          <tr>
            <td><strong style="color:var(--gold);">#6021</strong></td>
            <td>Rodrigo Silva</td>
            <td><span style="font-family:'JetBrains Mono',monospace; font-weight:800; color:var(--emerald);">$3.200</span></td>
            <td>Barra: 1x Cerveza Tirada</td>
            <td>Barra Central</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>

  <script>
    function otorgarPremioDJ() {
      const idRaw = document.getElementById('dj-client-id').value.trim();
      const monto = Number(document.getElementById('dj-premio-monto').value);

      if (monto <= 0) return;

      const WALLET_KEY = 'nexora_club_wallet_v1';
      let wallet = { saldo: 15000, nombre: 'Lucas Benítez', historial: [] };
      const stored = localStorage.getItem(WALLET_KEY);
      if (stored) {
        try { wallet = JSON.parse(stored); } catch(e){}
      }

      wallet.saldo += monto;
      wallet.historial.unshift({
        desc: '🎉 ¡Premio DJ por Meta de Baile en Vivo!',
        time: 'Recién',
        monto: monto,
        positivo: true
      });
      localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));

      alert('🎉 ¡Premio de $' + monto.toLocaleString('es-AR') + ' acreditado con éxito en la Wallet ' + idRaw + ' (' + wallet.nombre + ')!');
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(targetDir, 'dashboard', 'index.html'), dashHtml, 'utf-8');
console.log('Master Dashboard creado en dashboard/index.html');

// =========================================================================
// 4. STOCK & INVENTARIO POR VOZ CON NORA IA (stock_nora/index.html)
// =========================================================================
const stockHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nora IA Stock — Carga de Mercadería por Voz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #060a12;
      --card: #0d1527;
      --border: rgba(30, 58, 102, 0.6);
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.35);
      --gold: #e4a834;
      --rose: #f43f5e;
    }
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Inter', sans-serif; }
    body { background: var(--bg); color: #fff; min-height: 100vh; padding: 24px 20px; display: flex; flex-direction: column; align-items: center; }
    
    .container { max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: 20px; }

    .header { display: flex; justify-content: space-between; align-items: center; }
    .brand { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 900; }
    .brand span { color: var(--emerald); }

    /* NORA VOICE HERO BOX */
    .nora-box {
      background: radial-gradient(circle at 80% 20%, rgba(16,185,129,0.2), transparent 45%),
                  linear-gradient(135deg, #0f1e28 0%, #09121a 100%);
      border: 1px solid var(--emerald);
      border-radius: 28px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 30px var(--emerald-glow);
    }
    .nora-avatar { width: 70px; height: 70px; border-radius: 22px; background: rgba(16,185,129,0.2); border: 2px solid var(--emerald); display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 16px; }
    .nora-title { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 900; }
    .nora-desc { font-size: 13px; color: #94a3b8; max-width: 580px; margin: 6px auto 20px; line-height: 1.6; }

    .btn-mic {
      background: linear-gradient(135deg, var(--emerald), #059669);
      color: #000;
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 900;
      padding: 16px 36px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 25px rgba(16,185,129,0.4);
      transition: all 0.2s;
    }
    .btn-mic:hover { transform: scale(1.04); filter: brightness(1.1); }
    .btn-mic.recording { background: var(--rose); color: #fff; animation: pulseRed 1s infinite; }
    @keyframes pulseRed { 0% { box-shadow: 0 0 0 0 rgba(244,63,94,0.7); } 70% { box-shadow: 0 0 0 15px rgba(244,63,94,0); } 100% { box-shadow: 0 0 0 0 rgba(244,63,94,0); } }

    .transcript-box { background: rgba(0,0,0,0.5); border: 1px solid var(--border); border-radius: 16px; padding: 14px 18px; margin-top: 20px; font-size: 13px; color: #38bdf8; min-height: 48px; display: flex; align-items: center; justify-content: center; }

    /* STOCK GRID */
    .stock-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
    .stock-card { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; }
    .stock-item-name { font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 800; margin-bottom: 4px; }
    .stock-sec { font-size: 11px; color: #94a3b8; font-weight: 600; }
    .stock-count { font-family: 'JetBrains Mono', monospace; font-size: 26px; font-weight: 900; color: #fff; margin: 10px 0; }
    .stock-count.low { color: var(--rose); }

    .stock-btn-row { display: flex; gap: 6px; }
    .btn-qty { flex: 1; padding: 6px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: #fff; font-weight: 800; font-size: 12px; cursor: pointer; }
    .btn-qty:hover { background: rgba(255,255,255,0.15); }
  </style>
</head>
<body>

  <div class="container">
    
    <div class="header">
      <div class="brand">NORA <span>VOICE INVENTORY</span></div>
      <a href="../dashboard/index.html" style="text-decoration:none; padding:8px 16px; border-radius:12px; background:rgba(255,255,255,0.05); color:#fff; font-size:12px; font-weight:700; border:1px solid var(--border);">➔ Volver al Dashboard</a>
    </div>

    <!-- NORA HERO -->
    <div class="nora-box">
      <div class="nora-avatar">🎙️</div>
      <h1 class="nora-title">Carga de Mercadería por Voz</h1>
      <p class="nora-desc">
        Tocá el micrófono y dictale a Nora: <em>"Nora, entraron 15 botellas de Fernet, 50 panes de hamburguesa y 80 latas de cerveza"</em>. El stock se actualiza solo.
      </p>

      <button id="btn-voice" class="btn-mic" onclick="toggleVoiceInput()">
        <span>🎤</span> <span id="btn-mic-text">Hablar con Nora</span>
      </button>

      <div class="transcript-box" id="transcript-box">
        Presioná el botón y hablá para cargar inventario...
      </div>
    </div>

    <!-- INVENTARIO EN VIVO -->
    <div style="font-family:'Outfit',sans-serif; font-size:18px; font-weight:900; margin-top:10px;">
      📦 Inventario en Tiempo Real (Boliche & Carribar)
    </div>

    <div class="stock-grid" id="stock-grid">
      <!-- Generado dinámicamente -->
    </div>

  </div>

  <script>
    let inventory = [
      { id: 'fernet', name: 'Fernet Branca (Botellas 750cc)', qty: 45, sector: 'Barra Boliche' },
      { id: 'gin', name: 'Gin Gordon / Bombay', qty: 30, sector: 'Barra Boliche' },
      { id: 'cerveza', name: 'Cerveza Lata (Cajones/Unid)', qty: 350, sector: 'Barra & Carribar' },
      { id: 'burger_pan', name: 'Pan de Hamburguesa (Unid)', qty: 120, sector: 'Carribar Exterior' },
      { id: 'medallones', name: 'Medallones de Carne 120g', qty: 100, sector: 'Carribar Exterior' },
      { id: 'papas_kg', name: 'Papas Bastón (Bolsas kg)', qty: 80, sector: 'Carribar Exterior' }
    ];

    function renderStock() {
      const grid = document.getElementById('stock-grid');
      grid.innerHTML = inventory.map(item => \`
        <div class="stock-card">
          <div>
            <div class="stock-item-name">\${item.name}</div>
            <div class="stock-sec">\${item.sector}</div>
          </div>
          <div class="stock-count \${item.qty < 20 ? 'low' : ''}">\${item.qty}</div>
          <div class="stock-btn-row">
            <button class="btn-qty" onclick="changeQty('\${item.id}', -10)">-10</button>
            <button class="btn-qty" onclick="changeQty('\${item.id}', 10)">+10</button>
            <button class="btn-qty" onclick="changeQty('\${item.id}', 50)">+50</button>
          </div>
        </div>
      \`).join('');
    }

    function changeQty(id, delta) {
      const item = inventory.find(i => i.id === id);
      if (item) {
        item.qty = Math.max(0, item.qty + delta);
        renderStock();
      }
    }

    let isRecording = false;
    function toggleVoiceInput() {
      const btn = document.getElementById('btn-voice');
      const textEl = document.getElementById('btn-mic-text');
      const trans = document.getElementById('transcript-box');

      if (!isRecording) {
        isRecording = true;
        btn.classList.add('recording');
        textEl.innerText = 'Escuchando a Nora... (Hablale)';
        trans.innerText = '🎙️ "Nora, cargá 20 botellas de fernet y 50 panes de hamburguesa..."';

        // Simular procesamiento de lenguaje natural en 3 segundos
        setTimeout(() => {
          trans.innerText = '✅ Nora procesó: "+20 Fernet Branca" y "+50 Pan de Hamburguesa"';
          changeQty('fernet', 20);
          changeQty('burger_pan', 50);
          btn.classList.remove('recording');
          textEl.innerText = 'Hablar con Nora';
          isRecording = false;
          alert('🎙️ Nora IA actualizó el stock con éxito: +20 Fernet Branca y +50 Panes de Hamburguesa.');
        }, 3000);
      }
    }

    renderStock();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(targetDir, 'stock_nora', 'index.html'), stockHtml, 'utf-8');
console.log('Stock Nora Voice creado en stock_nora/index.html');
