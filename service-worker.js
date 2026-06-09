/* ============================================================
   Iceland Ring Road — Service Worker
   Network-first per tutto (sempre aggiornato quando online),
   la cache serve solo come fallback offline.
   ============================================================ */

const VERSION = 'iceland-v6';
const STATIC_CACHE = 'iceland-static-' + VERSION;
const DATA_CACHE = 'iceland-data-' + VERSION;

const PRECACHE_URLS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'icon.svg'
];

const DATA_URL = 'itinerary.json';

// ----- Install: precache the shell ----------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ----- Activate: cleanup old caches ---------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ----- Fetch handler ------------------------------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests on same origin
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for itinerary.json (so updates show fast when online,
  // and fall back to cache when offline)
  if (url.pathname.endsWith('/' + DATA_URL) || url.pathname.endsWith(DATA_URL)) {
    event.respondWith(networkFirst(req, DATA_CACHE));
    return;
  }

  // Network-first for everything else too (always fresh when online)
  event.respondWith(networkFirst(req, STATIC_CACHE));
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    // Final fallback: return index.html for navigation requests
    if (req.mode === 'navigate') {
      const fallback = await cache.match('index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}
