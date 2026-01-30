export class NotificationService {
    
    // 1. NAPRAWA BŁĘDU: To musi być metoda, bo Kontroler wywołuje .isSupported()
    isSupported() {
        return 'Notification' in window;
    }

    // 2. Sprawdzenie zgody
    hasPermission() {
        if (!this.isSupported()) return false;
        return Notification.permission === "granted";
    }

    // 3. Prośba o uprawnienia
    async requestPermission() {
        if (!this.isSupported()) {
            throw new Error("Brak obsługi powiadomień w tej przeglądarce.");
        }
        return await Notification.requestPermission();
    }

    // 4. Wysyłanie powiadomienia
    schedule(task) {
        if (!this.hasPermission()) return;

        try {
            const title = "Nowe zadanie";
            const options = {
                body: task.text,
                icon: './icons/icon-192.png',
                badge: './icons/icon-192.png', // Mała ikonka na pasku (Android)
                vibrate: [200, 100, 200],
                tag: `task-${task.id}`, // Zapobiega duplikatom
                data: { 
                    id: task.id,
                    url: './index.html'
                }
            };

            // A. Próba użycia Service Workera (lepsze na mobile)
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                });
            } 
            // B. Fallback dla zwykłego API (np. Desktop bez SW)
            else {
                new Notification(title, options);
            }

        } catch (e) {
            console.warn("⚠️ Błąd wysyłania powiadomienia:", e);
        }
    }
}