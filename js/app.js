import * as Store from './store.js';
import * as View from './view.js';
import * as Helpers from './helpers.js';

// Stan aplikacji
let currentTasks = Store.getTasks();
const MAX_LENGTH = 200;

// Zmienna przechowująca ID zadania do usunięcia (dla Modala)
let taskToDeleteId = null; 

// --- GŁÓWNA INICJALIZACJA ---
function init() {
    // 1. Renderujemy pełną listę tylko raz na start
    View.renderFullList(currentTasks);
    View.renderStats(Store.calculateStats(currentTasks));

    // ZMIANA: Usunięto stąd Notification.requestPermission(), 
    // aby uniknąć błędu w konsoli przy starcie strony.

    // 2. Podpinamy zdarzenia globalne (formularz, lista, modal)
    bindEvents();

    // 3. Rejestracja PWA Service Worker
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

    // Obsługa Modala
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
    
    // ZMIANA: Prosimy o uprawnienia TUTAJ (reakcja na kliknięcie użytkownika)
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    
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
        // Zapis do Store
        const { updatedTasks, newTask } = Store.addTask(currentTasks, { 
            text, 
            image: imageBase64, 
            dueDate: date 
        });
        
        currentTasks = updatedTasks;
        
        // OPTYMALIZACJA: Dodajemy tylko jeden element do DOM
        View.appendTaskNode(newTask);
        View.renderStats(Store.calculateStats(currentTasks));
        View.resetForm();
        View.showToast("Dodano zadanie!", "success");

        // Powiadomienie
        Helpers.scheduleNotification(newTask);

    } catch (error) {
        View.showToast(error.message, "error");
    }
}

// --- LOGIKA: AKCJE NA LIŚCIE (Delegacja zdarzeń) ---
function handleListActions(e) {
    const item = e.target.closest('.todo-item');
    if (!item) return;
    
    const id = Number(item.dataset.id);
    const task = currentTasks.find(t => t.id === id);

    // 1. DELETE (Otwiera Modal)
    if (e.target.closest('.delete-btn')) {
        taskToDeleteId = id;
        View.elements.dialog.showModal();
        return;
    }

    // 2. EDIT
    if (e.target.closest('.edit-btn')) {
        const newText = prompt("Edytuj treść zadania:", task.text);
        if (newText !== null && newText.trim() !== "" && newText !== task.text) {
            try {
                currentTasks = Store.updateTaskContent(currentTasks, id, newText.trim());
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

    // 4. TOGGLE
    if (e.target.closest('.todo-content')) {
        currentTasks = Store.toggleTask(currentTasks, id);
        View.updateTaskNode(id, { type: 'toggle' });
        View.renderStats(Store.calculateStats(currentTasks));
    }
}

// --- LOGIKA: USUWANIE (Potwierdzone w Modalu) ---
function confirmDeleteTask() {
    if (!taskToDeleteId) return;

    currentTasks = Store.removeTask(currentTasks, taskToDeleteId);
    View.removeTaskNode(taskToDeleteId);
    View.renderStats(Store.calculateStats(currentTasks));
    View.showToast("Usunięto zadanie", "info");

    View.elements.dialog.close();
    taskToDeleteId = null;
}

// --- LOGIKA: USUWANIE GRUPOWE ---
function handleClearCompleted() {
    if (confirm("Usunąć wszystkie ukończone zadania?")) {
        currentTasks = Store.removeCompleted(currentTasks);
        View.renderFullList(currentTasks);
        View.renderStats(Store.calculateStats(currentTasks));
        View.showToast("Wyczyszczono listę", "success");
    }
}

// Start aplikacji
init();