const CACHE_NAME = 'todo-enterprise-v3'; // Zmiana na v3 wymusi pobranie nowego SW

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

// 1. Instalacja (Safe Installation Strategy)
self.addEventListener('install', (e) => {
    self.skipWaiting();
    
    e.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log(`[SW] Rozpoczynam bezpieczne cacheowanie wersji ${CACHE_NAME}...`);
            
            // Zamiast cache.addAll (który wywala wszystko przy 1 błędzie),
            // pobieramy pliki jeden po drugim i logujemy błędy.
            const results = await Promise.allSettled(
                ASSETS_TO_CACHE.map(async (url) => {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`Status ${response.status}`);
                        return cache.put(url, response);
                    } catch (err) {
                        console.error(`❌ [SW ERROR] Nie udało się pobrać pliku: ${url}`, err);
                        
                        // Decyzja Enterprise:
                        // Jeśli brakuje plików KRYTYCZNYCH, przerywamy instalację.
                        // Jeśli brakuje ikonki/mniej ważnych rzeczy -> instalujemy dalej.
                        if (url.includes('app.js') || url.includes('index.html') || url.includes('initApp.js')) {
                            throw new Error(`Krytyczny plik niedostępny: ${url}. Przerywam instalację SW.`);
                        }
                    }
                })
            );

            // Sprawdzamy czy nie było błędów krytycznych
            const rejected = results.filter(r => r.status === 'rejected');
            if (rejected.length > 0) {
                console.warn(`⚠️ [SW] Zainstalowano z ${rejected.length} błędami niekrytycznymi.`);
            } else {
                console.log('✅ [SW] Pełna instalacja zakończona sukcesem.');
            }
        })
    );
});

// 2. Aktywacja (Sprzątanie starego cache)
self.addEventListener('activate', (e) => {
    console.log('[SW] Aktywacja nowego Service Workera...');
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
        ))
    );
    return self.clients.claim();
});

// 3. Pobieranie (Cache First + Offline Fallback)
self.addEventListener('fetch', (e) => {
    // Ignorujemy żądania inne niż GET i nie-http
    if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            // A. Mamy w cache? Zwracamy od razu.
            if (cachedResponse) {
                return cachedResponse;
            }

            // B. Nie mamy? Pobieramy z sieci.
            return fetch(e.request).catch(() => {
                // C. Brak sieci (Offline) I brak w cache.
                console.log(`[SW] Offline fallback dla: ${e.request.url}`);

                // Jeśli żądanie dotyczyło OBRAZKA -> zwróć ikonkę aplikacji
                if (e.request.destination === 'image') {
                    return caches.match('./icons/icon-192.png');
                }
                
                // Opcjonalnie: Jeśli żądanie dotyczy nawigacji (HTML) -> zwróć index.html
                // if (e.request.mode === 'navigate') {
                //      return caches.match('./index.html');
                // }
            });
        })
    );
});