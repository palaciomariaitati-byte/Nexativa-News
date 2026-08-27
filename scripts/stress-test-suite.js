/**
 * ========================================================================
 * 🧪 STRESS TEST & DIAGNOSTIC BENCHMARK SUITE - NEXATIVA & NEXORA ECOSYSTEM
 * ========================================================================
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const RESULTS = {
  timestamp: new Date().toISOString(),
  endpoints: [],
  apis: [],
  localHub: [],
  bottlenecksFound: [],
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
};

function fetchUrl(url, options = {}) {
  return new Promise((resolve) => {
    const tStart = Date.now();
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || { 'User-Agent': 'NexoraStressBot/2026.1' },
      timeout: options.timeout || 12000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - tStart;
        resolve({
          url,
          status: res.statusCode,
          latencyMs: latency,
          contentLength: data.length,
          data,
          headers: res.headers,
          error: null
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        latencyMs: Date.now() - tStart,
        contentLength: 0,
        data: '',
        headers: {},
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 408,
        latencyMs: Date.now() - tStart,
        contentLength: 0,
        data: '',
        headers: {},
        error: 'REQUEST_TIMEOUT'
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runBenchmark() {
  console.log('================================================================');
  console.log('🚀 INICIANDO TEST DE ESTRÉS Y RENDIMIENTO EN TIEMPO REAL');
  console.log('================================================================\n');

  // 1. Test de Rutas Principales del Portal Nexativa News
  const routesToTest = [
    { name: 'Portada Principal', url: 'https://www.nexativanews.com.ar/' },
    { name: 'Clasificados Regionales', url: 'https://www.nexativanews.com.ar/clasificados' },
    { name: 'Formulario Publicar Clasificado', url: 'https://www.nexativanews.com.ar/clasificados/publicar' },
    { name: 'Nora ITU Asistente Accesible', url: 'https://www.nexativanews.com.ar/noraitu' },
    { name: 'Guía Comercial', url: 'https://www.nexativanews.com.ar/guia' },
    { name: 'Inmuebles Verificados', url: 'https://www.nexativanews.com.ar/guia/inmuebles' },
    { name: 'Empleos & Oficios', url: 'https://www.nexativanews.com.ar/empleos' },
    { name: 'Shop / Tienda', url: 'https://www.nexativanews.com.ar/store' }
  ];

  console.log('📡 1. EVALUANDO ENDPOINTS PÚBLICOS (PRODUCCIÓN):');
  for (const r of routesToTest) {
    const res = await fetchUrl(r.url);
    RESULTS.summary.total++;
    const isOk = res.status >= 200 && res.status < 400;
    if (isOk) {
      RESULTS.summary.passed++;
      console.log(`  ✅ [${res.status}] ${r.name.padEnd(32)} -> Latencia: ${res.latencyMs}ms (${Math.round(res.contentLength / 1024)} KB)`);
    } else {
      RESULTS.summary.failed++;
      RESULTS.bottlenecksFound.push({ target: r.name, issue: `HTTP ${res.status}: ${res.error || 'Error de respuesta'}` });
      console.log(`  ❌ [${res.status}] ${r.name.padEnd(32)} -> Error: ${res.error || 'Fallo HTTP'}`);
    }
    RESULTS.endpoints.push({ name: r.name, url: r.url, status: res.status, latencyMs: res.latencyMs });
  }

  // 2. Test de Estrés de Inferencia y Proxy Realtime de Nora ITU
  console.log('\n🎙️ 2. TEST DE ESTRÉS DE APIs DE INFERENCIA NORA ITU:');
  const apiTests = [
    {
      name: 'Nora Realtime Proxy (Voz Normal)',
      url: 'https://www.nexativanews.com.ar/api/noraitu-realtime-proxy',
      method: 'POST',
      body: JSON.stringify({
        message: '¿Cuáles son las capas de la atmósfera?',
        history: [],
        mode: 'docente'
      })
    },
    {
      name: 'Nora Realtime Proxy (Recuperación Ruido/Tos)',
      url: 'https://www.nexativanews.com.ar/api/noraitu-realtime-proxy',
      method: 'POST',
      body: JSON.stringify({
        message: 'tos',
        history: [],
        mode: 'voice',
        lastInterruptedResponse: { text: 'Estábamos explicando la fotosíntesis en plantas autótrofas...' }
      })
    },
    {
      name: 'Nora Asistente de Clasificados',
      url: 'https://www.nexativanews.com.ar/api/clasificados/nora-assist',
      method: 'POST',
      body: JSON.stringify({
        titulo: 'Vendo moto Honda Wave 110cc modelo 2022',
        categoria: 'vehiculos',
        precio: '1.200.000',
        moneda: 'ARS',
        ubicacion: 'Ituzaingó, Corrientes'
      })
    }
  ];

  for (const api of apiTests) {
    const res = await fetchUrl(api.url, {
      method: api.method,
      headers: { 'Content-Type': 'application/json' },
      body: api.body,
      timeout: 15000
    });

    RESULTS.summary.total++;
    let jsonOk = false;
    let payload = null;
    try {
      payload = JSON.parse(res.data);
      jsonOk = true;
    } catch {}

    if (res.status === 200 && jsonOk) {
      RESULTS.summary.passed++;
      console.log(`  ✅ [${res.status}] ${api.name.padEnd(36)} -> Latencia: ${res.latencyMs}ms | Respuesta: "${(payload.text || payload.descripcion || '').slice(0, 50)}..."`);
    } else {
      RESULTS.summary.warnings++;
      console.log(`  ⚠️ [${res.status}] ${api.name.padEnd(36)} -> Latencia: ${res.latencyMs}ms | Error: ${res.error || 'Respuesta no JSON'}`);
    }
    RESULTS.apis.push({ name: api.name, status: res.status, latencyMs: res.latencyMs, success: jsonOk });
  }

  // 3. Verificación de Integridad de Archivos Locales en D:\NEXORA STORE
  console.log('\n💻 3. VERIFICACIÓN DE INTEGRIDAD EN D:\\NEXORA STORE:');
  const localFiles = [
    { name: 'Store & Dashboard HTML', path: 'D:/NEXORA STORE/index.html' },
    { name: 'Master Control SaaS Original', path: 'D:/NEXORA STORE/Nexora_SaaS_Master_Control.html' },
    { name: 'Catálogo JSON de Respaldo', path: 'D:/NEXORA STORE/catalog/store_catalog.json' },
    { name: 'Directorio de Descargas', path: 'D:/NEXORA STORE/downloads' }
  ];

  for (const lf of localFiles) {
    RESULTS.summary.total++;
    const exists = fs.existsSync(lf.path);
    if (exists) {
      RESULTS.summary.passed++;
      const stat = fs.statSync(lf.path);
      const isDir = stat.isDirectory();
      console.log(`  ✅ [OK] ${lf.name.padEnd(30)} -> ${isDir ? '[Directorio]' : `${Math.round(stat.size / 1024)} KB`}`);
    } else {
      RESULTS.summary.failed++;
      RESULTS.bottlenecksFound.push({ target: lf.name, issue: `Archivo no encontrado en ${lf.path}` });
      console.log(`  ❌ [MISSING] ${lf.name.padEnd(30)} -> No existe`);
    }
  }

  // 4. Verificación de Inmuebles, Empleos y Clasificados
  console.log('\n🚗 4. VERIFICACIÓN DE CARGA Y PERFORMANCE PWA:');
  const pwaRoutes = [
    { name: 'Clasificados PWA', path: 'https://www.nexativanews.com.ar/clasificados' },
    { name: 'Inmuebles PWA', path: 'https://www.nexativanews.com.ar/guia/inmuebles' },
    { name: 'Empleos PWA', path: 'https://www.nexativanews.com.ar/empleos' }
  ];

  for (const pwa of pwaRoutes) {
    const res = await fetchUrl(pwa.path);
    const hasViewport = res.data.includes('name="viewport"');
    const hasThemeColor = res.data.includes('name="theme-color"');
    const hasManifest = res.data.includes('manifest.webmanifest') || res.data.includes('manifest');

    console.log(`  📱 ${pwa.name.padEnd(20)} -> Viewport: ${hasViewport ? '✅' : '❌'} | Theme: ${hasThemeColor ? '✅' : '❌'} | PWA: ${hasManifest ? '✅' : '⚠️'}`);
  }

  console.log('\n================================================================');
  console.log(`📊 RESUMEN GENERAL: Total: ${RESULTS.summary.total} | ✅ Aprobados: ${RESULTS.summary.passed} | ⚠️ Alertas: ${RESULTS.summary.warnings} | ❌ Fallos: ${RESULTS.summary.failed}`);
  console.log('================================================================\n');

  return RESULTS;
}

runBenchmark().then(res => {
  fs.writeFileSync('scripts/stress-test-results.json', JSON.stringify(res, null, 2));
});
