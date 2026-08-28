const fs = require('fs');
const path = require('path');

const targetDir = 'D:/SUITE BOLICHES-NEXORAPAY';
let posContent = fs.readFileSync(path.join(targetDir, 'pos', 'index.html'), 'utf-8');

// Agregar Modal de PIN de Seguridad para cambiar entre Barra (1111) y Carribar (2222)
const pinModalHtml = `
  <!-- MODAL DE PIN DE SEGURIDAD POR SECTOR -->
  <div class="scanner-modal" id="pin-modal" style="z-index: 300;">
    <div class="scanner-card" style="max-width:340px;">
      <div style="font-size:36px; margin-bottom:8px;" id="pin-icon">🔐</div>
      <h2 style="font-family:'Outfit',sans-serif; font-size:18px; font-weight:900; color:#fff;" id="pin-modal-title">
        Ingresar a Barra Boliche
      </h2>
      <p style="font-size:11px; color:#94a3b8; margin-top:4px;">
        Ingresá el PIN del sector asignado a tu puesto.
      </p>

      <input type="password" id="input-sector-pin" maxlength="6" style="width:100%; background:#070b14; border:2px solid var(--gold); border-radius:14px; padding:12px; font-family:'JetBrains Mono',monospace; font-size:24px; font-weight:900; color:#fff; text-align:center; outline:none; letter-spacing:8px; margin:16px 0;" placeholder="••••" autofocus>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <button class="btn-charge" style="padding:12px; font-size:13px;" onclick="validarSectorPin()">
          ENTRAR ➔
        </button>
        <button class="btn-scanner-close" onclick="cerrarPinModal()">
          Cancelar
        </button>
      </div>

      <div style="font-size:10px; color:#64748b; margin-top:12px;">
        PIN Barra: 1111 | PIN Carribar: 2222
      </div>
    </div>
  </div>
`;

// Insertar modal antes de </body>
posContent = posContent.replace('</body>', pinModalHtml + '</body>');

// Reemplazar switchSector con validación de PIN
const newSwitchSectorJs = `
    let pendingSector = 'boliche';
    let pendingBtn = null;

    function switchSector(sec, btn) {
      if (sec === currentSector) return;
      pendingSector = sec;
      pendingBtn = btn;
      
      const pinModal = document.getElementById('pin-modal');
      const pinTitle = document.getElementById('pin-modal-title');
      const pinIcon = document.getElementById('pin-icon');
      const inputPin = document.getElementById('input-sector-pin');
      
      inputPin.value = '';
      if (sec === 'boliche') {
        pinTitle.innerText = 'Acceso a Barra Boliche';
        pinIcon.innerText = '🍸';
      } else {
        pinTitle.innerText = 'Acceso a Carribar Exterior';
        pinIcon.innerText = '🍔';
      }
      
      pinModal.classList.add('active');
      setTimeout(() => inputPin.focus(), 100);
    }

    function validarSectorPin() {
      const pin = document.getElementById('input-sector-pin').value.trim();
      const validPins = {
        boliche: ['1111', 'barra2026', '2026'],
        carribar: ['2222', 'carribar2026', '2026']
      };

      if (validPins[pendingSector].includes(pin)) {
        currentSector = pendingSector;
        document.querySelectorAll('.btn-sector').forEach(b => b.classList.remove('active'));
        if (pendingBtn) pendingBtn.classList.add('active');
        document.getElementById('pin-modal').classList.remove('active');
        renderMenu();
        playBeep();
      } else {
        alert('❌ PIN Incorrecto para ' + (pendingSector === 'boliche' ? 'Barra (PIN: 1111)' : 'Carribar (PIN: 2222)'));
        document.getElementById('input-sector-pin').value = '';
      }
    }

    function cerrarPinModal() {
      document.getElementById('pin-modal').classList.remove('active');
    }
`;

posContent = posContent.replace(/function switchSector[\s\S]*?renderMenu\(\);\s*\}/, newSwitchSectorJs);

fs.writeFileSync(path.join(targetDir, 'pos', 'index.html'), posContent, 'utf-8');
console.log('POS protegido con PINs de seguridad por sector!');
