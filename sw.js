// ✦ تم تحديث الإصدار لإجبار المتصفح على جلب النسخة الجديدة من الملفات
const CACHE_NAME = 'arafah1447-v3';
const ASSETS = [
  './',
  'index.html',
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
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS).catch(()=>{/* تجاهل الأصول المفقودة */}))
      .then(() => self.skipWaiting())
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
  // ✦ استراتيجية Network-First للـ HTML و CSS و JS لضمان وصول التحديثات
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('.html');
  const isCode = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

  if (isHTML || isCode) {
    e.respondWith(
      fetch(e.request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('index.html')))
    );
    return;
  }

  // باقي الموارد: Cache-First
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return resp;
      });
    }).catch(() => caches.match('index.html'))
  );
});
