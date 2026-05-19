// Service Worker for FirstThingsFirst PWA
// Network-first caching strategy with relative paths

const CACHE_NAME = 'firstthingsfirst-v1.21';

// Get the base path from the service worker registration scope
const getBasePath = () => {
  const scope = self.registration.scope;
  const url = new URL(scope);
  return url.pathname;
};

// Resources to cache (relative to base path)
const getUrlsToCache = () => {
  const basePath = getBasePath();
  return [
    `${basePath}`,
    `${basePath}index.html`,
    `${basePath}app.css`,
    `${basePath}app.js`,
    `${basePath}manifest.json`,
    `${basePath}icon-192.png`,
    `${basePath}icon-512.png`,
    `${basePath}favicon.ico`
  ];
};

// Install service worker and cache resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(getUrlsToCache());
      })
      .then(() => self.skipWaiting())
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first caching strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(event.request)
      .then(response => {
        // If we got a valid response, clone it and update the cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', event.request.url);
            return cachedResponse;
          }

          // If not in cache and network failed, return a basic offline response
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match(`${getBasePath()}index.html`);
          }
        });
      })
  );
});

// Handle messages from the main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
