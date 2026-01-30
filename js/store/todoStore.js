import { createTodo } from '../domain/todoRules.js';

const STORAGE_KEY = 'pro_todo_v3';

export class TodoStore {
    constructor() {
        this.tasks = this._load();
    }

    _load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Store Load Error", e);
            return [];
        }
    }

   _save() {
    try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.todos));
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            throw new Error("Pamięć pełna! Nie można zapisać zdjęcia. Usuń stare zadania.");
        } else {
            throw new Error("Błąd zapisu danych.");
        }
    }
    
}

    // --- API ---

    getAll() {
        return [...this.tasks];
    }

    getFiltered(filterMode, sortMode) {
        let result = [...this.tasks];

        if (filterMode === 'active') result = result.filter(t => !t.done);
        if (filterMode === 'completed') result = result.filter(t => t.done);

        if (sortMode) {
            result.sort((a, b) => Number(a.done) - Number(b.done));
        } else {
            result.sort((a, b) => b.id - a.id);
        }
        return result;
    }

    add({ text, image, dueDate }) {
        const todo = createTodo(text, image, dueDate);
        this.tasks = [todo, ...this.tasks];
        this._save();
        return todo;
    }

    remove(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this._save();
    }

    toggle(id) {
        this.tasks = this.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
        this._save();
    }

    updateText(id, newText) {
        this.tasks = this.tasks.map(t => t.id === id ? { ...t, text: newText } : t);
        this._save();
    }

    removeCompleted() {
        this.tasks = this.tasks.filter(t => !t.done);
        this._save();
    }
    
    getStats() {
        return {
            total: this.tasks.length,
            completed: this.tasks.filter(t => t.done).length
        };
    }
}
