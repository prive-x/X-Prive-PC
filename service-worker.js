const CACHE_NAME = 'unifyhub-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalação
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Ativação
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Limpar caches antigos
      const keys = await caches.keys();
      await Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)));

      // Registrar periodicSync se suportado
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
  self.clients.claim();
});

// Fetch com cache inteligente
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse.clone();
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Função de notificação
async function showNovidades() {
  await self.registration.showNotification('Veja as novidades!', {
    body: 'Tem conteúdo novo pra você explorar!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'abrir', title: 'Ver agora' }
    ]
  });
}

// Periodic sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'notificar-novidades') {
    event.waitUntil(showNovidades());
  }
});
