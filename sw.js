self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Un service worker básico para que Chrome detecte la PWA y permita instalación.
  // No cacheamos nada por defecto para no dar problemas con datos en tiempo real.
  event.respondWith(fetch(event.request));
});
