const fs = require('fs');

const rawHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexora Store & Hub — Centro de Aplicaciones, QR y Control</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070b14;
      --card-bg: rgba(15, 23, 42, 0.85);
      --card-border: rgba(51, 65, 85, 0.6);
      --accent: #06b6d4;
      --accent-hover: #22d3ee;
      --accent-glow: rgba(6, 182, 212, 0.25);
      --gold: #e4a834;
      --gold-glow: rgba(228, 168, 52, 0.25);
      --emerald: #10b981;
      --rose: #f43f5e;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; padding-bottom: 80px; -webkit-font-smoothing: antialiased; }
    
    /* HEADER */
    header {
      background: linear-gradient(180deg, #0f172a 0%, #070b14 100%);
      border-bottom: 1px solid var(--card-border);
      padding: 20px 24px;
      position: sticky;
      top: 0;
      z-index: 40;
      backdrop-filter: blur(16px);
    }
    .header-container {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .logo-area { display: flex; align-items: center; gap: 14px; text-decoration: none; color: inherit; }
    .logo-badge {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 0 20px var(--accent-glow);
    }
    .brand-title { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .brand-title span { color: var(--gold); }
    .brand-subtitle { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; }
    
    /* NAV TABS */
    .nav-tabs { display: flex; background: rgba(15, 23, 42, 0.9); padding: 4px; border-radius: 999px; border: 1px solid var(--card-border); }
    .tab-btn {
      padding: 9px 20px;
      border-radius: 999px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: linear-gradient(135deg, var(--gold), #f59e0b);
      color: #000;
      box-shadow: 0 4px 14px var(--gold-glow);
    }
    .tab-btn:hover:not(.active) { color: #fff; background: rgba(255,255,255,0.05); }

    /* CONTAINER */
    .main-container { max-width: 1280px; margin: 32px auto 0; padding: 0 20px; }

    /* HERO BANNER */
    .hero-banner {
      background: radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.15), transparent 40%),
                  radial-gradient(circle at 90% 80%, rgba(228, 168, 52, 0.15), transparent 40%),
                  linear-gradient(135deg, #0f172a 0%, #090e1a 100%);
      border: 1px solid rgba(6, 182, 212, 0.3);
      border-radius: 24px;
      padding: 36px 32px;
      margin-bottom: 32px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .hero-tag {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(6, 182, 212, 0.15);
      color: var(--accent);
      border: 1px solid rgba(6, 182, 212, 0.4);
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .hero-title { font-family: 'Outfit', sans-serif; font-size: 34px; font-weight: 900; line-height: 1.2; }
    .hero-desc { color: #cbd5e1; font-size: 15px; max-width: 820px; line-height: 1.6; }

    /* CONTROLS BAR */
    .controls-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .search-box {
      flex: 1;
      min-width: 260px;
      max-width: 420px;
      position: relative;
    }
    .search-box input {
      width: 100%;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--card-border);
      padding: 12px 16px 12px 42px;
      border-radius: 14px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
    }
    .search-box input:focus { border-color: var(--accent); box-shadow: 0 0 12px var(--accent-glow); }
    .search-box span { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; opacity: 0.6; }

    .category-pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .cat-pill {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cat-pill:hover, .cat-pill.active {
      background: rgba(6, 182, 212, 0.15);
      border-color: var(--accent);
      color: #fff;
    }

    /* GRID OF APPS */
    .apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 24px;
    }
    .app-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }
    .app-card:hover {
      transform: translateY(-4px);
      border-color: rgba(6, 182, 212, 0.6);
      box-shadow: 0 16px 32px rgba(0,0,0,0.4), 0 0 20px rgba(6, 182, 212, 0.15);
    }
    .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .app-icon-wrap {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15));
      border: 1px solid rgba(6,182,212,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    .app-badge {
      font-size: 10px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-free { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-saas { background: rgba(228, 168, 52, 0.15); color: #fbbf24; border: 1px solid rgba(228, 168, 52, 0.4); }
    .badge-nora { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }

    .app-title { font-family: 'Outfit', sans-serif; font-size: 19px; font-weight: 800; margin-bottom: 8px; color: #fff; line-height: 1.3; }
    .app-desc { color: var(--text-muted); font-size: 13px; line-height: 1.6; margin-bottom: 18px; flex-grow: 1; }

    .app-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .meta-price { font-weight: 800; color: #fff; }
    .meta-size { color: var(--text-muted); font-family: 'JetBrains Mono', monospace; font-size: 11px; }

    /* ACTION BUTTONS */
    .card-actions { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; }
    .btn-main {
      background: linear-gradient(135deg, var(--accent), #0284c7);
      color: #000;
      font-weight: 800;
      font-size: 13px;
      padding: 11px 16px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-main:hover { opacity: 0.95; transform: scale(1.02); filter: brightness(1.1); }
    .btn-main.saas { background: linear-gradient(135deg, var(--gold), #d97706); color: #000; }
    
    .btn-icon-action {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--card-border);
      color: #fff;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-icon-action:hover {
      background: rgba(6, 182, 212, 0.2);
      border-color: var(--accent);
      color: var(--accent);
      transform: scale(1.05);
    }
    .btn-icon-action.qr:hover {
      background: rgba(228, 168, 52, 0.2);
      border-color: var(--gold);
      color: var(--gold);
    }

    /* DASHBOARD TABLE & CARDS */
    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
    .stat-val { font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 900; color: #fff; }

    .dash-toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
    }
    .btn-create {
      background: linear-gradient(135deg, var(--emerald), #059669);
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      padding: 12px 22px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    }
    .btn-create:hover { filter: brightness(1.1); transform: scale(1.02); }

    .dash-table-wrap {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      overflow-x: auto;
      margin-bottom: 30px;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th {
      background: rgba(0,0,0,0.4);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(51,65,85,0.3);
      font-size: 13px;
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.02); }
    
    .table-app-cell { display: flex; align-items: center; gap: 12px; font-weight: 700; color: #fff; }
    .table-icon { font-size: 22px; }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(8px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }
    .modal-backdrop.active { opacity: 1; pointer-events: auto; }
    .modal-card {
      background: #0f172a;
      border: 1px solid rgba(6,182,212,0.4);
      border-radius: 24px;
      max-width: 520px;
      width: 100%;
      padding: 28px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 30px rgba(6,182,212,0.15);
      position: relative;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .modal-title { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 900; color: #fff; }
    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 24px;
      cursor: pointer;
      transition: color 0.2s;
    }
    .modal-close:hover { color: #fff; }

    /* QR MODAL SPECIFICS */
    .qr-preview-box {
      background: #ffffff;
      border-radius: 18px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 16px 0;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    }
    .qr-img {
      width: 220px;
      height: 220px;
      object-fit: contain;
      border-radius: 12px;
    }
    .qr-app-label {
      color: #090e1a;
      font-weight: 800;
      font-size: 14px;
      margin-top: 10px;
      text-align: center;
    }
    .qr-scan-hint {
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
      text-align: center;
    }

    .link-copy-box {
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .link-copy-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      outline: none;
    }
    .btn-copy-mini {
      background: rgba(6,182,212,0.2);
      border: 1px solid var(--accent);
      color: #fff;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-copy-mini:hover { background: var(--accent); color: #000; }

    .modal-actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .btn-action-whatsapp {
      background: #25D366;
      color: #000;
      font-weight: 800;
      font-size: 13px;
      padding: 12px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-action-whatsapp:hover { filter: brightness(1.1); transform: scale(1.02); }

    .btn-action-download-qr {
      background: rgba(255,255,255,0.1);
      border: 1px solid var(--card-border);
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      padding: 12px;
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-action-download-qr:hover { background: rgba(255,255,255,0.15); border-color: #fff; }

    /* FORM STYLES */
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; }
    .form-input, .form-select, .form-textarea {
      width: 100%;
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 10px 14px;
      color: #fff;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent); }
    .form-textarea { resize: vertical; min-height: 80px; }

    /* TOAST */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      border: 1px solid var(--accent);
      color: #fff;
      padding: 14px 20px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow);
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 200;
    }
    .toast.show { transform: translateY(0); opacity: 1; }

    @media(max-width: 768px) {
      .hero-title { font-size: 26px; }
      .card-actions { grid-template-columns: 1fr auto auto; }
      .modal-actions-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <header>
    <div class="header-container">
      <a href="#" class="logo-area" onclick="switchView('store')">
        <div class="logo-badge">📦</div>
        <div>
          <div class="brand-title">NEXORA <span>STORE</span></div>
          <div class="brand-subtitle">Shopping Digital & Hub SaaS</div>
        </div>
      </a>

      <div class="nav-tabs">
        <button id="tab-store-btn" class="tab-btn active" onclick="switchView('store')">
          <span>🛍️</span> Tienda de Software
        </button>
        <button id="tab-dash-btn" class="tab-btn" onclick="switchView('dashboard')">
          <span>📋</span> Dashboard de Control & QR
        </button>
      </div>
    </div>
  </header>

  <div class="main-container">

    <!-- ==================== VISTA TIENDA PÚBLICA ==================== -->
    <div id="view-store">
      <div class="hero-banner">
        <div class="hero-tag">✨ Catálogo Oficial de Aplicaciones & SaaS</div>
        <h1 class="hero-title">Descargas Directas, Apps Móviles y Códigos QR</h1>
        <p class="hero-desc">
          Accedé a nuestras soluciones de software comercial para gastronomía y a las aplicaciones ciudadanas gratuitas de Nexativa: Clasificados, Inmuebles, Empleos y Nora ITU.
        </p>
      </div>

      <div class="controls-bar">
        <div class="search-box">
          <span>🔍</span>
          <input type="text" id="store-search" placeholder="Buscar por nombre, categoría o función..." oninput="handleSearch(this.value)">
        </div>
        <div class="category-pills">
          <button class="cat-pill active" onclick="filterCategory('todas', this)">Todas</button>
          <button class="cat-pill" onclick="filterCategory('gratis', this)">🚗 Gratis / Ciudadanas</button>
          <button class="cat-pill" onclick="filterCategory('saas', this)">🍽️ SaaS / Bares</button>
          <button class="cat-pill" onclick="filterCategory('nora', this)">🎙️ Nora IA</button>
        </div>
      </div>

      <div class="apps-grid" id="store-grid">
        <!-- Generado dinámicamente -->
      </div>
    </div>

    <!-- ==================== VISTA DASHBOARD DE GESTIÓN ==================== -->
    <div id="view-dashboard" style="display: none;">
      
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-label">Total Sistemas Activos</div>
          <div class="stat-val" id="stat-total">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Apps Gratuitas</div>
          <div class="stat-val" style="color: #34d399;" id="stat-free">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Sistemas SaaS Comerciales</div>
          <div class="stat-val" style="color: #fbbf24;" id="stat-saas">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Módulos Nora IA</div>
          <div class="stat-val" style="color: #c084fc;" id="stat-nora">0</div>
        </div>
      </div>

      <div class="dash-toolbar">
        <div>
          <h2 style="font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 800; color: #fff;">Panel de Administración & Difusión</h2>
          <p style="font-size: 13px; color: var(--text-muted);">Gestioná publicaciones, copiá enlaces y descargá Códigos QR para enviar a clientes o amigos.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-create" onclick="openCreateModal()">
            <span>➕</span> Publicar Nuevo Software
          </button>
          <button class="btn-icon-action" style="width: auto; padding: 0 16px; font-size: 12px; font-weight: 700; gap: 6px;" onclick="exportCatalogBackup()" title="Descargar respaldo JSON">
            <span>💾</span> Exportar JSON
          </button>
        </div>
      </div>

      <div class="dash-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Software / App</th>
              <th>Categoría</th>
              <th>Precio / Modelo</th>
              <th>Estado</th>
              <th style="text-align: right;">Herramientas & QR</th>
            </tr>
          </thead>
          <tbody id="dash-table-body">
            <!-- Generado dinámicamente -->
          </tbody>
        </table>
      </div>

    </div>

  </div>

  <!-- ==================== MODAL DE CÓDIGO QR Y DIFUSIÓN ==================== -->
  <div class="modal-backdrop" id="qr-modal">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title" id="qr-modal-title">📲 Compartir & Código QR</div>
        <button class="modal-close" onclick="closeModal('qr-modal')">&times;</button>
      </div>

      <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">
        Escaneá el código QR con cualquier celular para ingresar directamente, o compartí el enlace por WhatsApp con tus clientes y amigos.
      </p>

      <div class="qr-preview-box">
        <img id="qr-image-tag" class="qr-img" src="" alt="Código QR">
        <div class="qr-app-label" id="qr-app-name">Nombre del Software</div>
        <div class="qr-scan-hint">Apunta la cámara de tu celular para abrir al instante</div>
      </div>

      <div class="form-group">
        <label class="form-label">Enlace Directo de Acceso:</label>
        <div class="link-copy-box">
          <input type="text" id="qr-link-input" class="link-copy-input" readonly>
          <button class="btn-copy-mini" onclick="copyQrLink()">📋 Copiar</button>
        </div>
      </div>

      <div class="modal-actions-grid">
        <a id="qr-whatsapp-btn" href="#" target="_blank" class="btn-action-whatsapp">
          <span>💬</span> Enviar por WhatsApp
        </a>
        <button class="btn-action-download-qr" onclick="downloadQrImage()">
          <span>💾</span> Descargar QR (PNG)
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== MODAL CREAR / EDITAR SOFTWARE ==================== -->
  <div class="modal-backdrop" id="edit-modal">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title" id="edit-modal-title">➕ Publicar Nuevo Software</div>
        <button class="modal-close" onclick="closeModal('edit-modal')">&times;</button>
      </div>

      <form id="software-form" onsubmit="handleSaveSoftware(event)">
        <input type="hidden" id="form-id">

        <div class="form-group">
          <label class="form-label">Nombre del Software o App *</label>
          <input type="text" id="form-title" class="form-input" required placeholder="Ej: Nexora Delivery & Pedidos">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Categoría *</label>
            <select id="form-category" class="form-select" required>
              <option value="gratis">🚗 Gratis / Ciudadanas</option>
              <option value="saas">🍽️ SaaS / Bares</option>
              <option value="nora">🎙️ Nora IA</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Etiqueta Visual</label>
            <input type="text" id="form-tag" class="form-input" placeholder="Ej: NUEVO • GRATIS">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 80px 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Icono</label>
            <input type="text" id="form-icon" class="form-input" style="text-align:center; font-size: 18px;" value="📦">
          </div>
          <div class="form-group">
            <label class="form-label">Precio / Plan</label>
            <input type="text" id="form-price" class="form-input" placeholder="Ej: $0 / Gratis">
          </div>
          <div class="form-group">
            <label class="form-label">Versión</label>
            <input type="text" id="form-version" class="form-input" placeholder="Ej: v1.0">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">URL de Acceso o Descarga *</label>
          <input type="text" id="form-url" class="form-input" required placeholder="https://... o downloads/...">
        </div>

        <div class="form-group">
          <label class="form-label">Descripción Resumida *</label>
          <textarea id="form-desc" class="form-textarea" required placeholder="Detallá los beneficios y funciones clave..."></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn-icon-action" style="width:auto; padding: 0 16px; font-size: 13px;" onclick="closeModal('edit-modal')">Cancelar</button>
          <button type="submit" class="btn-main" style="padding: 10px 24px;">Guardar y Publicar</button>
        </div>
      </form>
    </div>
  </div>

  <!-- FLOATING TOAST -->
  <div class="toast" id="toast-msg">
    <span>✅</span>
    <span id="toast-text">Operación realizada con éxito</span>
  </div>

  <script>
    const STORAGE_KEY = 'nexora_store_catalog_v3';
    let currentView = 'store';
    let activeCategory = 'todas';
    let searchQuery = '';
    let currentQrItem = null;

    const initialCatalog = [
      {
        id: 'clasificados-app',
        title: 'Nexora Clasificados Móvil',
        category: 'gratis',
        tag: 'NUEVO • GRATIS',
        icon: '🚗',
        price: '$0 / Gratis',
        version: 'v1.0',
        size: 'Web PWA',
        description: 'App para comprar y vender autos, motos, herramientas y artículos de segunda mano con hasta 10 fotos WebP y contacto directo por WhatsApp.',
        download_url: 'https://www.nexativanews.com.ar/clasificados',
        active: true
      },
      {
        id: 'inmuebles-app',
        title: 'Inmuebles Verificados',
        category: 'gratis',
        tag: 'GRATIS',
        icon: '🏠',
        price: '$0 / Gratis',
        version: 'v2.4',
        size: 'Web PWA',
        description: 'Portal de alquileres temporarios, anuales y venta de propiedades verificadas en Ituzaingó y la región.',
        download_url: 'https://www.nexativanews.com.ar/guia/inmuebles',
        active: true
      },
      {
        id: 'empleos-app',
        title: 'Empleos & Oficios Regionales',
        category: 'gratis',
        tag: 'GRATIS',
        icon: '💼',
        price: '$0 / Gratis',
        version: 'v2.1',
        size: 'Web PWA',
        description: 'Bolsa de trabajo, oficios, postulaciones y búsqueda de personal calificado en la región sin comisiones.',
        download_url: 'https://www.nexativanews.com.ar/empleos',
        active: true
      },
      {
        id: 'nora-asistente-itu',
        title: 'Nora ITU — Asistente de Voz y Accesibilidad DUA',
        category: 'nora',
        tag: 'DUA ACCESIBLE • $0',
        icon: '🎙️',
        price: '$0 / Gratuito',
        version: 'v5.0 Soberano',
        size: 'Web Audio API',
        description: 'Inteligencia artificial soberana, educativa y accesible con lectura de voz continua y soporte nativo TalkBack/VoiceOver.',
        download_url: 'https://www.nexativanews.com.ar/noraitu',
        active: true
      },
      {
        id: 'nexora-bares-saas',
        title: 'Nexora Bares & Gastronomía (Suite Comercial)',
        category: 'saas',
        tag: 'COMERCIAL • LICENCIA',
        icon: '🍽️',
        price: 'Consultar Plan',
        version: 'v3.2 PRO',
        size: '2.2 MB (ZIP)',
        description: 'Sistema completo para bares, restaurantes y cafeterías: Comandera digital, mesas, mozos, cocina y delivery.',
        download_url: 'downloads/saas-comerciales/nexora-bares/MyJNexoraVisual_SuiteComercial.zip',
        active: true
      },
      {
        id: 'guia-comercial-pro',
        title: 'Guía Comercial & Comercios Nexora',
        category: 'saas',
        tag: 'DIRECTORIO PRO',
        icon: '🏬',
        price: 'Suscripción',
        version: 'v2.0',
        size: 'Acceso Web & App',
        description: 'Directorio interactivo de comercios, gastronomía, farmacias de turno y prestadores de servicios con panel de autogestión.',
        download_url: 'https://www.nexativanews.com.ar/guia',
        active: true
      }
    ];

    function loadCatalog() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialCatalog));
      return initialCatalog;
    }

    function saveCatalog(items) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      renderCatalog();
    }

    function switchView(view) {
      currentView = view;
      document.getElementById('view-store').style.display = view === 'store' ? 'block' : 'none';
      document.getElementById('view-dashboard').style.display = view === 'dashboard' ? 'block' : 'none';
      
      document.getElementById('tab-store-btn').className = 'tab-btn' + (view === 'store' ? ' active' : '');
      document.getElementById('tab-dash-btn').className = 'tab-btn' + (view === 'dashboard' ? ' active' : '');
      renderCatalog();
    }

    function filterCategory(cat, btn) {
      activeCategory = cat;
      document.querySelectorAll('.cat-pill').forEach(el => el.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderStore();
    }

    function handleSearch(val) {
      searchQuery = val.toLowerCase().trim();
      renderStore();
    }

    function renderCatalog() {
      if (currentView === 'store') {
        renderStore();
      } else {
        renderDashboard();
      }
    }

    function renderStore() {
      const grid = document.getElementById('store-grid');
      const items = loadCatalog();
      
      const filtered = items.filter(item => {
        if (!item.active) return false;
        const matchCat = activeCategory === 'todas' || item.category === activeCategory;
        const matchSearch = !searchQuery || 
          item.title.toLowerCase().includes(searchQuery) || 
          item.description.toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);"><div style="font-size: 40px; margin-bottom: 10px;">🔍</div><div style="font-size: 16px; font-weight: 700; color: #fff;">No se encontraron sistemas</div><div style="font-size: 13px; margin-top: 4px;">Probá buscando con otras palabras o cambiá de categoría.</div></div>';
        return;
      }

      grid.innerHTML = filtered.map(item => {
        const badgeClass = item.category === 'gratis' ? 'badge-free' : item.category === 'saas' ? 'badge-saas' : 'badge-nora';
        const isDirectWeb = item.download_url.startsWith('http');
        const actionLabel = isDirectWeb ? 'Abrir / Ingresar 🚀' : 'Descargar App 💾';

        return '<div class="app-card">' +
          '<div>' +
            '<div class="card-top">' +
              '<div class="app-icon-wrap">' + (item.icon || '📦') + '</div>' +
              '<span class="app-badge ' + badgeClass + '">' + (item.tag || item.category.toUpperCase()) + '</span>' +
            '</div>' +
            '<h3 class="app-title">' + item.title + '</h3>' +
            '<p class="app-desc">' + item.description + '</p>' +
          '</div>' +
          '<div>' +
            '<div class="app-meta-row">' +
              '<div>' +
                '<span style="color: var(--text-muted); font-size: 11px;">Modelo: </span>' +
                '<span class="meta-price">' + (item.price || 'Gratis') + '</span>' +
              '</div>' +
              '<div class="meta-size">' + (item.version || 'v1.0') + '</div>' +
            '</div>' +
            '<div class="card-actions">' +
              '<a href="' + item.download_url + '" target="' + (isDirectWeb ? '_blank' : '_self') + '" class="btn-main ' + (item.category === 'saas' ? 'saas' : '') + '">' +
                actionLabel +
              '</a>' +
              '<button class="btn-icon-action qr" onclick="openQrModal(\'' + item.id + '\')" title="Ver Código QR y Compartir">' +
                '📲' +
              '</button>' +
              '<button class="btn-icon-action" onclick="quickCopyLink(\'' + item.download_url + '\')" title="Copiar Enlace Directo">' +
                '📋' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function renderDashboard() {
      const items = loadCatalog();
      const tbody = document.getElementById('dash-table-body');

      // Update counters
      document.getElementById('stat-total').innerText = items.filter(i => i.active).length;
      document.getElementById('stat-free').innerText = items.filter(i => i.category === 'gratis' && i.active).length;
      document.getElementById('stat-saas').innerText = items.filter(i => i.category === 'saas' && i.active).length;
      document.getElementById('stat-nora').innerText = items.filter(i => i.category === 'nora' && i.active).length;

      tbody.innerHTML = items.map(item => {
        return '<tr style="opacity: ' + (item.active ? '1' : '0.4') + ';">' +
          '<td>' +
            '<div class="table-app-cell">' +
              '<span class="table-icon">' + (item.icon || '📦') + '</span>' +
              '<div>' +
                '<div>' + item.title + '</div>' +
                '<div style="font-size: 11px; color: var(--text-muted); font-weight: 400;">' + (item.version || 'v1.0') + ' • ' + item.download_url + '</div>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span class="app-badge ' + (item.category === 'gratis' ? 'badge-free' : item.category === 'saas' ? 'badge-saas' : 'badge-nora') + '">' +
              item.category.toUpperCase() +
            '</span>' +
          '</td>' +
          '<td style="font-weight: 700; color: #fff;">' + item.price + '</td>' +
          '<td>' +
            '<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: ' + (item.active ? '#34d399' : '#f87171') + '">' +
              '<span style="width: 8px; height: 8px; border-radius: 50%; background: ' + (item.active ? '#34d399' : '#f87171') + '"></span>' +
              (item.active ? 'Activo' : 'Pausado') +
            '</span>' +
          '</td>' +
          '<td style="text-align: right;">' +
            '<div style="display: inline-flex; gap: 6px;">' +
              '<button class="btn-icon-action qr" style="width:34px; height:34px; font-size: 14px;" onclick="openQrModal(\'' + item.id + '\')" title="Código QR & Compartir">' +
                '📲' +
              '</button>' +
              '<button class="btn-icon-action" style="width:34px; height:34px; font-size: 14px;" onclick="quickCopyLink(\'' + item.download_url + '\')" title="Copiar Enlace">' +
                '📋' +
              '</button>' +
              '<button class="btn-icon-action" style="width:34px; height:34px; font-size: 14px;" onclick="openEditModal(\'' + item.id + '\')" title="Editar">' +
                '✏️' +
              '</button>' +
              '<button class="btn-icon-action" style="width:34px; height:34px; font-size: 14px;" onclick="toggleAppStatus(\'' + item.id + '\')" title="' + (item.active ? 'Pausar' : 'Activar') + '">' +
                (item.active ? '⏸️' : '▶️') +
              '</button>' +
              '<button class="btn-icon-action" style="width:34px; height:34px; font-size: 14px; color: var(--rose);" onclick="deleteApp(\'' + item.id + '\')" title="Eliminar">' +
                '🗑️' +
              '</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    /* QR MODAL FUNCTIONS */
    function openQrModal(id) {
      const items = loadCatalog();
      const item = items.find(i => i.id === id);
      if (!item) return;

      currentQrItem = item;
      document.getElementById('qr-modal-title').innerText = '📲 Compartir: ' + item.title;
      document.getElementById('qr-app-name').innerText = (item.icon || '📦') + ' ' + item.title;
      
      let fullUrl = item.download_url;
      if (!fullUrl.startsWith('http')) {
        fullUrl = window.location.origin + '/' + fullUrl;
      }
      
      document.getElementById('qr-link-input').value = fullUrl;

      // Generar imagen QR en alta resolución usando QR Server API confiable
      const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=15&data=' + encodeURIComponent(fullUrl);
      document.getElementById('qr-image-tag').src = qrApiUrl;

      // Botón de WhatsApp con mensaje personalizado
      const waMsg = encodeURIComponent('¡Hola! Te comparto el acceso directo a ' + item.title + ' de Nexora:\n\n' + fullUrl + '\n\n¡Podés ingresar o descargarlo desde ahí!');
      document.getElementById('qr-whatsapp-btn').href = 'https://api.whatsapp.com/send?text=' + waMsg;

      document.getElementById('qr-modal').classList.add('active');
    }

    function copyQrLink() {
      const input = document.getElementById('qr-link-input');
      input.select();
      navigator.clipboard.writeText(input.value);
      showToast('¡Enlace copiado al portapapeles! 📋');
    }

    function quickCopyLink(url) {
      let fullUrl = url;
      if (!fullUrl.startsWith('http')) {
        fullUrl = window.location.origin + '/' + fullUrl;
      }
      navigator.clipboard.writeText(fullUrl);
      showToast('¡Enlace copiado al portapapeles! 📋');
    }

    function downloadQrImage() {
      if (!currentQrItem) return;
      const img = document.getElementById('qr-image-tag');
      
      // Descargar imagen
      fetch(img.src)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = 'QR_' + currentQrItem.title.replace(/[^a-zA-Z0-9]/g, '_') + '.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          showToast('¡Código QR descargado en PNG! 💾');
        })
        .catch(() => {
          window.open(img.src, '_blank');
        });
    }

    /* CRUD MODALS */
    function openCreateModal() {
      document.getElementById('edit-modal-title').innerText = '➕ Publicar Nuevo Software';
      document.getElementById('form-id').value = '';
      document.getElementById('form-title').value = '';
      document.getElementById('form-category').value = 'gratis';
      document.getElementById('form-tag').value = 'NUEVO';
      document.getElementById('form-icon').value = '📦';
      document.getElementById('form-price').value = '$0 / Gratis';
      document.getElementById('form-version').value = 'v1.0';
      document.getElementById('form-url').value = '';
      document.getElementById('form-desc').value = '';
      document.getElementById('edit-modal').classList.add('active');
    }

    function openEditModal(id) {
      const items = loadCatalog();
      const item = items.find(i => i.id === id);
      if (!item) return;

      document.getElementById('edit-modal-title').innerText = '✏️ Editar Software';
      document.getElementById('form-id').value = item.id;
      document.getElementById('form-title').value = item.title;
      document.getElementById('form-category').value = item.category;
      document.getElementById('form-tag').value = item.tag || '';
      document.getElementById('form-icon').value = item.icon || '📦';
      document.getElementById('form-price').value = item.price;
      document.getElementById('form-version').value = item.version || '';
      document.getElementById('form-url').value = item.download_url;
      document.getElementById('form-desc').value = item.description;
      document.getElementById('edit-modal').classList.add('active');
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
    }

    function handleSaveSoftware(e) {
      e.preventDefault();
      const id = document.getElementById('form-id').value;
      const title = document.getElementById('form-title').value.trim();
      const category = document.getElementById('form-category').value;
      const tag = document.getElementById('form-tag').value.trim();
      const icon = document.getElementById('form-icon').value.trim() || '📦';
      const price = document.getElementById('form-price').value.trim();
      const version = document.getElementById('form-version').value.trim();
      const download_url = document.getElementById('form-url').value.trim();
      const description = document.getElementById('form-desc').value.trim();

      let items = loadCatalog();

      if (id) {
        // Edit existing
        items = items.map(item => {
          if (item.id === id) {
            return { ...item, title, category, tag, icon, price, version, download_url, description };
          }
          return item;
        });
        showToast('¡Software actualizado correctamente! ✨');
      } else {
        // Create new
        const newId = 'app-' + Date.now();
        items.unshift({
          id: newId,
          title,
          category,
          tag,
          icon,
          price,
          version,
          download_url,
          description,
          active: true
        });
        showToast('¡Nuevo software publicado con éxito! 🚀');
      }

      saveCatalog(items);
      closeModal('edit-modal');
    }

    function toggleAppStatus(id) {
      let items = loadCatalog();
      items = items.map(item => {
        if (item.id === id) {
          const nextActive = !item.active;
          showToast(nextActive ? 'Software activado' : 'Software pausado');
          return { ...item, active: nextActive };
        }
        return item;
      });
      saveCatalog(items);
    }

    function deleteApp(id) {
      if (!confirm('¿Estás seguro de eliminar este software del catálogo?')) return;
      let items = loadCatalog();
      items = items.filter(i => i.id !== id);
      saveCatalog(items);
      showToast('Software eliminado del catálogo 🗑️');
    }

    function exportCatalogBackup() {
      const items = loadCatalog();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', 'nexora_catalog_backup.json');
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Copia de respaldo exportada 💾');
    }

    function showToast(text) {
      const toast = document.getElementById('toast-msg');
      document.getElementById('toast-text').innerText = text;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Inicialización
    renderCatalog();
  </script>
</body>
</html>`;

fs.writeFileSync('D:/NEXORA STORE/index.html', rawHtml, 'utf-8');
console.log('D:/NEXORA STORE/index.html successfully updated with QR & Share!');
