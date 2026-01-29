import * as Helpers from '../helpers.js';

export class TodoController {
    constructor(store, view) {
        this.store = store;
        this.view = view;

        this.filterMode = 'all';
        this.sortMode = false;
        this.taskToDeleteId = null;

        // Bindowanie widoku z metodami kontrolera
        // Używamy Arrow Functions, żeby nie zgubić 'this'
        this.view.bindAdd(this.handleAdd);
        this.view.bindListAction(this.handleListAction);
        this.view.bindFilterChange(this.handleFilter);
        this.view.bindSortChange(this.handleSort);
        this.view.bindClearCompleted(this.handleClear);
        this.view.bindNotificationToggle(this.handleNotify);
        this.view.bindDialogConfirm(this.handleConfirmDelete);

        // Start aplikacji
        this._refresh();
        this._checkNotify();
    }

    _refresh() {
        const tasks = this.store.getFiltered(this.filterMode, this.sortMode);
        this.view.render(tasks);
        this.view.updateStats(this.store.getStats());
    }

    _checkNotify() {
        if ("Notification" in window) {
            this.view.updateNotifyIcon(Notification.permission === 'granted');
        }
    }

    handleAdd = async ({ text, date, file }) => {
        try {
            let imageBase64 = null;
            if (file) {
                this.view.showToast("Przetwarzanie zdjęcia...", "info");
                imageBase64 = await Helpers.fileToBase64(file);
            }

            const newTask = this.store.add({ text, image: imageBase64, dueDate: date });
            
            // Jeśli filtr ukrywa nowe zadanie, poinformuj
            if (this.filterMode === 'completed') {
                this.view.showToast("Dodano (widoczne w 'Do zrobienia')", "success");
            } else {
                this.view.showToast("Dodano zadanie!", "success");
            }
            
            this.view.resetForm();
            this._refresh();
            Helpers.scheduleNotification(newTask);

        } catch (error) {
            this.view.showToast(error.message, "error");
        }
    };

    handleListAction = (action, id) => {
        if (action === 'delete') {
            this.taskToDeleteId = id;
            this.view.showDialog();
        } 
        else if (action === 'toggle') {
            this.store.toggle(id);
            this._refresh();
        }
        else if (action === 'edit') {
            const task = this.store.getAll().find(t => t.id === id);
            const newText = prompt("Edytuj:", task.text);
            if (newText && newText.trim() !== task.text) {
                try {
                    // Walidacja jest w Store -> Domain, więc jak rzuci błędem, to go złapiemy
                    this.store.updateText(id, newText.trim());
                    this.view.showToast("Zaktualizowano", "success");
                    this._refresh();
                } catch(e) {
                    this.view.showToast(e.message, "error");
                }
            }
        }
        else if (action === 'calendar') {
            const task = this.store.getAll().find(t => t.id === id);
            Helpers.downloadICS(task);
            this.view.showToast("Pobrano ICS", "info");
        }
    };

    handleConfirmDelete = () => {
        if (this.taskToDeleteId) {
            this.store.remove(this.taskToDeleteId);
            this.view.showToast("Usunięto", "info");
            this._refresh();
            this.view.closeDialog();
            this.taskToDeleteId = null;
        }
    };

    handleFilter = (filter) => {
        this.filterMode = filter;
        this._refresh();
    };

    handleSort = (isSorted) => {
        this.sortMode = isSorted;
        this._refresh();
    };

    handleClear = () => {
        if (confirm("Usunąć ukończone?")) {
            this.store.removeCompleted();
            this.view.showToast("Wyczyszczono", "success");
            this._refresh();
        }
    };

    handleNotify = () => {
        if (!("Notification" in window)) return;
        
        Notification.requestPermission().then(permission => {
            this.view.updateNotifyIcon(permission === 'granted');
            if(permission === 'granted') {
                this.view.showToast("Powiadomienia włączone!", "success");
            }
        });
    };
}