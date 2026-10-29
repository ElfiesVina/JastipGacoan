/**
 * sw.js - Service Worker Ringan untuk Titip Gacoan PWA
 * Mendukung instalasi Layar Utama (Add to Home Screen) di Android & iOS,
 * serta caching offline untuk aset statis aplikasi (app shell).
 */

const CACHE_NAME = 'titip-gacoan-v1';
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'manifest.webmanifest',
  'favicon.ico',
  'icons/favicon.png',
  'icons/app-icon.png',
  'img/apple-touch-icon.png',
  'img/favicon-16.png',
  'img/favicon-32.png',
  'img/icon-192.png',
  'img/icon-512.png',
  'img/icon-maskable-512.png',
  'img/me-gacoan.png',
  'img/sakan.png',
  'css/base/variables.css',
  'css/base/reset.css',
  'css/base/typography.css',
  'css/layout/header.css',
  'css/layout/main.css',
  'css/components/card.css',
  'css/components/form.css',
  'css/components/button.css',
  'css/components/choice.css',
  'css/components/upload.css',
  'css/components/list.css',
  'css/components/toast.css',
  'css/components/skeleton.css',
  'css/components/changelog.css',
  'css/components/dialog.css',
  'css/components/auth.css',
  'css/utilities.css',
  'css/responsive.css',
  'js/main.js',
  'js/config.js',
  'js/core/constants.js',
  'js/core/dom.js',
  'js/core/events.js',
  'js/core/format.js',
  'js/core/router.js',
  'js/core/state.js',
  'js/core/storage.js',
  'js/core/ui.js',
  'js/data/changelog-data.js',
  'js/services/calc.js',
  'js/services/changelog.js',
  'js/services/image.js',
  'js/services/recap-image.js',
  'js/components/header.js',
  'js/components/order-list.js',
  'js/components/recap-card.js',
  'js/components/customer-forms.js',
  'js/components/admin-forms.js',
  'js/components/auth-forms.js',
  'js/views/customer.js',
  'js/views/admin-auth.js',
  'js/views/admin-dashboard.js',
  'js/views/admin-session.js',
  'js/api/client.js',
  'js/api/auth.api.js',
  'js/api/sesi.api.js',
  'js/api/pesanan.api.js',
  'js/api/bukti.api.js',
  'js/api/profile.api.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Jangan cache panggilan API Supabase atau POST/PUT/DELETE
  if (req.method !== 'GET' || url.hostname.includes('supabase.co')) {
    return;
  }

  // Network-first dengan fallback cache untuk navigasi HTML
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Cache-first untuk aset statis lokal
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch di background untuk update cache (stale-while-revalidate)
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {/* ignore background update error */});
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
        return networkResponse;
      });
    })
  );
});
