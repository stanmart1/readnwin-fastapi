const CACHE_NAME = 'readnwin-v4';
const urlsToCache = [
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Force HTTPS for backend API requests
  let requestUrl = event.request.url;
  if (requestUrl.includes('backend.readnwin.com') && requestUrl.startsWith('http://')) {
    requestUrl = requestUrl.replace('http://', 'https://');
  }
  
  // Don't cache JS files, HTML, or API requests
  if (requestUrl.includes('.js') || 
      requestUrl.includes('.html') ||
      requestUrl.includes('/assets/') ||
      requestUrl.includes('/api/')) {
    event.respondWith(fetch(requestUrl));
    return;
  }
  
  event.respondWith(
    caches.match(requestUrl)
      .then((response) => response || fetch(requestUrl))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
