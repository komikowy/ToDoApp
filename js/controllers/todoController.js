import { createTodo } from '../domain/todoRules.js';
import * as Helpers from '../utils/helpers.js';

export class TodoController {
    // WAŻNE: Dodano imageStore do konstruktora
    constructor(todoStore, uiStore, imageStore, notificationService, view) {
        // Wstrzykiwanie zależności (Dependency Injection)
        this.todoStore = todoStore;
        this.uiStore = uiStore;
        this.imageStore = imageStore; // <--- Baza zdjęć (IndexedDB)
        this.notificationService = notificationService;
        this.view = view;

        // Przekazujemy loader obrazków do widoku (dla TodoItem)
        this.view.setImageLoader(this.imageStore);

        // Bindowanie widoku
        this.view.bindAdd(this.handleAdd);
        this.view.bindListAction(this.handleListAction);
        this.view.bindFilterChange(this.handleFilter);
        this.view.bindSortChange(this.handleSort);
        this.view.bindClearCompleted(this.handleClear);
        this.view.bindNotificationToggle(this.handleNotify);
        
        // Modal potwierdzenia usuwania
        this.view.bindDialogConfirm(this.handleConfirmDelete);

        // Start
        this._refresh();
        this._updateNotifyIcon();
    }

    // --- METODY POMOCNICZE ---

    _refresh() {
        const filter = this.uiStore.getFilter();
        const sort = this.uiStore.getSort(); // true/false

        // Pobieramy wszystkie zadania
        let tasks = this.todoStore.getAll();

        // 1. Filtrowanie
        if (filter === 'active') tasks = tasks.filter(t => !t.isCompleted);
        else if (filter === 'completed') tasks = tasks.filter(t => t.isCompleted);

        // 2. Sortowanie (alfabetyczne)
        if (sort) {
            tasks.sort((a, b) => a.text.localeCompare(b.text));
        }

        // 3. Renderowanie
        this.view.render(tasks);
        
        // 4. Statystyki
        const allStats = this.todoStore.getAll();
        this.view.updateStats({
            total: allStats.length,
            completed: allStats.filter(t => t.isCompleted).length
        });
        
        // 5. Ustawienie aktywnego filtra w UI
        this.view.setActiveFilter(filter);
        this.view.setSortToggle(sort);
    }

    _updateNotifyIcon() {
        if (this.notificationService.isSupported()) {
            const granted = this.notificationService.hasPermission();
            this.view.updateNotifyIcon(granted);
        }
    }

    // --- HANDLERY ZDARZEŃ ---

    // Nowoczesny handler dodawania (IndexedDB + UUID)
    handleAdd = async ({ text, date, file }) => {
        try {
            let imageId = null;

            // 1. Jeśli jest plik, zapisz go w IndexedDB i weź ID
            if (file) {
                this.view.showToast("Zapisywanie zdjęcia...", "info");
                imageId = await this.imageStore.saveImage(file);
            }

            // 2. Logika Biznesowa (Store)
            // ⚠️ FIX: Zamieniamy pusty string "" na null, żeby nie psuć daty
            const cleanDate = date ? date : null;

            const newTask = createTodo(text, cleanDate, imageId);
            this.todoStore.add(newTask);
            
            // 3. Logika Powiadomień (Service)
            this.notificationService.schedule(newTask);
            
            // 4. Feedback UI
            this.view.showToast("Zadanie dodane!", "success");
            this.view.resetForm();
            this._refresh();

        } catch (error) {
            console.error(error);
            this.view.showToast("Błąd: " + error.message, "error");
        }
    };

    handleListAction = (action, id) => {
        // ID jest teraz stringiem (UUID), więc nie rzutujemy na Number
        switch (action) {
            case 'delete':
                this.uiStore.setTaskToDelete(id); // Zapisujemy, co chcemy usunąć
                this.view.showDialog();
                break;

            case 'toggle':
                this.todoStore.toggle(id);
                this._refresh();
                break;

            case 'edit':
                const task = this.todoStore.getAll().find(t => t.id === id);
                if (task) {
                    const newText = prompt("Edytuj treść:", task.text);
                    if (newText && newText.trim() !== task.text) {
                        this.todoStore.updateText(id, newText.trim());
                        this.view.showToast("Zaktualizowano", "success");
                        this._refresh();
                    }
                }
                break;

            case 'calendar':
                const t = this.todoStore.getAll().find(item => item.id === id);
                
                if (!t) {
                    this.view.showToast("Nie znaleziono zadania", "error");
                    return;
                }

                // Sprawdzamy datę PRZED wywołaniem helpera
                if (t.dueDate) {
                    Helpers.downloadICS(t);
                    this.view.showToast("Pobrano plik kalendarza 📅", "success");
                } else {
                    this.view.showToast("Ustaw datę, aby dodać do kalendarza!", "info");
                }
                break;
        }
    };

    handleConfirmDelete = async () => {
        const id = this.uiStore.getTaskToDelete();
        if (!id) return;

        try {
            // 1. Znajdź zadanie, żeby sprawdzić czy ma obrazek
            const task = this.todoStore.getAll().find(t => t.id === id);
            
            // 2. Jeśli ma obrazek -> usuń go z IndexedDB
            if (task && task.file) {
                await this.imageStore.deleteImage(task.file);
            }

            // 3. Usuń zadanie z LocalStorage
            this.todoStore.remove(id);
            
            // 4. Sprzątanie UI
            this.uiStore.clearTaskToDelete();
            this.view.showToast("Usunięto zadanie", "info");
            this.view.closeDialog();
            this._refresh();
        } catch (e) {
            console.error(e);
            this.view.showToast("Błąd podczas usuwania", "error");
        }
    };

    handleFilter = (filter) => {
        this.uiStore.setFilter(filter);
        this._refresh();
    };

    handleSort = (isSorted) => {
        this.uiStore.setSort(isSorted);
        this._refresh();
    };

    handleClear = async () => {
        if (confirm("Usunąć wszystkie ukończone zadania?")) {
            try {
                // 1. Znajdź wszystkie ukończone zadania
                const completedTasks = this.todoStore.getAll().filter(t => t.isCompleted);
                
                // 2. Usuń ich obrazki z IndexedDB (równolegle)
                const imageDeletionPromises = completedTasks
                    .filter(t => t.file)
                    .map(t => this.imageStore.deleteImage(t.file));
                
                await Promise.all(imageDeletionPromises);

                // 3. Wyczyść LocalStorage
                this.todoStore.clearCompleted();
                
                this.view.showToast("Wyczyszczono ukończone", "success");
                this._refresh();
            } catch (e) {
                console.error(e);
                this.view.showToast("Błąd czyszczenia danych", "error");
            }
        }
    };

    handleNotify = async () => {
        if (!this.notificationService.isSupported()) {
            this.view.showToast("Powiadomienia nie są wspierane", "error");
            return;
        }

        try {
            if (this.notificationService.hasPermission()) {
                this.view.showToast("Powiadomienia są już aktywne ✅", "info");
                return;
            }

            const permission = await this.notificationService.requestPermission();
            this._updateNotifyIcon();

            if (permission === 'granted') {
                this.view.showToast("Powiadomienia włączone! 🎉", "success");
            } else {
                this.view.showToast("Brak zgody na powiadomienia", "info");
            }
        } catch (e) {
            this.view.showToast("Błąd uprawnień: " + e.message, "error");
        }
    };
}