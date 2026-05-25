// =========================================================
// Service Worker - يوم عرفة 1447
// كل ما تعمل تحديث ورفع على GitHub، غيّر رقم النسخة CACHE_VERSION
// الكاش الجديد بيتعمل تلقائياً والقديم بيتمسح والمستخدم بيشوف زر التحديث
// =========================================================
const CACHE_VERSION = 'v7-2026-05-25';
const CACHE_NAME = 'arafah1447-' + CACHE_VERSION;

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

// تثبيت: نكاش الملفات الأساسية
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS).catch(()=>{}))
      .then(() => self.skipWaiting())
  );
});

// تفعيل: امسح أي كاش قديم
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('arafah1447-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// رسالة من الصفحة: skipWaiting (علشان زر "تحديث")
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// استراتيجية:
// - HTML / navigation => Network-first (علشان يلاقي آخر تعديل من GitHub)
// - باقي الملفات (CSS/JS/Images) => Stale-while-revalidate
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isHTML =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('.html');

  if (isHTML) {
    // Network-first للـ HTML
    e.respondWith(
      fetch(req)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(()=>{});
          return resp;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('welcome.html'))
        )
    );
    return;
  }

  // Stale-while-revalidate لباقي الأصول
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(()=>{});
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
