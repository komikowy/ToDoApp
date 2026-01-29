const STORAGE_KEY = 'pro_todo_v2'; // Zmieniamy klucz, bo struktura danych się zmieniła

// --- HELPER: Bezpieczny zapis (Quota Handling) ---
// LocalStorage ma limit (ok. 5MB). Zdjęcia mogą go szybko zapchać.
// Ta funkcja zapobiega crashowi aplikacji.
function safeSave(tasks) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return { success: true };
    } catch (e) {
        console.error("Quota Exceeded!", e);
        // Zwracamy obiekt błędu, zamiast rzucać wyjątek tutaj
        return { 
            success: false, 
            error: "Brak miejsca w pamięci przeglądarki! Usuń stare zadania lub zdjęcia." 
        };
    }
}

// --- READ ---
export function getTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Błąd odczytu LocalStorage", e);
        return [];
    }
}

// --- CREATE ---
// Teraz przyjmuje obiekt z opcjami (tekst, zdjęcie, data)
export function addTask(tasks, { text, image, dueDate }) {
    const newTask = {
        id: Date.now(),
        text: text,
        done: false,
        image: image || null,    // Base64 zdjęcia
        dueDate: dueDate || null // Data wykonania
    };

    const updated = [newTask, ...tasks]; // Dodajemy na początek listy
    
    const saveResult = safeSave(updated);
    
    // Jeśli zapis się nie udał (brak miejsca), rzucamy błąd, 
    // który złapie App.js i pokaże w Toaście
    if (!saveResult.success) {
        throw new Error(saveResult.error);
    }

    // Zwracamy obiekt, bo App.js potrzebuje i nowej listy, i nowego zadania (do optymalizacji DOM)
    return { updatedTasks: updated, newTask };
}

// --- UPDATE (Edycja treści) ---
export function updateTaskContent(tasks, id, newText) {
    const updated = tasks.map(t => 
        t.id === id ? { ...t, text: newText } : t
    );
    
    const saveResult = safeSave(updated);
    if (!saveResult.success) throw new Error(saveResult.error);
    
    return updated;
}

// --- DELETE ---
export function removeTask(tasks, id) {
    const updated = tasks.filter(t => t.id !== id);
    safeSave(updated); // Tu rzadko braknie miejsca, więc nie musimy rzucać błędu
    return updated;
}

export function removeCompleted(tasks) {
    const updated = tasks.filter(task => !task.done);
    safeSave(updated);
    return updated;
}

// --- TOGGLE (Status) ---
export function toggleTask(tasks, id) {
    const updated = tasks.map(t => 
        t.id === id ? { ...t, done: !t.done } : t
    );
    safeSave(updated);
    return updated;
}

// --- STATYSTYKI ---
export function calculateStats(tasks) {
    return {
        total: tasks.length,
        completed: tasks.filter(t => t.done).length
    };
}