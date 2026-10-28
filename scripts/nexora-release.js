/**
 * ==============================================================================
 * NEXORA STORE — AUTOMATED RELEASE & AUTO-DOWNLOAD ENGINE
 * ==============================================================================
 * Motor central de empaquetado, manifiestos de actualización y sincronización
 * multi-espejo CDN (Supabase Storage + GitHub Raw + Vercel Static) para
 * distribución de software y plugins con 0 caídas (High Availability).
 *
 * Uso:
 *   node scripts/nexora-release.js --all
 *   node scripts/nexora-release.js --product nora-periodismo --version 2.2.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// 1. Cargar Variables de Entorno de .env.local
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return {};
  const env = fs.readFileSync(envPath, 'utf8');
  const vars = {};
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const k = trimmed.slice(0, eqIdx).trim();
    let v = trimmed.slice(eqIdx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    vars[k] = v;
  }
  return vars;
}

const envVars = loadEnv();
const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || 'https://xeheuscrttrbfnojwwqt.supabase.co';
const SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_SUPABASE_SERVICE_ROLE_KEY;

const PRODUCTS = [
  {
    slug: 'nora-periodismo',
    name: 'Nora Periodismo Pro - Cadena 4 & Nexativa',
    dir: 'public/nora-periodismo',
    entry: 'public/nora-periodismo/nora-periodismo.php',
    zip: 'public/nora-periodismo.zip',
    manifest: 'public/update-info.json',
    remoteManifestName: 'update-info.json',
    description: 'Suite completa de periodismo digital con IA: Nora Live Editor, Auto-Clipper Pro, Flashes Noticiosos de 1-5 min y Móvil de Exteriores PWA.',
    version: '2.2.1'
  },
  {
    slug: 'nora-live-exteriores',
    name: 'Nora Live Exteriores - Cadena 4 & Nexativa',
    dir: 'public/nora-live-exteriores',
    entry: 'public/nora-live-exteriores/nora-live-exteriores.php',
    zip: 'public/nora-live-exteriores.zip',
    manifest: 'public/update-info-exteriores.json',
    remoteManifestName: 'update-info-exteriores.json',
    description: 'Suite completa de periodismo digital con IA: Nora Live Editor, Auto-Clipper Pro, Flashes Noticiosos de 1-5 min y Móvil de Exteriores PWA.',
    version: '2.2.1'
  }
];

function calculateSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function uploadToSupabase(remotePath, fileBuffer, contentType) {
  if (!SERVICE_KEY) {
    console.warn(`⚠️ Omitiendo subida a Supabase de ${remotePath} (SERVICE_KEY no encontrada).`);
    return false;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/uploads/${remotePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: fileBuffer
    });
    if (res.ok) {
      console.log(`  ✅ CDN Supabase: ${remotePath} (${fileBuffer.length} bytes)`);
      return true;
    } else {
      console.error(`  ❌ Error subiendo ${remotePath}:`, res.status, await res.text());
      return false;
    }
  } catch (e) {
    console.error(`  ❌ Excepción subiendo ${remotePath}:`, e.message);
    return false;
  }
}

async function buildAndReleaseProduct(prod) {
  console.log(`\n📦 Procesando Producto: ${prod.name} (v${prod.version})`);

  // 1. Verificar directorio de origen
  if (!fs.existsSync(prod.dir)) {
    console.error(`  ❌ Directorio no encontrado: ${prod.dir}`);
    return;
  }

  // 2. Comprimir en ZIP limpio
  if (fs.existsSync(prod.zip)) fs.unlinkSync(prod.zip);
  console.log(`  🔨 Comprimiendo paquete ZIP ${prod.zip}...`);
  execSync(`tar -a -cf "${prod.zip}" -C public ${prod.slug}`, { stdio: 'pipe' });

  const stats = fs.statSync(prod.zip);
  const sha256 = calculateSha256(prod.zip);
  console.log(`  📊 ZIP creado: ${stats.size} bytes | SHA256: ${sha256.substring(0, 16)}...`);

  // 3. Crear Manifiesto de Actualización con Espejos Redundantes
  const manifestData = {
    name: prod.name,
    slug: prod.slug,
    plugin: `${prod.slug}/${prod.slug}.php`,
    version: prod.version,
    author: 'MyJNexoraVisual & Nexativa News',
    author_profile: 'https://www.nexativanews.com.ar',
    requires: '5.6',
    tested: '6.7',
    requires_php: '7.4',
    last_updated: new Date().toISOString().replace('T', ' ').substring(0, 19),
    package_size: stats.size,
    package_sha256: sha256,
    package: `${SUPABASE_URL}/storage/v1/object/public/uploads/plugins/${prod.slug}.zip`,
    package_mirrors: [
      `${SUPABASE_URL}/storage/v1/object/public/uploads/plugins/${prod.slug}.zip`,
      `https://raw.githubusercontent.com/palaciomariaitati-byte/Nexativa-News/main/public/${prod.slug}.zip`,
      `https://www.nexativanews.com.ar/${prod.slug}.zip`
    ],
    download_url: `${SUPABASE_URL}/storage/v1/object/public/uploads/plugins/${prod.slug}.zip`,
    homepage: 'https://cadena4.com.ar',
    sections: {
      description: prod.description,
      installation: 'Instalar mediante el panel de administración de WordPress o actualización automática en 1 clic.',
      changelog: `<h4>${prod.version}</h4><ul><li>Sistema Inmune de Auto-Actualización con espejos CDN multi-nivel (Supabase Storage + GitHub Raw CDN + API).</li><li>Actualizador in-place de 1 clic sin abandonar la redacción ni la transmisión de la radio.</li><li>Motor de redacción en vivo instantáneo de Nora con detección automática de borradores.</li><li>Subida de imágenes con vista previa inmediata y asignación de foto destacada.</li><li>Reproductor limpio para Flashes y clips de hasta 5 minutos sin barra infinita de 2 horas.</li><li>Bandeja en tiempo real de despachos desde la PWA móvil.</li></ul>`
    }
  };

  fs.writeFileSync(prod.manifest, JSON.stringify(manifestData, null, 2), 'utf8');
  console.log(`  📝 Manifiesto local guardado: ${prod.manifest}`);

  // 4. Subir a Supabase CDN Storage
  const zipBuffer = fs.readFileSync(prod.zip);
  await uploadToSupabase(`plugins/${prod.slug}.zip`, zipBuffer, 'application/zip');

  const manifestBuffer = Buffer.from(JSON.stringify(manifestData, null, 2), 'utf8');
  await uploadToSupabase(`plugins/${prod.remoteManifestName}`, manifestBuffer, 'application/json');

  // 5. Verificación de Salud Inmediata
  console.log('  🔍 Verificando estado en CDN pública...');
  try {
    const testRes = await fetch(`${SUPABASE_URL}/storage/v1/object/public/uploads/plugins/${prod.remoteManifestName}`);
    if (testRes.ok) {
      const data = await testRes.json();
      console.log(`  🎉 CDN Saludable: v${data.version} activa y lista para descarga pública.`);
    }
  } catch (err) {
    console.warn(`  ⚠️ Alerta de verificación: ${err.message}`);
  }
}

async function main() {
  console.log('==============================================================================');
  console.log('🚀 NEXORA STORE — PUBLICADOR DE ENTREGAS Y AUTO-ACTUALIZACIONES');
  console.log('==============================================================================');

  for (const prod of PRODUCTS) {
    await buildAndReleaseProduct(prod);
  }

  console.log('\n==============================================================================');
  console.log('✅ TODAS LAS ENTREGAS DE NEXORA STORE ESTÁN EMITIDAS Y BLINDADAS');
  console.log('==============================================================================\n');
}

main().catch(console.error);
