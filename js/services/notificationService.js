export class NotificationService {
    constructor() {
        this.supported = "Notification" in window;
    }

    async requestPermission() {
        if (!this.supported) throw new Error("Brak obsługi powiadomień");
        return await Notification.requestPermission();
    }

    hasPermission() {
        return this.supported && Notification.permission === "granted";
    }

    schedule(task) {
        if (!this.hasPermission()) return;

        try {
            // Rejestracja powiadomienia przez Service Worker (dla lepszego wsparcia mobile)
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification("Nowe zadanie", {
                        body: task.text,
                        icon: './icons/icon-192.png',
                        vibrate: [200, 100, 200],
                        tag: `task-${task.id}`
                    });
                });
            } else {
                // Fallback dla zwykłego API
                new Notification("Nowe zadanie", {
                    body: task.text,
                    icon: './icons/icon-192.png'
                });
            }
        } catch (e) {
            console.warn("Błąd wysyłania powiadomienia:", e);
        }
    }
}
