const CACHE = 'gwy-quiz-v10'; // 改静态资源必须 bump
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css',
  './js/main.js', './js/router.js', './js/logic.js', './js/db.js', './js/store.js',
  './js/quiz-player.js',
  './js/views/practice.js', './js/views/review.js', './js/views/essay.js',
  './js/views/videos.js', './js/views/settings.js',
  './data/questions.json', './data/videos.json',
  './icons/icon-180.png', './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // B 站等外链直连
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit ||
    fetch(e.request).then(resp => {   // 运行时缓存(材料图等),下次离线可用
      if (resp.ok && e.request.method === 'GET') {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return resp;
    })));
});
