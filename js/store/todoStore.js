const STORAGE_KEY = 'todo_app_pro_v4'; // Nowa wersja klucza

export class TodoStore {
    constructor() {
        this.tasks = this._load();
    }

    _load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Błąd ładowania danych", e);
            return [];
        }
    }

    _save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
    }

    // --- API ---
    getAll() { return [...this.tasks]; }

    add(task) {
        this.tasks.unshift(task); // Dodaj na początek
        this._save();
    }

    remove(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this._save();
    }

    toggle(id) {
        this.tasks = this.tasks.map(t => 
            t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
        );
        this._save();
    }

    updateText(id, newText) {
        this.tasks = this.tasks.map(t => 
            t.id === id ? { ...t, text: newText } : t
        );
        this._save();
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.isCompleted);
        this._save();
    }
}