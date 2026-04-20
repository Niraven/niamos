// NiamOS Service Worker v1.0
const CACHE_NAME = 'niamos-v1';
const STATIC_CACHE = 'niamos-static-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== STATIC_CACHE).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API: NetworkFirst with 5s timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetchWithTimeout(event.request, 5000)
        .then(r => { if (r.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, r.clone())); return r; })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static: StaleWhileRevalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchP = fetch(event.request).then(r => {
        if (r.ok) caches.open(STATIC_CACHE).then(c => c.put(event.request, r.clone()));
        return r;
      }).catch(() => {});
      return cached || fetchP;
    })
  );
});

async function fetchWithTimeout(req, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { const r = await fetch(req, { signal: ctrl.signal }); clearTimeout(t); return r; }
  catch (e) { clearTimeout(t); throw e; }
}

// PWA install prompt
let deferredPrompt;
self.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ type: 'PWA_INSTALL_AVAILABLE' })));
});
self.addEventListener('appinstalled', () => { deferredPrompt = null; });
