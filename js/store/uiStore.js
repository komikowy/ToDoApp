export class UIStore {
    constructor() {
        this.filter = 'all'; // all, active, completed
        this.sort = false;   // true = A-Z, false = domyślne
        this.taskToDelete = null;
    }

    getFilter() { return this.filter; }
    setFilter(f) { this.filter = f; }

    getSort() { return this.sort; }
    setSort(s) { this.sort = s; }

    getTaskToDelete() { return this.taskToDelete; }
    setTaskToDelete(id) { this.taskToDelete = id; }
    clearTaskToDelete() { this.taskToDelete = null; }
}