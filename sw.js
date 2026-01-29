const CACHE_NAME = 'todo-pro-offline-v2'; // Zmieniono nazwę, aby wymusić aktualizację u użytkowników

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './js/app.js',
    './js/helpers.js',
    './js/bootstrap/initApp.js',
    './js/controllers/todoController.js',
    './js/domain/todoRules.js',
    './js/store/todoStore.js',
    './js/view/todoView.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// 1. Instalacja (Pobieranie plików do pamięci urządzenia)
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Wymusza natychmiastową aktywację nowego SW
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Aktywacja (Czyszczenie starego Cache po aktualizacji)
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
        ))
    );
    return self.clients.claim(); // Przejmuje kontrolę nad otwartymi kartami
});

// 3. Pobieranie (Strategia: Cache First, Network Fallback)
self.addEventListener('fetch', (e) => {
    // Ignorujemy żądania inne niż GET oraz te, które nie są http (np. chrome-extension)
    if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            // Jeśli plik jest w cache (offline), zwróć go.
            // Jeśli nie, spróbuj pobrać z Internetu.
            return cachedResponse || fetch(e.request);
        })
    );
});