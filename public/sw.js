// NiamOS Service Worker v2.0
const SHELL_CACHE  = 'niamos-shell-v2';
const API_CACHE    = 'niamos-api-v2';
const KNOWN_CACHES = [SHELL_CACHE, API_CACHE];

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Install: pre-cache app shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => !KNOWN_CACHES.includes(n)).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // API: NetworkFirst → fallback to cache (enables offline read)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetchWithTimeout(event.request.clone(), 5000)
        .then(r => {
          if (r.ok) caches.open(API_CACHE).then(c => c.put(event.request, r.clone()));
          return r;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (/assets/*, icons): CacheFirst
  if (url.pathname.startsWith('/assets/') || url.pathname.match(/\.(png|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(r => {
          if (r.ok) caches.open(SHELL_CACHE).then(c => c.put(event.request, r.clone()));
          return r;
        });
      })
    );
    return;
  }

  // App shell (navigation): NetworkFirst → fallback to cached '/'
  event.respondWith(
    fetch(event.request)
      .then(r => {
        if (r.ok) caches.open(SHELL_CACHE).then(c => c.put(event.request, r.clone()));
        return r;
      })
      .catch(() => caches.match(event.request) || caches.match('/'))
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchWithTimeout(req, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(req, { signal: ctrl.signal });
    clearTimeout(t);
    return r;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}
