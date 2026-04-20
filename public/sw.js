/**
 * OpenClaw Service Worker
 * Handles push notifications and background synchronization
 */

const SW_VERSION = 'openclaw-sw-1.0.0';

// ============================================================================
// INSTALLATION & ACTIVATION
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing:', SW_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating:', SW_VERSION);
  event.waitUntil(self.clients.claim());
});

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'OpenClaw',
    body: 'New event from agent',
    badge: '/openclaw-badge.png',
    icon: '/openclaw-icon.png',
    tag: 'openclaw-notification',
  };

  try {
    if (event.data) {
      const json = event.data.json();
      data = { ...data, ...json };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      badge: data.badge,
      icon: data.icon,
      tag: data.tag,
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'close', title: 'Close' },
      ],
      data: data,
    })
  );
});

// ============================================================================
// NOTIFICATION CLICK HANDLING
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          client.focus();
          if (event.notification.data && event.notification.data.url) {
            client.postMessage({
              type: 'notification:click',
              data: event.notification.data,
            });
          }
          return client;
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        const targetUrl = event.notification.data?.url || '/';
        return clients.openWindow(targetUrl).then((client) => {
          if (client && event.notification.data) {
            client.postMessage({
              type: 'notification:click',
              data: event.notification.data,
            });
          }
          return client;
        });
      }
    })
  );
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Receive messages from the main app
 * Useful for triggering notifications, background sync, etc.
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  console.log('[SW] Message received:', type);

  switch (type) {
    case 'notification:send':
      handleSendNotification(payload);
      break;
    case 'cache:clear':
      handleCacheClear();
      break;
    case 'version':
      event.ports[0].postMessage({ version: SW_VERSION });
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Handle notification display from app
 */
async function handleSendNotification(payload) {
  const { title, body, badge, icon, tag, url, data } = payload;

  try {
    await self.registration.showNotification(title || 'OpenClaw', {
      body: body || '',
      badge: badge || '/openclaw-badge.png',
      icon: icon || '/openclaw-icon.png',
      tag: tag || 'openclaw',
      data: {
        ...data,
        url: url || '/',
      },
    });
  } catch (error) {
    console.error('[SW] Failed to send notification:', error);
  }
}

/**
 * Handle cache clearing
 */
async function handleCacheClear() {
  try {
    const cacheNames = await caches.keys();
    const deleted = [];

    for (const name of cacheNames) {
      if (name.startsWith('openclaw-')) {
        await caches.delete(name);
        deleted.push(name);
      }
    }

    console.log('[SW] Cleared caches:', deleted);
  } catch (error) {
    console.error('[SW] Failed to clear cache:', error);
  }
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

/**
 * Register background sync for periodic agent polling
 * (Requires periodic background sync permission)
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'openclaw:sync-agents') {
    event.waitUntil(syncAgents());
  }
});

/**
 * Sync agent status periodically
 */
async function syncAgents() {
  try {
    console.log('[SW] Syncing agents...');

    // Notify all clients to sync
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'sync:agents',
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('[SW] Failed to sync agents:', error);
    throw error;
  }
}

// ============================================================================
// FETCH CACHING (Optional: for offline support)
// ============================================================================

/**
 * Cache-first strategy for static assets
 * Comment out if not needed
 */
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip WebSocket and specific patterns
  if (
    event.request.url.includes('/ws') ||
    event.request.url.includes('api/gateway')
  ) {
    return;
  }

  // Cache static assets
  if (
    event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/i)
  ) {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }

          return fetch(event.request).then((response) => {
            // Don't cache non-2xx responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();
            const cacheName = `openclaw-static-${new Date().toISOString().split('T')[0]}`;

            caches.open(cacheName).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          });
        })
        .catch(() => {
          // Return offline page if available
          return caches.match('/offline.html');
        })
    );
  }
});

// ============================================================================
// UTILITY: CHECK SERVICE WORKER STATUS
// ============================================================================

/**
 * Usage from main app:
 * const isReady = await checkServiceWorkerReady();
 */
async function checkServiceWorkerReady() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return !!registration.active;
  } catch (error) {
    return false;
  }
}

console.log('[SW] OpenClaw Service Worker loaded');
