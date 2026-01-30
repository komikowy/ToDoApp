// js/utils/helpers.js

// --- 1. Obsługa Kalendarza (.ics) ---

// Pomocnik: Formatowanie daty do standardu iCalendar (YYYYMMDDTHHmmssZ)
function formatDateToICS(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    
    // 🛡️ ZABEZPIECZENIE: Jeśli data jest nieprawidłowa (Invalid Date), zwróć pusty ciąg
    if (isNaN(date.getTime())) {
        console.warn("[ICS] Nieprawidłowy format daty:", dateStr);
        return '';
    }

    // Konwersja na UTC, usunięcie kresek, dwukropków i milisekund
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function downloadICS(task) {
    // 1. Walidacja podstawowa: Czy zadanie ma datę?
    if (!task.dueDate) {
        console.warn("Brak daty - nie można wygenerować wpisu do kalendarza.");
        return;
    }

    // 2. Walidacja poprawności daty
    const startDate = new Date(task.dueDate);
    if (isNaN(startDate.getTime())) {
        console.error("❌ Błąd: Data zadania jest uszkodzona i nie można jej przetworzyć.");
        return;
    }

    // Obliczanie czasu trwania (Start + 1 godzina)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Dodajemy 1h

    const startICS = formatDateToICS(startDate);
    const endICS = formatDateToICS(endDate);
    const nowICS = formatDateToICS(new Date());

    // Jeśli daty nie udało się sformatować, przerywamy
    if (!startICS || !endICS) return;

    // Budowanie treści pliku .ics
    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TodoApp PWA//EN',
        'BEGIN:VEVENT',
        `UID:${task.id}@todoapp`,        // Unikalne ID
        `DTSTAMP:${nowICS}`,             // Data wygenerowania
        `DTSTART:${startICS}`,
        `DTEND:${endICS}`,               // Koniec wydarzenia
        `SUMMARY:${task.text}`,
        `DESCRIPTION:Zadanie z Twojej aplikacji PWA.`,
        'END:VEVENT',
        'END:VCALENDAR'
    ];

    const icsContent = icsLines.join('\r\n');

    // 3. Bezpieczna nazwa pliku (usuwamy znaki specjalne, które mogą zepsuć pobieranie)
    const safeName = task.text.replace(/[^a-z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ \-]/gi, '_').substring(0, 20);

    // Tworzenie i pobieranie pliku
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob); 
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zadanie-${safeName || 'nowe'}.ics`);
    document.body.appendChild(link);
    
    link.click();
    
    // Sprzątanie po sobie
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// --- 2. Obsługa Plików (Base64) ---

export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        // Limit wielkości pliku (np. 1MB), by nie "zamulić" przeglądarki
        if (file.size > 1024 * 1024) {
            reject(new Error("Zdjęcie jest za duże! Maksymalny rozmiar to 1MB."));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}