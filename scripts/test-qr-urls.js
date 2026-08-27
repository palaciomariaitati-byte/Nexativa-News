const fs = require('fs');
const https = require('https');

const rawCatalog = [
  "https://www.nexativanews.com.ar/clasificados",
  "https://www.nexativanews.com.ar/guia/inmuebles",
  "https://www.nexativanews.com.ar/empleos",
  "https://www.nexativanews.com.ar/noraitu",
  "https://www.nexativanews.com.ar/guia"
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (e) => resolve({ url, status: 0, error: e.message }));
  });
}

async function testAll() {
  console.log("Validando enlaces objetivo de los Códigos QR...");
  for (const u of rawCatalog) {
    const r = await checkUrl(u);
    console.log(`QR Target: ${r.url} -> Status: [${r.status}] ${r.status === 200 ? '✅ VÁLIDO' : '❌ ERROR'}`);
  }
}

testAll();
