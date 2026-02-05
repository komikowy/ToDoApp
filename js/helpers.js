export function downloadICS(task) {
    if (!task.dueDate) return;

    // Formatowanie daty do formatu ICS
    
    const date = new Date(task.dueDate).toISOString().replace(/-|:|\.\d\d\d/g,"").slice(0,15);


    // Tworzenie zawartości pliku ICS
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${task.text}
DTSTART:${date}
DESCRIPTION:Zadanie z aplikacji ToDo PWA
END:VEVENT
END:VCALENDAR`;

// Pobieranie pliku ICS

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zadanie-${task.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}