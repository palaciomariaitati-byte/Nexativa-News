/**
 * ========================================================================
 * 🌾 NORAITU SERVICE WORKER - CACHÉ OFFLINE & MODO CAMPO (PWA SOBERANA)
 * Ubicación: /public/noraitu-sw.js
 * ========================================================================
 */

const CACHE_NAME = 'noraitu-offline-v20';

const OFFLINE_STATIC_ASSETS = [
  '/noraitu',
  '/icons/main-icon.png',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_STATIC_ASSETS).catch((err) => {
        console.warn('[Nora SW Cache AddAll Warn]:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // No interceptar rutas de API de streaming de chat en el Service Worker
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Devolver caché y actualizar en segundo plano (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback a la raíz de Nora si está offline
        if (event.request.mode === 'navigate') {
          return caches.match('/noraitu');
        }
      });
    })
  );
});
