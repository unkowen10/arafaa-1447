const CACHE_NAME = 'arafah1447-v2';
const ASSETS = [
  './',
  'index.html',
  'features.html',
  'my-duas.html',
  'welcome.html',
  'schedule.html',
  'duas.html',
  'virtues.html',
  'tracker.html',
  'family.html',
  'mistakes.html',
  'checklist.html',
  'css/style.css',
  'js/app.js',
  'manifest.json',
  'images/icon-192.png',
  'images/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return resp;
      });
    }).catch(() => caches.match('welcome.html'))
  );
});
