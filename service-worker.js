const CACHE_NAME = 'volleyball-table-cache-v1';
const urlsToCache = [
    '/', // Cache the root URL (index.html)
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    // Add paths to your icons here
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
    // Add any other static assets like fonts if you use them
];

// Install event: Cache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Failed to open cache or add URLs:', err);
            })
    );
     self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache version
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
     return self.clients.claim(); // Take control of uncontrolled clients immediately
});


// Fetch event: Serve cached assets first (Cache-First strategy)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Not in cache - fetch from network
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Don't cache requests that aren't GET
                                if(event.request.method === 'GET') {
                                     cache.put(event.request, responseToCache);
                                }
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Fetch failed; returning offline page instead.', error);
                     // Optional: Return a custom offline page/resource if fetch fails
                    // return caches.match('/offline.html');
                });
            })
    );
});