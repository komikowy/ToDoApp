import * as Store from './store.js';
import * as View from './view.js';
import * as Helpers from './helpers.js';

// Stan aplikacji
let currentTasks = Store.getTasks();
const MAX_LENGTH = 200;
let taskToDeleteId = null; 

// --- NOWE ZMIENNE STANU (Filtrowanie i Sortowanie) ---
let filterMode = 'all'; // 'all', 'active', 'completed'
let sortMode = false;   // false = domyślnie, true = najpierw niewykonane

// --- GŁÓWNA INICJALIZACJA ---
function init() {
    // Zamiast renderFullList, używamy naszej nowej funkcji renderApp z logiką
    renderApp();
    View.renderStats(Store.calculateStats(currentTasks));

    bindEvents();
    
    // Sprawdzenie statusu powiadomień przy starcie
    updateNotificationIcon();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('SW OK'))
                .catch(err => console.error('SW Error', err));
        });
    }
}

// --- NOWA FUNKCJA: Główny silnik renderowania ---
// Odpowiada za pobranie zadań, przefiltrowanie ich i posortowanie przed wyświetleniem
function renderApp() {
    let tasksToRender = [...currentTasks];

    // 1. Filtrowanie
    if (filterMode === 'active') {
        tasksToRender = tasksToRender.filter(t => !t.done);
    } else if (filterMode === 'completed') {
        tasksToRender = tasksToRender.filter(t => t.done);
    }

    // 2. Sortowanie (Najpierw niewykonane)
    if (sortMode) {
        tasksToRender.sort((a, b) => {
            // false (0) idzie przed true (1) -> Niewykonane wyżej
            return Number(a.done) - Number(b.done);
        });
    }

    View.renderFullList(tasksToRender);
}

// --- OBSŁUGA ZDARZEŃ ---
function bindEvents() {
    View.elements.form.addEventListener('submit', handleAdd);
    View.elements.list.addEventListener('click', handleListActions);

    // Obsługa przycisku powiadomień
    const notifyBtn = document.getElementById('notify-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', handleNotificationToggle);
    }

    // --- NOWOŚĆ: Obsługa Filtrów ---
    // Pobieramy przyciski dynamicznie, bo nie ma ich w view.js exports (można dodać, ale tak szybciej)
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Zmiana wyglądu przycisków
            filters.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Zmiana logiki
            filterMode = e.target.dataset.filter;
            renderApp();
        });
    });

    // --- NOWOŚĆ: Obsługa Sortowania ---
    const sortToggle = document.getElementById('sort-toggle');
    if (sortToggle) {
        sortToggle.addEventListener('change', (e) => {
            sortMode = e.target.checked;
            renderApp();
        });
    }

    // Modale i czyszczenie
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

// --- LOGIKA POWIADOMIEŃ ---
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

    Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
            View.showToast("Powiadomienia włączone! 🎉", "success");
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
    btn.textContent = (Notification.permission === 'granted') ? '🔔' : '🔕';
}

// --- LOGIKA: DODAWANIE ---
async function handleAdd(e) {
    e.preventDefault();
    
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
        
        // ZMIANA: Zamiast appendTaskNode, używamy renderApp.
        // Dlaczego? Jeśli jesteśmy w filtrze "Ukończone", nowe zadanie (aktywne) nie powinno się pojawić.
        if (filterMode === 'completed') {
            View.showToast("Dodano (przełącz na 'Do zrobienia' aby zobaczyć)", "success");
        } else {
            renderApp(); // To uwzględni też sortowanie
            View.showToast("Dodano zadanie!", "success");
        }

        View.renderStats(Store.calculateStats(currentTasks));
        View.resetForm();

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

    // Usuwanie
    if (e.target.closest('.delete-btn')) {
        taskToDeleteId = id;
        View.elements.dialog.showModal();
        return;
    }

    // Edycja
    if (e.target.closest('.edit-btn')) {
        const newText = prompt("Edytuj treść zadania:", task.text);
        if (newText !== null && newText.trim() !== "" && newText !== task.text) {
            try {
                currentTasks = Store.updateTaskContent(currentTasks, id, newText.trim());
                // Przy edycji wystarczy update węzła, chyba że sortujemy po nazwie (ale nie sortujemy)
                View.updateTaskNode(id, { type: 'text', value: newText.trim() });
                View.showToast("Zaktualizowano!", "success");
            } catch (err) {
                View.showToast(err.message, "error");
            }
        }
        return;
    }

    // Kalendarz
    if (e.target.closest('.calendar-btn')) {
        Helpers.downloadICS(task);
        View.showToast("Pobrano plik kalendarza", "info");
        return;
    }

    // Toggle (Zrobione/Niezrobione)
    if (e.target.closest('.todo-content') || e.target.closest('.custom-checkbox')) {
        currentTasks = Store.toggleTask(currentTasks, id);
        
        // ZMIANA: Przerysowujemy całość.
        // Jeśli mamy włączony filtr "Aktywne", to po odhaczeniu zadanie musi zniknąć.
        renderApp();
        View.renderStats(Store.calculateStats(currentTasks));
    }
}

// --- LOGIKA: USUWANIE ---
function confirmDeleteTask() {
    if (!taskToDeleteId) return;

    currentTasks = Store.removeTask(currentTasks, taskToDeleteId);
    
    // Tu też renderApp, żeby zachować spójność przy filtrach
    renderApp();
    View.renderStats(Store.calculateStats(currentTasks));
    View.showToast("Usunięto zadanie", "info");

    View.elements.dialog.close();
    taskToDeleteId = null;
}

function handleClearCompleted() {
    if (confirm("Usunąć wszystkie ukończone zadania?")) {
        currentTasks = Store.removeCompleted(currentTasks);
        renderApp();
        View.renderStats(Store.calculateStats(currentTasks));
        View.showToast("Wyczyszczono listę", "success");
    }
}

init();