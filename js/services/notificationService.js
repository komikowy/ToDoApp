export class NotificationService {
    isSupported() {
        return "Notification" in window;
    }

    hasPermission() {
        return this.isSupported() && Notification.permission === "granted";
    }

    async requestPermission() {
        if (!this.isSupported()) return 'denied';
        return await Notification.requestPermission();
    }

    schedule(task) {
        if (this.hasPermission()) {
            // Proste powiadomienie natychmiastowe (w prawdziwym PWA byłoby Push API)
            new Notification("Nowe zadanie", {
                body: task.text,
                icon: 'icons/icon-192.png',
                vibrate: [200, 100, 200]
            });
        }
    }
}