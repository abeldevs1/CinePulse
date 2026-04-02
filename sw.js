// A unique name for your cache. Update the 'v1' to 'v2' etc., when you make big changes!
const CACHE_NAME = 'cinepulse-elite-v1';

// The core files that make your app run offline
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/pages/app.html',
    '/pages/player.html',
    '/src/css/style.css',
    '/src/js/script.js',
    '/src/js/player.js',
    '/src/js/sync-engine.js',
    '/manifest.json'
];

// 1. INSTALL EVENT: Pre-cache all the core assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Forces the SW to activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching core assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// 2. ACTIVATE EVENT: Clean up any old, outdated caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control of the page immediately
});

// 3. FETCH EVENT: The "Network First, Fallback to Cache" Strategy
// self.addEventListener('fetch', (event) => {
//     // Let third-party API calls (like TMDB) and iframes (like video players) pass through normally.
//     // We only want to cache requests that come from your own domain.
//     if (!event.request.url.startsWith(self.location.origin)) {
//         return;
//     }

//     // For your own files: check the cache first. If it's not there, fetch it from the internet.
//     event.respondWith(
//         caches.match(event.request)
//             .then((cachedResponse) => {
//                 if (cachedResponse) {
//                     return cachedResponse; // Return the lightning-fast local copy
//                 }

//                 // If not in cache, go to the network
//                 return fetch(event.request).catch(() => {
//                     console.log('[Service Worker] Network request failed. User is offline.');
//                     // Optional future enhancement: You could return a custom offline.html page here!
//                 });
//             })
//     );
// });

// 3. FETCH EVENT: TRUE Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        // Step 1: Try the network first
        fetch(event.request).then((networkResponse) => {
            // Optional: You can clone the response here and update the cache with the fresh file
            return networkResponse;
        }).catch(() => {
            // Step 2: If the network fails (offline), look in the cache
            console.log('[Service Worker] Network request failed. Serving from cache.');
            return caches.match(event.request);
        })
    );
});