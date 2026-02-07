const CACHE_NAME = 'sarkari-resizer-v3';
const ASSETS = [
    './',
    './index.html',
    './ssc-photo-resizer.html',
    './upsc-photo-resizer.html',
    './ibps-photo-resizer.html',
    './railways-photo-resizer.html',
    './neet-photo-resizer.html',
    './passport-photo-resizer.html',
    './signature-resizer.html',
    './css/style.css',
    './css/seo.css',
    './css/preview.css',
    './js/script.js',
    './assets/favicon.svg',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// 1. Install Event: Cache Files
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting(); // Force activate new SW
});

// 2. Activate Event: Clean Old Caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim(); // Take control immediately
});

// Fetch Event: Serve from Cache if Offline
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then((response) => response || fetch(e.request))
    );
});
