/**
 * Enterprise Service Worker - Todo PWA PRO
 * Strategia: Stale-While-Revalidate
 */

const CACHE_NAME = 'todo-pro-offline-v4'; // Zmieniono wersję dla pełnej aktualizacji

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './tests.html', // Dodano runner testów
    './style.css',
    './manifest.json',
    './js/app.js',
    './js/helpers.js',
    './js/bootstrap/initApp.js',
    './js/controllers/todoController.js',
    './js/domain/todoRules.js',
    './js/services/notificationService.js', // Dodano serwis powiadomień
    './js/store/todoStore.js',
    './js/store/imageStore.js',
    './js/store/uiStore.js',
    './js/view/todoView.js',
    './js/view/components/TodoItem.js',
    './js/view/components/ToastManager.js',
    './js/view/components/ModalManager.js',
    
    // Ścieżki do testów (Health Check w trybie offline)
    './js/tests/testRunner.js',
    './js/tests/unit/todoRules.test.js',
    './js/tests/unit/todoStore.test.js',
    './js/tests/integration/todoCreationFlow.test.js',
    './js/tests/integration/todoDeletionFlow.test.js',
    './js/tests/integration/imageHandlingFlow.test.js',
    
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// 1. Instalacja (Cache-first dla App Shell)
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Pre-caching Enterprise Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Aktywacja (Czyszczenie starych wersji)
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
        ))
    );
    return self.clients.claim();
});

// 3. Pobieranie: Strategia Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
    // Obsługujemy tylko GET i protokoły http/https
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                // Wykonujemy żądanie sieciowe w tle
                const networkFetch = fetch(event.request).then((networkResponse) => {
                    // Jeśli odpowiedź jest poprawna, aktualizujemy cache
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // W razie błędu sieci (tryb offline) po prostu nie aktualizujemy cache
                });

                // Zwracamy kopię z cache natychmiast, a w tle czekamy na odświeżenie z sieci
                return cachedResponse || networkFetch;
            });
        })
    );
});