const CACHE_NAME = 'stm-naselenie-v2.5';
const ASSETS = [
  'index.html',
  'manifest.json',
  'icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Активировать сразу после установки
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // Удалить старый кеш
          }
        })
      );
    })
  );
  return self.clients.claim(); // Захватить контроль над всеми вкладками
});

self.addEventListener('fetch', (e) => {
  // Для HTML-страниц: сначала идем в сеть, если сети нет — отдаем кеш
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Для иконок, стилей и манифеста: отдаем из кеша, при отсутствии берем из сети
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
