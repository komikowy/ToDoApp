export class UIStore {
    constructor() {
        this.filter = 'all'; // all, active, completed
        this.sort = false;   // true = A-Z, false = domyślne
        
        // Stan modalu potwierdzenia i edycji
        this.taskToDelete = null;   // ID zadania (przy usuwaniu)
        this.taskToEdit = null;     // NOWOŚĆ: ID zadania (przy edycji)
        this.confirmAction = null;  // Rodzaj akcji: 'delete' | 'clear' | 'edit' | null
    }

    // --- API ---

    getFilter() { return this.filter; }
    setFilter(f) { this.filter = f; }

    getSort() { return this.sort; }
    setSort(s) { this.sort = s; }

    // Zarządzanie usuwanym zadaniem
    getTaskToDelete() { return this.taskToDelete; }
    setTaskToDelete(id) { this.taskToDelete = id; }
    clearTaskToDelete() { this.taskToDelete = null; }

    // NOWOŚĆ: Zarządzanie edytowanym zadaniem
    getTaskToEdit() { return this.taskToEdit; }
    setTaskToEdit(id) { this.taskToEdit = id; }
    clearTaskToEdit() { this.taskToEdit = null; }

    // Zarządzanie typem akcji w modalu
    getConfirmAction() { return this.confirmAction; }
    setConfirmAction(action) { this.confirmAction = action; }
}