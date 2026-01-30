const CACHE_NAME = 'todo-enterprise-v2'; // Zmieniono na v2, aby wymusić odświeżenie u klienta

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    
    // Główne pliki
    './js/app.js',
    './js/utils/helpers.js',
    './js/bootstrap/initApp.js',

    // Logika i Dane
    './js/domain/todoRules.js',
    './js/services/notificationService.js',
    './js/store/todoStore.js',
    './js/store/uiStore.js',

    // Kontroler
    './js/controllers/todoController.js',

    // Widok
    './js/view/todoView.js',
    './js/view/components/todoItem.js',
    './js/view/components/toastManager.js',
    './js/view/components/modalManager.js',

    // Grafika
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// 1. Instalacja (Pobieranie plików do pamięci urządzenia)
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Wymusza natychmiastową aktywację nowego SW
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Instalowanie i cacheowanie plików aplikacji...');
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

// 3. Pobieranie (Strategia: Cache First, Network Fallback + Offline Placeholder)
self.addEventListener('fetch', (e) => {
    // Ignorujemy żądania inne niż GET oraz te, które nie są http (np. chrome-extension://)
    if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            // A. Jeśli plik jest w cache (offline), zwróć go natychmiast.
            if (cachedResponse) {
                return cachedResponse;
            }

            // B. Jeśli nie ma w cache, spróbuj pobrać z Internetu.
            return fetch(e.request).catch(() => {
                // C. Sytuacja awaryjna: Brak w cache I brak Internetu (Offline).
                
                // Jeśli żądanie dotyczyło OBRAZKA -> zwróć naszą ikonę jako "zaślepkę"
                if (e.request.destination === 'image') {
                    return caches.match('./icons/icon-192.png');
                }
                
                // (Opcjonalnie) Jeśli żądanie dotyczyło strony HTML -> zwróć index.html
                // if (e.request.mode === 'navigate') {
                //     return caches.match('./index.html');
                // }
            });
        })
    );
});