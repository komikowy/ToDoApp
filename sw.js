const CACHE_NAME = 'todo-pwa-final-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './js/app.js',
    './js/store.js',
    './js/view.js',
    'https://cdn-icons-png.flaticon.com/512/7692/7692809.png'
];

// Instalacja
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
});

// Aktywacja (czyszczenie starego cache)
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
        ))
    );
    return self.clients.claim();
});

// Pobieranie (Cache First)
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});