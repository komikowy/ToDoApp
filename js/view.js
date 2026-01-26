// Pomocnicza funkcja
function createElement(tag, className, text = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
}

function createTodoItem(task) {
    const li = createElement('li', `todo-item ${task.done ? 'completed' : ''}`);
    li.dataset.id = task.id;

    const content = createElement('div', 'todo-content');
    const checkbox = createElement('div', 'custom-checkbox');

    const textContainer = createElement('div', 'text-container');
    const span = createElement('span', 'text', task.text);
    
    // Data
    const dateObj = new Date(task.id); 
    const dateString = dateObj.toLocaleDateString('pl-PL', {
        day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    // ZMIANA: Zamiast style.fontSize... używamy klasy CSS
    const dateSpan = createElement('span', 'date-info', dateString);

    textContainer.append(span, dateSpan);
    content.append(checkbox, textContainer);

    const btn = createElement('button', 'delete-btn', '🗑');
    btn.ariaLabel = "Usuń";

    li.append(content, btn);
    return li;
}

export const elements = {
    list: document.getElementById('todo-list'),
    input: document.getElementById('todo-input'),
    form: document.getElementById('todo-form'),
    stats: document.getElementById('stats-counter'),
    clearBtn: document.getElementById('clear-completed') 
};

export function renderList(tasks) {
    while (elements.list.firstChild) {
        elements.list.removeChild(elements.list.firstChild);
    }

    if (tasks.length === 0) {
        // ZMIANA: Używamy klasy .empty-state z CSS zamiast stylów inline
        const emptyMsg = createElement('div', 'empty-state', '🎉 Brak zadań! Odpocznij.');
        elements.list.appendChild(emptyMsg);
        return;
    }

    tasks.forEach(task => elements.list.appendChild(createTodoItem(task)));
}

export function renderStats({ total, completed }) {
    elements.stats.textContent = `${total} zadania • ${completed} ukończone`;

    if (elements.clearBtn) {
        // ZMIANA: Zamiast style.display, przełączamy klasę 'hidden'
        if (completed > 0) {
            elements.clearBtn.classList.remove('hidden'); // Pokaż
        } else {
            elements.clearBtn.classList.add('hidden');    // Ukryj
        }
    }
}

export function getInputValue() {
    return elements.input.value.trim();
}

export function clearInput() {
    elements.input.value = '';
}