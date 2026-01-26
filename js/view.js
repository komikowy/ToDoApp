// Pomocnicza funkcja (Security)
function createElement(tag, className, text = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text; // Bezpieczne wstawianie tekstu
    return el;
}

function createTodoItem(task) {
    const li = createElement('li', `todo-item ${task.done ? 'completed' : ''}`);
    li.dataset.id = task.id;

    const content = createElement('div', 'todo-content');
    const checkbox = createElement('div', 'custom-checkbox');
    const span = createElement('span', 'text', task.text);

    content.append(checkbox, span);

    const btn = createElement('button', 'delete-btn', '🗑');
    btn.ariaLabel = "Usuń";

    li.append(content, btn);
    return li;
}

export const elements = {
    list: document.getElementById('todo-list'),
    input: document.getElementById('todo-input'),
    form: document.getElementById('todo-form'),
    stats: document.getElementById('stats-counter')
};

export function renderList(tasks) {
    while (elements.list.firstChild) {
        elements.list.removeChild(elements.list.firstChild);
    }
    tasks.forEach(task => elements.list.appendChild(createTodoItem(task)));
}

export function renderStats({ total, completed }) {
    elements.stats.textContent = `${total} zadania • ${completed} ukończone`;
}

export function getInputValue() {
    return elements.input.value.trim();
}

export function clearInput() {
    elements.input.value = '';
}