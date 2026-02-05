import { createTodo } from '../domain/todoRules.js';
import * as Helpers from '../helpers.js'; 

export class TodoController {
    constructor(todoStore, uiStore, imageStore, notificationService, view) {
        this.todoStore = todoStore;
        this.uiStore = uiStore;
        this.imageStore = imageStore;
        this.notificationService = notificationService;
        this.view = view;

        this.view.setImageLoader(this.imageStore);

        this.view.bindAdd(this.handleAdd);
        this.view.bindListAction(this.handleListAction);
        this.view.bindFilterChange(this.handleFilter);
        this.view.bindSortChange(this.handleSort);
        this.view.bindClearCompleted(this.handleClear);
        this.view.bindNotificationToggle(this.handleNotify);
        
        // ZMIANA NAZWY: Metoda obsługuje teraz różne akcje (delete/clear/edit)
        this.view.bindDialogConfirm(this.handleConfirmAction);

        this._refresh();
        this._updateNotify();
    }

    _refresh() {
        const filter = this.uiStore.getFilter();
        const sort = this.uiStore.getSort();
        let tasks = this.todoStore.getAll();

        if (filter === 'active') tasks = tasks.filter(t => !t.isCompleted);
        else if (filter === 'completed') tasks = tasks.filter(t => t.isCompleted);

        if (sort) tasks.sort((a, b) => a.text.localeCompare(b.text));

        this.view.render(tasks);
        
        const all = this.todoStore.getAll();
        this.view.updateStats({
            total: all.length,
            completed: all.filter(t => t.isCompleted).length
        });
        
        this.view.setActiveFilter(filter);
        this.view.setSortToggle(sort);
    }

    _updateNotify() {
        if(this.notificationService.isSupported()) 
            this.view.updateNotifyIcon(this.notificationService.hasPermission());
    }

    handleAdd = async ({ text, date, file }) => {
        try {
            let imageId = null;
            if (file && file instanceof File) {
                this.view.showToast("Zapisywanie zdjęcia...", "info");
                try {
                    imageId = await this.imageStore.saveImage(file);
                } catch (e) {
                    console.error("Image Save Error:", e);
                    throw new Error("Błąd zapisu zdjęcia. Zadanie nie zostało dodane.");
                }
            }

            const cleanDate = date ? date : null;
            const newTask = createTodo(text, cleanDate, imageId);
            
            this.todoStore.add(newTask);
            this.notificationService.schedule(newTask);
            
            this.view.showToast("Dodano!", "success");
            this.view.resetForm();
            this._refresh();
        } catch (e) {
            this.view.showToast(e.message, "error");
        }
    };

    /**
     * Obsługa akcji listy: Usuwanie (modal), Edycja (modal z inputem), Toggle, Kalendarz
     */
    handleListAction = (action, id) => {
        // 1. USUWANIE
        if (action === 'delete') {
            this.uiStore.setTaskToDelete(id);
            this.uiStore.setConfirmAction('delete');
            // showDialog(tytuł, opis, inputVal, przyciskTxt)
            this.view.showDialog("Usunąć zadanie?", "To zadanie zniknie na zawsze.", null, "Usuń");
        } 
        // 2. EDYCJA (ZMIANA: Zamiast prompt() otwieramy modal)
        else if (action === 'edit') {
            const t = this.todoStore.getAll().find(x => x.id === id);
            if (t) {
                this.uiStore.setTaskToEdit(id); // Zapisujemy ID edytowanego
                this.uiStore.setConfirmAction('edit'); // Ustawiamy tryb
                // Otwieramy modal z obecnym tekstem w inpucie
                this.view.showDialog("Edytuj zadanie", "Wprowadź nową treść:", t.text, "Zapisz");
            }
        } 
        // 3. POZOSTAŁE
        else if (action === 'toggle') {
            this.todoStore.toggle(id);
            this._refresh();
        } else if (action === 'calendar') {
            const t = this.todoStore.getAll().find(x => x.id === id);
            if(t && t.dueDate) {
                Helpers.downloadICS(t); 
                this.view.showToast("Pobrano ICS", "success");
            }
        }
    };

    /**
     * ZMIANA: Główny handler zatwierdzania modala (obsługuje Delete, Edit i Clear)
     */
    handleConfirmAction = async () => {
        const action = this.uiStore.getConfirmAction();

        // Przypadek A: Usuwanie jednego zadania
        if (action === 'delete') {
            const id = this.uiStore.getTaskToDelete();
            if (id) {
                try {
                    const t = this.todoStore.getAll().find(x => x.id === id);
                    if (t && t.file) await this.imageStore.deleteImage(t.file);
                    
                    this.todoStore.remove(id);
                    this.view.showToast("Usunięto zadanie", "info");
                } catch (e) {
                    console.error(e);
                    this.view.showToast("Błąd usuwania", "error");
                }
            }
        } 
        // NOWOŚĆ: Przypadek B: Zatwierdzenie edycji
        else if (action === 'edit') {
            const id = this.uiStore.getTaskToEdit();
            const newText = this.view.getDialogInputValue(); // Pobieramy tekst z widoku

            if (id && newText) {
                // Tu można dodać walidację (np. długość tekstu)
                this.todoStore.updateText(id, newText);
                this.view.showToast("Zapisano zmiany", "success");
            }
        }
        // Przypadek C: Czyszczenie ukończonych
        else if (action === 'clear') {
            try {
                const done = this.todoStore.getAll().filter(t => t.isCompleted);
                for (const t of done) {
                    if (t.file) await this.imageStore.deleteImage(t.file);
                }
                
                this.todoStore.clearCompleted();
                this.view.showToast("Wyczyszczono ukończone!", "success");
            } catch (e) {
                console.error("Clear Error:", e);
                this.view.showToast("Błąd czyszczenia mediów.", "error");
            }
        }

        // Wspólne sprzątanie po akcji
        this.uiStore.clearTaskToDelete();
        this.uiStore.clearTaskToEdit(); // Czyścimy ID edycji
        this.uiStore.setConfirmAction(null);
        this.view.closeDialog();
        this._refresh();
    };

    /**
     * Otwiera modal potwierdzenia czyszczenia
     */
    handleClear = () => {
        const hasCompleted = this.todoStore.getAll().some(t => t.isCompleted);
        if (!hasCompleted) {
            this.view.showToast("Brak ukończonych zadań.", "info");
            return;
        }

        this.uiStore.setConfirmAction('clear');
        this.view.showDialog("Wyczyścić ukończone?", "Wszystkie zrobione zadania zostaną trwale usunięte.", null, "Wyczyść");
    };

    handleFilter = (f) => { this.uiStore.setFilter(f); this._refresh(); };
    handleSort = (s) => { this.uiStore.setSort(s); this._refresh(); };
    
    handleNotify = async () => {
        try {
            const res = await this.notificationService.requestPermission();
            this._updateNotify();
            if(res === 'granted') this.view.showToast("Włączono!", "success");
        } catch (e) {
            console.error("Notification Error:", e);
            this.view.showToast("Błąd powiadomień.", "error");
        }
    };
}