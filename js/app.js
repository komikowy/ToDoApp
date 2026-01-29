import * as Store from './store.js';
import * as View from './view.js';
import * as Helpers from './helpers.js';

// Stan aplikacji
let currentTasks = Store.getTasks();
const MAX_LENGTH = 200;

// Zmienna przechowująca ID zadania do usunięcia (dla Modala)
// Rozwiązuje problem Memory Leak z event listenerami
let taskToDeleteId = null; 

// --- GŁÓWNA INICJALIZACJA ---
function init() {
    // 1. Renderujemy pełną listę tylko raz na start
    View.renderFullList(currentTasks);
    View.renderStats(Store.calculateStats(currentTasks));

    // 2. Prosimy o uprawnienia do powiadomień
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    // 3. Podpinamy zdarzenia globalne (formularz, lista, modal)
    bindEvents();

    // 4. Rejestracja PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('SW OK'))
                .catch(err => console.error('SW Error', err));
        });
    }
}

// --- OBSŁUGA ZDARZEŃ (Event Listeners) ---
function bindEvents() {
    View.elements.form.addEventListener('submit', handleAdd);
    View.elements.list.addEventListener('click', handleListActions);

    // Obsługa Modala (Potwierdzenie usunięcia)
    // Podpinamy to RAZ, a nie przy każdym kliknięciu w kosz (Fix Memory Leak)
    if (View.elements.dialogConfirmBtn) {
        View.elements.dialogConfirmBtn.addEventListener('click', confirmDeleteTask);
    }
    if (View.elements.dialogCancelBtn) {
        View.elements.dialogCancelBtn.addEventListener('click', () => View.elements.dialog.close());
    }

    // Obsługa przycisku "Wyczyść ukończone"
    if (View.elements.clearBtn) {
        View.elements.clearBtn.addEventListener('click', handleClearCompleted);
    }
}

// --- LOGIKA: DODAWANIE (Async) ---
async function handleAdd(e) {
    e.preventDefault();
    
    // Pobieramy dane z formularza przez View
    const { text, date, file } = View.getFormData();

    // Walidacja
    if (!text) return View.showToast("Wpisz treść zadania!", "error");
    if (text.length > MAX_LENGTH) return View.showToast("Za długi tekst!", "error");

    let imageBase64 = null;

    // Przetwarzanie zdjęcia (jeśli jest)
    if (file) {
        try {
            View.showToast("Przetwarzanie zdjęcia...", "info");
            imageBase64 = await Helpers.fileToBase64(file);
        } catch (err) {
            return View.showToast(err.message, "error");
        }
    }

    try {
        // Zapis do Store (może rzucić błąd jak braknie miejsca)
        const { updatedTasks, newTask } = Store.addTask(currentTasks, { 
            text, 
            image: imageBase64, 
            dueDate: date 
        });
        
        // Aktualizacja stanu
        currentTasks = updatedTasks;
        
        // OPTYMALIZACJA: Dodajemy tylko jeden element do DOM, zamiast przerysowywać całość
        View.appendTaskNode(newTask);
        
        // Aktualizacja licznika
        View.renderStats(Store.calculateStats(currentTasks));
        
        // Reset formularza
        View.resetForm();
        View.showToast("Dodano zadanie!", "success");

        // Powiadomienie
        Helpers.scheduleNotification(newTask);

    } catch (error) {
        // Obsługa błędu LocalStorage (np. Quota Exceeded)
        View.showToast(error.message, "error");
    }
}

// --- LOGIKA: AKCJE NA LIŚCIE (Delegacja zdarzeń) ---
function handleListActions(e) {
    // Sprawdzamy co kliknięto
    const item = e.target.closest('.todo-item');
    if (!item) return;
    
    const id = Number(item.dataset.id);
    const task = currentTasks.find(t => t.id === id);

    // 1. DELETE (Otwiera Modal)
    if (e.target.closest('.delete-btn')) {
        taskToDeleteId = id; // Zapamiętujemy ID globalnie
        View.elements.dialog.showModal(); // Pokazujemy natywny dialog
        return;
    }

    // 2. EDIT (Pełny CRUD)
    if (e.target.closest('.edit-btn')) {
        // Tutaj używamy prompt dla prostoty, ale można to zamienić na drugi modal
        const newText = prompt("Edytuj treść zadania:", task.text);
        
        if (newText !== null && newText.trim() !== "" && newText !== task.text) {
            try {
                currentTasks = Store.updateTaskContent(currentTasks, id, newText.trim());
                // Aktualizujemy tylko tekst w DOM
                View.updateTaskNode(id, { type: 'text', value: newText.trim() });
                View.showToast("Zaktualizowano!", "success");
            } catch (err) {
                View.showToast(err.message, "error");
            }
        }
        return;
    }

    // 3. KALENDARZ
    if (e.target.closest('.calendar-btn')) {
        Helpers.downloadICS(task);
        View.showToast("Pobrano plik kalendarza", "info");
        return;
    }

    // 4. TOGGLE (Kliknięcie w treść/checkbox)
    if (e.target.closest('.todo-content')) {
        currentTasks = Store.toggleTask(currentTasks, id);
        // Aktualizujemy tylko klasę w DOM
        View.updateTaskNode(id, { type: 'toggle' });
        View.renderStats(Store.calculateStats(currentTasks));
    }
}

// --- LOGIKA: USUWANIE (Potwierdzone w Modalu) ---
function confirmDeleteTask() {
    if (!taskToDeleteId) return; // Zabezpieczenie

    currentTasks = Store.removeTask(currentTasks, taskToDeleteId);
    View.removeTaskNode(taskToDeleteId); // Usuwamy element z DOM
    View.renderStats(Store.calculateStats(currentTasks));
    View.showToast("Usunięto zadanie", "info");

    // Zamknięcie i czyszczenie
    View.elements.dialog.close();
    taskToDeleteId = null;
}

// --- LOGIKA: USUWANIE GRUPOWE ---
function handleClearCompleted() {
    // Tu dla prostoty używamy confirm, ale w wersji PRO można też użyć modala
    if (confirm("Usunąć wszystkie ukończone zadania?")) {
        currentTasks = Store.removeCompleted(currentTasks);
        // Tutaj musimy przerysować listę, bo zniknęło wiele elementów
        View.renderFullList(currentTasks);
        View.renderStats(Store.calculateStats(currentTasks));
        View.showToast("Wyczyszczono listę", "success");
    }
}

// Start aplikacji
init();