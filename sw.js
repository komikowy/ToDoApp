const CACHE_NAME = 'todo-enterprise-v1'; // Zmieniono nazwę, aby wymusić aktualizację

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './js/app.js',
    './js/helpers.js',

    // Bootstrap
    './js/bootstrap/initApp.js',

    // Domain (Reguły biznesowe)
    './js/domain/todoRules.js',

    // Services & Stores (Logika i Dane)
    './js/services/NotificationService.js',
    './js/store/TodoStore.js',
    './js/store/UIStore.js',

    // Controllers (Orkiestracja)
    './js/controllers/TodoController.js',

    // View & Components (Widok)
    './js/view/TodoView.js',
    './js/view/components/TodoItem.js',
    './js/view/components/ToastManager.js',
    './js/view/components/ModalManager.js',

    // Ikony
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
    // Ignorujemy żądania inne niż GET oraz te, które nie są http
    if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            // Jeśli plik jest w cache (offline), zwróć go.
            if (cachedResponse) {
                return cachedResponse;
            }
            // Jeśli nie, spróbuj pobrać z Internetu.
            return fetch(e.request);
        })
    );
});