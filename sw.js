/**
 * sw.js - Service Worker Ringan untuk Titip Gacoan PWA
 * Mendukung instalasi Layar Utama (Add to Home Screen) di Android & iOS,
 * serta caching offline untuk aset statis aplikasi (app shell).
 */

/* Naikkan angka versi ini setiap kali ada berkas web yang berubah; cache lama dihapus otomatis saat aktif. */
const CACHE_NAME = 'titip-gacoan-v3';
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'favicon.ico',
  'css/base/reset.css',
  'css/base/typography.css',
  'css/base/variables.css',
  'css/components/auth.css',
  'css/components/bottomnav.css',
  'css/components/button.css',
  'css/components/card.css',
  'css/components/changelog.css',
  'css/components/choice.css',
  'css/components/dash.css',
  'css/components/dialog.css',
  'css/components/form.css',
  'css/components/list.css',
  'css/components/profile.css',
  'css/components/ptr.css',
  'css/components/skeleton.css',
  'css/components/toast.css',
  'css/components/upload.css',
  'css/layout/header.css',
  'css/layout/main.css',
  'css/responsive.css',
  'css/utilities.css',
  'icons/app-icon.png',
  'icons/favicon.png',
  'img/apple-touch-icon.png',
  'img/favicon-16.png',
  'img/favicon-32.png',
  'img/icon-192.png',
  'img/icon-512.png',
  'img/icon-maskable-512.png',
  'img/me-gacoan.png',
  'img/sakan.png',
  'js/api/auth.api.js',
  'js/api/bukti.api.js',
  'js/api/client.js',
  'js/api/persetujuan.api.js',
  'js/api/pesanan.api.js',
  'js/api/profile.api.js',
  'js/api/sesi.api.js',
  'js/components/admin-forms.js',
  'js/components/auth-forms.js',
  'js/components/bottom-nav.js',
  'js/components/cojastip-panel.js',
  'js/components/customer-forms.js',
  'js/components/dashboard.js',
  'js/components/gacoan-loader.js',
  'js/components/header.js',
  'js/components/order-list.js',
  'js/components/otp-boxes.js',
  'js/components/profile-card.js',
  'js/components/profile-form.js',
  'js/components/profile-icons.js',
  'js/components/recap-card.js',
  'js/config.js',
  'js/core/constants.js',
  'js/core/dom.js',
  'js/core/events.js',
  'js/core/format.js',
  'js/core/i18n.js',
  'js/core/recent.js',
  'js/core/router.js',
  'js/core/state.js',
  'js/core/storage.js',
  'js/core/theme.js',
  'js/core/ui.js',
  'js/data/changelog-data.js',
  'js/data/i18n-data.js',
  'js/data/profile-options.js',
  'js/main.js',
  'js/services/calc.js',
  'js/services/changelog.js',
  'js/services/dashboard-stats.js',
  'js/services/image.js',
  'js/services/otp-clock.js',
  'js/services/presence.js',
  'js/services/profile-rules.js',
  'js/services/pull-refresh.js',
  'js/services/recap-image.js',
  'js/views/admin-auth.js',
  'js/views/admin-dashboard.js',
  'js/views/admin-profile.js',
  'js/views/admin-session.js',
  'js/views/admin-sessions.js',
  'js/views/admin-tabs.js',
  'js/views/customer.js'
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
