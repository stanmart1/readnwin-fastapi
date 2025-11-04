const CACHE_NAME = 'readnwin-v3';
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
  // Don't cache JS files or HTML to prevent stale file issues
  if (event.request.url.includes('.js') || 
      event.request.url.includes('.html') ||
      event.request.url.includes('/assets/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Force HTTPS for API requests to prevent mixed content errors
  let request = event.request;
  if (request.url.includes('backend.readnwin.com') && request.url.startsWith('http://')) {
    request = new Request(request.url.replace('http://', 'https://'), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer
    });
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => response || fetch(request))
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
