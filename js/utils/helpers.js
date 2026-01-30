// --- POMOCNICY (Utilities) ---

// 1. Konwersja pliku graficznego na Base64 (Async)
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        // Limit wielkości pliku (np. 1MB) przed konwersją, by nie zapchać LocalStorage
        if (file.size > 1024 * 1024) {
            reject(new Error("Zdjęcie jest za duże! Max 1MB."));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// 2. Generowanie pliku .ics dla kalendarza
export function downloadICS(task) {
    if (!task.dueDate) return;
    
    // Formatowanie daty do standardu iCalendar (YYYYMMDDTHHmm00)
    // Usuwamy znaki specjalne z ISO stringa
    const date = new Date(task.dueDate).toISOString().replace(/-|:|\.\d\d\d/g,"").slice(0,15);
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${task.text}
DTSTART:${date}
DESCRIPTION:Zadanie z aplikacji ToDo PWA
END:VEVENT
END:VCALENDAR`;

    // Tworzenie wirtualnego pliku do pobrania
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zadanie-${task.id}.ics`;
    document.body.appendChild(a);
    a.click(); // Symulacja kliknięcia
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// 3. Powiadomienia Push (Lokalne)
export function scheduleNotification(task) {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
        new Notification("Nowe zadanie", {
            body: task.text,
            icon: '/icons/icon-192.png', // Upewnij się, że masz ten plik, albo usuń tę linię
            vibrate: [200, 100, 200]
        });
    }
}