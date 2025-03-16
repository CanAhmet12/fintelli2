const CACHE_NAME = 'fintelli-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/static/js/main.chunk.js',
    '/static/js/bundle.js',
    '/static/css/main.chunk.css',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png'
];

// Service Worker kurulumu
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(STATIC_ASSETS);
            })
    );
});

// Ağ isteklerini yakalama
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache'de varsa cache'den döndür
                if (response) {
                    return response;
                }

                // Cache'de yoksa ağdan al ve cache'e ekle
                return fetch(event.request).then(
                    (response) => {
                        // Geçersiz yanıt veya OPTIONS isteği ise cache'leme
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Yanıtı cache'e ekle
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

// Cache'i güncelleme
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
}); 