const CACHE_NAME = 'unifyhub-cache-v1';
const FILES_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'assets/splash.mp4'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache inteligente com fallback e atualização em segundo plano
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, networkResponse.clone())
          );
        }
        return networkResponse.clone();
      }).catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    })
  );
});

// Notificações a cada 3 horas
self.addEventListener('periodicsync', event => {
  if (event.tag === 'notificar-novidades') {
    event.waitUntil(showNovidades());
  }
});

async function showNovidades() {
  const permission = await self.registration.showNotification('Veja as novidades!', {
    body: 'Tem conteúdo novo pra você explorar!',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'abrir', title: 'Ver agora' }
    ]
  });
}

// Registro do periodicSync
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      if ('periodicSync' in self.registration) {
        try {
          await self.registration.periodicSync.register('notificar-novidades', {
            minInterval: 3 * 60 * 60 * 1000 // 3 horas
          });
        } catch (e) {
          console.log('Periodic Sync não suportado:', e);
        }
      }
    })()
  );
});
