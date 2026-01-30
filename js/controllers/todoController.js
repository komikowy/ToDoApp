import * as Helpers from '../utils/helpers.js';
import { Router } from '../utils/router.js';

export class TodoController {
    constructor(todoStore, uiStore, notificationService, view) {
        // Wstrzykiwanie zależności (Dependency Injection)
        this.todoStore = todoStore;
        this.uiStore = uiStore;
        this.notificationService = notificationService;
        this.view = view;

        // Bindowanie widoku
        this.view.bindAdd(this.handleAdd);
        this.view.bindListAction(this.handleListAction);
        this.view.bindFilterChange(this.handleFilter);
        this.view.bindSortChange(this.handleSort);
        this.view.bindClearCompleted(this.handleClear);
        this.view.bindNotificationToggle(this.handleNotify);
        this.view.bindDialogConfirm(this.handleConfirmDelete);

        // Router (hash-based)
        this.router = new Router({
            '/': () => this._applyRoute({ filter: 'all' }),
            '/filter/:filter': (params, query) => this._applyRoute({ filter: params.filter, sort: query.sort }),
            '/task/:id': (params) => this._openTask(Number(params.id))
        }, { mode: 'hash' });
        this.router.start();

        // Start (will be synced by router on load)
        this._updateNotifyIcon();
    }

    // --- METODY POMOCNICZE ---

    _applyRoute = ({ filter = 'all', sort } = {}) => {
        // Apply filter from route
        if (filter) {
            this.uiStore.setFilter(filter);
            this.view.setActiveFilter(filter);
        }

        // Apply sort from query (if provided)
        if (typeof sort !== 'undefined') {
            const isSorted = (sort === '1' || sort === 'true');
            this.uiStore.setSort(isSorted);
            this.view.setSortToggle(isSorted);
        } else {
            // ensure UI reflects current store
            this.view.setSortToggle(this.uiStore.getSort());
        }

        this._refresh();
    };

    _openTask = (id) => {
        const task = this.todoStore.getAll().find(t => t.id === id);
        if (task) {
            // TODO: replace with modal in the future; lightweight handler for deep link
            alert(`Zadanie: ${task.text}`);
        }
    };

    _refresh() {
        // 1. Pobierz stan UI
        const filter = this.uiStore.getFilter();
        const sort = this.uiStore.getSort();

        // 2. Pobierz dane biznesowe wg kryteriów UI
        const tasks = this.todoStore.getFiltered(filter, sort);

        // 3. Wyświetl
        this.view.render(tasks);
        this.view.updateStats(this.todoStore.getStats());
    }

    _updateNotifyIcon() {
        const granted = this.notificationService.hasPermission();
        this.view.updateNotifyIcon(granted);
    }

    // --- HANDLERY ZDARZEŃ ---

    handleAdd = async ({ text, date, file }) => {
        try {
            let imageBase64 = null;
            if (file) {
                this.view.showToast("Przetwarzanie zdjęcia...", "info");
                imageBase64 = await Helpers.fileToBase64(file);
            }

            // 1. Logika Biznesowa (Store)
            const newTask = this.todoStore.add({ text, image: imageBase64, dueDate: date });
            
            // 2. Logika Powiadomień (Service)
            this.notificationService.schedule(newTask);
            
            // 3. Logika UI (View/Toast)
            const currentFilter = this.uiStore.getFilter();
            if (currentFilter === 'completed') {
                this.view.showToast("Dodano (widoczne w 'Do zrobienia')", "success");
            } else {
                this.view.showToast("Dodano zadanie!", "success");
            }
            
            this.view.resetForm();
            this._refresh();

        } catch (error) {
            this.view.showToast(error.message, "error");
        }
    };

    handleListAction = (action, id) => {
        switch (action) {
            case 'delete':
                this.uiStore.setTaskToDelete(id); // Zapisujemy stan w UIStore
                this.view.showDialog();
                break;

            case 'toggle':
                this.todoStore.toggle(id);
                this._refresh();
                break;

            case 'edit':
                const task = this.todoStore.getAll().find(t => t.id === id);
                const newText = prompt("Edytuj:", task.text); // Tu można by dodać modal service
                if (newText && newText.trim() !== task.text) {
                    try {
                        this.todoStore.updateText(id, newText.trim());
                        this.view.showToast("Zaktualizowano", "success");
                        this._refresh();
                    } catch(e) {
                        this.view.showToast(e.message, "error");
                    }
                }
                break;

            case 'calendar':
                const t = this.todoStore.getAll().find(item => item.id === id);
                Helpers.downloadICS(t);
                this.view.showToast("Pobrano ICS", "info");
                break;
        }
    };

    handleConfirmDelete = () => {
        const id = this.uiStore.getTaskToDelete(); // Pobieramy ID z UIStore
        if (id) {
            this.todoStore.remove(id);
            this.uiStore.clearTaskToDelete();
            
            this.view.showToast("Usunięto", "info");
            this.view.closeDialog();
            this._refresh();
        }
    };

    handleFilter = (filter) => {
        // Update URL & state (router will re-apply the route)
        const sort = this.uiStore.getSort() ? 1 : 0;
        this.router.navigateTo(`/filter/${filter}`, { sort });
    };

    handleSort = (isSorted) => {
        this.uiStore.setSort(isSorted);
        // Update current route query param so URL reflects sort
        const filter = this.uiStore.getFilter() || 'all';
        this.router.navigateTo(`/filter/${filter}`, { sort: isSorted ? 1 : 0 });
        this._refresh();
    };

    handleClear = () => {
        if (confirm("Usunąć ukończone?")) {
            this.todoStore.removeCompleted();
            this.view.showToast("Wyczyszczono", "success");
            this._refresh();
        }
    };

    handleNotify = async () => {
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
            this.view.showToast(e.message, "error");
        }
    };
}
