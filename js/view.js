// Pomocnicza funkcja (Security & Helpers)
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

    // --- NOWOŚĆ: Kontener na tekst i datę ---
    // Dzięki temu data jest ładnie pod tekstem
    const textContainer = createElement('div', 'text-container');
    
    // Treść zadania
    const span = createElement('span', 'text', task.text);
    
    // Data dodania (formatujemy timestamp z ID)
    const dateObj = new Date(task.id); 
    const dateString = dateObj.toLocaleDateString('pl-PL', {
        day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const dateSpan = createElement('span', 'date-info', dateString);
    // Style dla daty (można przenieść do CSS, ale tu działają od ręki)
    dateSpan.style.fontSize = '0.75rem';
    dateSpan.style.color = '#888';
    dateSpan.style.marginTop = '2px';
    dateSpan.style.display = 'block';

    // Składamy tekst i datę w jeden klocek
    textContainer.append(span, dateSpan);
    
    // Składamy lewą stronę (checkbox + teksty)
    content.append(checkbox, textContainer);

    // Przycisk usuwania
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
    // --- NOWOŚĆ: Uchwyt do przycisku czyszczenia ---
    // Upewnij się, że dodałeś ten przycisk w HTML z id="clear-completed"
    clearBtn: document.getElementById('clear-completed') 
};

export function renderList(tasks) {
    // 1. Wyczyść listę
    while (elements.list.firstChild) {
        elements.list.removeChild(elements.list.firstChild);
    }

    // --- NOWOŚĆ: Empty State (Gdy lista pusta) ---
    if (tasks.length === 0) {
        const emptyMsg = createElement('div', 'empty-state', '🎉 Brak zadań! Odpocznij.');
        // Style dla komunikatu
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '40px 0';
        emptyMsg.style.color = '#aaa';
        emptyMsg.style.fontStyle = 'italic';
        
        elements.list.appendChild(emptyMsg);
        return; // Kończymy funkcję, nie rysujemy pętli
    }

    // 2. Rysuj zadania jeśli są
    tasks.forEach(task => elements.list.appendChild(createTodoItem(task)));
}

export function renderStats({ total, completed }) {
    elements.stats.textContent = `${total} zadania • ${completed} ukończone`;

    // --- NOWOŚĆ: Pokazywanie/Ukrywanie przycisku "Usuń ukończone" ---
    // Jeśli element istnieje w HTML (bo mogłeś go jeszcze nie dodać), obsłuż go:
    if (elements.clearBtn) {
        if (completed > 0) {
            elements.clearBtn.style.display = 'block';
        } else {
            elements.clearBtn.style.display = 'none';
        }
    }
}

export function getInputValue() {
    return elements.input.value.trim();
}

export function clearInput() {
    elements.input.value = '';
}