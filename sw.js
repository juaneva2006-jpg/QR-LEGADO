self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Fetch pass-through para cumplir requisitos de PWA
  e.respondWith(
    fetch(e.request).catch(() => new Response('Offline'))
  );
});
