const CACHE_NAME = 'sarkari-resizer-v2';
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

// Install Event: Cache Files
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

// Fetch Event: Serve from Cache if Offline
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then((response) => response || fetch(e.request))
    );
});
