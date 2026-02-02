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
        this.view.bindDialogConfirm(this.handleConfirmDelete);

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

    /**
     * Obsługa dodawania zadania z ulepszoną odpornością na błędy.
     * Reset formularza następuje TYLKO po pełnym sukcesie.
     */
    handleAdd = async ({ text, date, file }) => {
        try {
            let imageId = null;
            if (file && file instanceof File) {
                this.view.showToast("Zapisywanie zdjęcia...", "info");
                try {
                    // Próba zapisu do IndexedDB
                    imageId = await this.imageStore.saveImage(file);
                } catch (e) {
                    console.error("Image Save Error:", e);
                    // Rzucamy błąd dalej, aby zatrzymać proces dodawania zadania
                    throw new Error("Błąd zapisu zdjęcia. Zadanie nie zostało dodane.");
                }
            }

            const cleanDate = date ? date : null;
            const newTask = createTodo(text, cleanDate, imageId);
            
            this.todoStore.add(newTask);
            this.notificationService.schedule(newTask);
            
            this.view.showToast("Dodano!", "success");
            this.view.resetForm(); // Sukces - czyścimy formularz
            this._refresh();
        } catch (e) {
            // Błąd - dane zostają w polach formularza, użytkownik widzi komunikat
            this.view.showToast(e.message, "error");
        }
    };

    handleListAction = (action, id) => {
        if (action === 'delete') {
            this.uiStore.setTaskToDelete(id);
            this.view.showDialog();
        } else if (action === 'toggle') {
            this.todoStore.toggle(id);
            this._refresh();
        } else if (action === 'edit') {
            const t = this.todoStore.getAll().find(x => x.id === id);
            const txt = prompt("Edytuj:", t.text);
            if (txt && txt.trim()) {
                this.todoStore.updateText(id, txt.trim());
                this._refresh();
            }
        } else if (action === 'calendar') {
            const t = this.todoStore.getAll().find(x => x.id === id);
            if(t && t.dueDate) {
                Helpers.downloadICS(t); 
                this.view.showToast("Pobrano ICS", "success");
            }
        }
    };

    /**
     * Potwierdzenie usuwania z obsługą błędów asynchronicznych.
     */
    handleConfirmDelete = async () => {
        const id = this.uiStore.getTaskToDelete();
        if (!id) return;

        try {
            const t = this.todoStore.getAll().find(x => x.id === id);
            // Jeśli zadanie miało zdjęcie, usuwamy je z IndexedDB
            if (t && t.file) {
                await this.imageStore.deleteImage(t.file);
            }
            
            this.todoStore.remove(id);
            this.uiStore.clearTaskToDelete();
            this.view.closeDialog();
            this.view.showToast("Usunięto", "info");
            this._refresh();
        } catch (e) {
            console.error("Delete Error:", e);
            this.view.showToast("Nie udało się usunąć zadania z bazy.", "error");
        }
    };

    /**
     * Masowe czyszczenie z asynchronicznym usuwaniem mediów.
     */
    handleClear = async () => {
        if (confirm("Wyczyścić ukończone?")) {
            try {
                const done = this.todoStore.getAll().filter(t => t.isCompleted);
                for (const t of done) {
                    if (t.file) {
                        await this.imageStore.deleteImage(t.file);
                    }
                }
                
                this.todoStore.clearCompleted();
                this._refresh();
            } catch (e) {
                console.error("Clear Error:", e);
                this.view.showToast("Błąd podczas czyszczenia mediów.", "error");
            }
        }
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