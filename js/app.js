import * as Store from './store.js';
import * as View from './view.js';
import * as Helpers from './helpers.js';

// Stan aplikacji
let currentTasks = Store.getTasks();
const MAX_LENGTH = 200;
let taskToDeleteId = null; 

// --- GŁÓWNA INICJALIZACJA ---
function init() {
    View.renderFullList(currentTasks);
    View.renderStats(Store.calculateStats(currentTasks));

    bindEvents();
    
    // Sprawdzenie statusu powiadomień przy starcie (żeby ustawić ikonę)
    updateNotificationIcon();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('SW OK'))
                .catch(err => console.error('SW Error', err));
        });
    }
}

// --- OBSŁUGA ZDARZEŃ ---
function bindEvents() {
    View.elements.form.addEventListener('submit', handleAdd);
    View.elements.list.addEventListener('click', handleListActions);

    // NOWOŚĆ: Obsługa przycisku powiadomień
    const notifyBtn = document.getElementById('notify-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', handleNotificationToggle);
    }

    if (View.elements.dialogConfirmBtn) {
        View.elements.dialogConfirmBtn.addEventListener('click', confirmDeleteTask);
    }
    if (View.elements.dialogCancelBtn) {
        View.elements.dialogCancelBtn.addEventListener('click', () => View.elements.dialog.close());
    }
    if (View.elements.clearBtn) {
        View.elements.clearBtn.addEventListener('click', handleClearCompleted);
    }
}

// --- LOGIKA POWIADOMIEŃ (PERMISSIONS API) ---
function handleNotificationToggle() {
    if (!("Notification" in window)) {
        View.showToast("Twoja przeglądarka nie obsługuje powiadomień.", "error");
        return;
    }

    if (Notification.permission === "granted") {
        View.showToast("Powiadomienia są już aktywne ✅", "info");
        return;
    }

    if (Notification.permission === "denied") {
        View.showToast("Powiadomienia są zablokowane w ustawieniach telefonu 🚫", "error");
        return;
    }

    // WŁAŚCIWA PROŚBA (Musi być bezpośrednim wynikiem kliknięcia)
    Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
            View.showToast("Powiadomienia włączone! 🎉", "success");
            
            // Testowe powiadomienie
            new Notification("Test powiadomień", {
                body: "Działa! Będziemy przypominać o zadaniach.",
                icon: './icons/icon-192.png'
            });
        } else {
            View.showToast("Nie wyrażono zgody na powiadomienia.", "info");
        }
        updateNotificationIcon();
    });
}

function updateNotificationIcon() {
    const btn = document.getElementById('notify-btn');
    if (!btn || !("Notification" in window)) return;

    if (Notification.permission === 'granted') {
        btn.textContent = '🔔'; // Aktywne
    } else {
        btn.textContent = '🔕'; // Nieaktywne
    }
}

// --- LOGIKA: DODAWANIE ---
async function handleAdd(e) {
    e.preventDefault();
    
    // USUNIĘTO automatyczne żądanie powiadomień stąd!
    
    const { text, date, file } = View.getFormData();

    if (!text) return View.showToast("Wpisz treść zadania!", "error");
    if (text.length > MAX_LENGTH) return View.showToast("Za długi tekst!", "error");

    let imageBase64 = null;

    if (file) {
        try {
            View.showToast("Przetwarzanie zdjęcia...", "info");
            imageBase64 = await Helpers.fileToBase64(file);
        } catch (err) {
            return View.showToast(err.message, "error");
        }
    }

    try {
        const { updatedTasks, newTask } = Store.addTask(currentTasks, { 
            text, 
            image: imageBase64, 
            dueDate: date 
        });
        
        currentTasks = updatedTasks;
        View.appendTaskNode(newTask);
        View.renderStats(Store.calculateStats(currentTasks));
        View.resetForm();
        View.showToast("Dodano zadanie!", "success");

        Helpers.scheduleNotification(newTask);

    } catch (error) {
        View.showToast(error.message, "error");
    }
}

// --- LOGIKA: LISTA ---
function handleListActions(e) {
    const item = e.target.closest('.todo-item');
    if (!item) return;
    
    const id = Number(item.dataset.id);
    const task = currentTasks.find(t => t.id === id);

    if (e.target.closest('.delete-btn')) {
        taskToDeleteId = id;
        View.elements.dialog.showModal();
        return;
    }

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

    if (e.target.closest('.calendar-btn')) {
        Helpers.downloadICS(task);
        View.showToast("Pobrano plik kalendarza", "info");
        return;
    }

    if (e.target.closest('.todo-content')) {
        currentTasks = Store.toggleTask(currentTasks, id);
        View.updateTaskNode(id, { type: 'toggle' });
        View.renderStats(Store.calculateStats(currentTasks));
    }
}

// --- LOGIKA: USUWANIE ---
function confirmDeleteTask() {
    if (!taskToDeleteId) return;

    currentTasks = Store.removeTask(currentTasks, taskToDeleteId);
    View.removeTaskNode(taskToDeleteId);
    View.renderStats(Store.calculateStats(currentTasks));
    View.showToast("Usunięto zadanie", "info");

    View.elements.dialog.close();
    taskToDeleteId = null;
}

function handleClearCompleted() {
    if (confirm("Usunąć wszystkie ukończone zadania?")) {
        currentTasks = Store.removeCompleted(currentTasks);
        View.renderFullList(currentTasks);
        View.renderStats(Store.calculateStats(currentTasks));
        View.showToast("Wyczyszczono listę", "success");
    }
}

init();