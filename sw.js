const CACHE = 'nexus-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Always try network for API calls
  if (e.request.url.includes('api.anthropic') ||
      e.request.url.includes('api.openai') ||
      e.request.url.includes('generativelanguage') ||
      e.request.url.includes('api.x.ai') ||
      e.request.url.includes('fonts.googleapis')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', {status:503})));
    return;
  }
  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    })).catch(() => caches.match('/index.html'))
  );
});
