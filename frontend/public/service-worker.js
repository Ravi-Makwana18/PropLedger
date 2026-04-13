/* ==========================================================
   PropLedger Service Worker - v4.0.0
   - Offline-first with network fallback
   - Background Sync for queued actions
   - Push Notification support
   - Cache versioning with automatic cleanup
   ========================================================== */

const CACHE_VERSION = 'v4';
const STATIC_CACHE  = `propledger-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `propledger-dynamic-${CACHE_VERSION}`;

/* Core shell assets — always pre-cached on install */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/pwa/icon-96.png',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/icon-maskable-512.png',
  '/pwa/apple-touch-icon.png',
  '/pwa/screenshot-wide.png',
  '/pwa/screenshot-mobile.png',
  '/favicon.svg',
];

/* ── Install ─────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: prune old caches ──────────────────────────── */
self.addEventListener('activate', (event) => {
  const KEEP = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: Network-first for API, Cache-first for assets ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET and cross-origin requests */
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin && !url.hostname.includes('fonts.g')) return;

  /* API calls — network only, never cache */
  if (url.pathname.startsWith('/api/')) return;

  /* Navigation requests — network-first, fallback to offline page */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() =>
          caches.match('/index.html').then((r) => r || caches.match('/offline.html'))
        )
    );
    return;
  }

  /* Static assets — cache-first, update in background */
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached); /* fall back to cache if network fails */

      return cached || networkFetch;
    })
  );
});

/* ── Background Sync ─────────────────────────────────────── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'propledger-sync') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  /* Placeholder: in future, replay queued offline actions */
  console.log('[PropLedger SW] Background sync triggered');
}

/* ── Push Notifications ───────────────────────────────────── */
self.addEventListener('push', (event) => {
  let data = { title: 'PropLedger', body: 'You have a new notification.' };
  try {
    data = event.data ? event.data.json() : data;
  } catch (_) { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa/icon-192.png',
      badge: '/pwa/icon-96.png',
      tag: 'propledger-notification',
      renotify: true,
      data: { url: data.url || '/dashboard' },
    })
  );
});

/* ── Notification Click ───────────────────────────────────── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(target);
    })
  );
});
