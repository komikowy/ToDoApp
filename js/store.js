const STORAGE_KEY = 'secure_tasks_v1';

export function getTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Błąd danych LocalStorage", e);
        return [];
    }
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addTask(tasks, text) {
    const newTask = {
        id: Date.now(),
        text: text,
        done: false
    };
    const updated = [newTask, ...tasks];
    saveTasks(updated);
    return updated;
}

export function removeTask(tasks, id) {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
    return updated;
}

export function toggleTask(tasks, id) {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    saveTasks(updated);
    return updated;
}

export function calculateStats(tasks) {
    return {
        total: tasks.length,
        completed: tasks.filter(t => t.done).length
    };
}

export function removeCompleted(tasks) {
    const updated = tasks.filter(task => !task.done);
    // Używamy wewnętrznej funkcji zapisu (jeśli jej nie eksportowałeś, 
    // to musisz użyć localStorage bezpośrednio jak poniżej)
    localStorage.setItem('secure_tasks_v1', JSON.stringify(updated)); 
    return updated;
}