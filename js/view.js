// --- IMPORTY POMOCNICZE ---
// Zakładam, że helpers.js istnieje (stworzymy go w kolejnym kroku, jeśli go nie masz)
// Jeśli jeszcze go nie masz, kod zadziała, ale przycisk kalendarza nie zareaguje.

export const elements = {
    list: document.getElementById('todo-list'),
    input: document.getElementById('todo-input'),
    dateInput: document.getElementById('todo-date'), // NOWOŚĆ
    fileInput: document.getElementById('todo-image'), // NOWOŚĆ
    form: document.getElementById('todo-form'),
    stats: document.getElementById('stats-counter'),
    clearBtn: document.getElementById('clear-completed'),
    
    // NOWE ELEMENTY UI
    dialog: document.getElementById('confirm-dialog'),
    dialogConfirmBtn: document.getElementById('dialog-confirm'),
    dialogCancelBtn: document.getElementById('dialog-cancel'),
    toastContainer: document.getElementById('toast-container')
};

// --- SYSTEM POWIADOMIEŃ (TOAST) ---
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto usuwanie po 3 sekundach
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// --- TWORZENIE ELEMENTU (Core Logic) ---
// Ta funkcja buduje HTML bezpiecznie, bez innerHTML
function createTodoItem(task) {
    const li = document.createElement('li');
    li.className = `todo-item ${task.done ? 'completed' : ''}`;
    li.dataset.id = task.id;

    // 1. Kontener treści (lewa strona)
    const content = document.createElement('div');
    content.className = 'todo-content';

    // Checkbox
    const checkbox = document.createElement('div');
    checkbox.className = 'custom-checkbox';

    // Tekst i Data
    const textContainer = document.createElement('div');
    textContainer.className = 'text-container';

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = task.text; // Bezpieczne wstawianie tekstu!

    textContainer.appendChild(span);

    // Data wykonania (jeśli użytkownik wybrał)
    if (task.dueDate) {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date-info';
        const formattedDate = new Date(task.dueDate).toLocaleString('pl-PL', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        dateSpan.textContent = `📅 ${formattedDate}`;
        textContainer.appendChild(dateSpan);
    }

    // Składanie lewej strony
    content.appendChild(checkbox);
    content.appendChild(textContainer);

    // Zdjęcie (jeśli jest)
    if (task.image) {
        const img = document.createElement('img');
        img.src = task.image;
        img.className = 'img-preview';
        img.alt = 'Załącznik';
        img.title = 'Kliknij, aby powiększyć';
        // Prosty podgląd w nowej karcie
        img.onclick = (e) => {
            e.stopPropagation();
            const win = window.open();
            win.document.write(`<img src="${task.image}" style="max-width:100%">`);
        };
        content.appendChild(img);
    }

    // 2. Kontener akcji (prawa strona - przyciski)
    const actions = document.createElement('div');
    actions.className = 'actions';

    // Helper do tworzenia przycisków
    const createBtn = (cls, icon, title) => {
        const btn = document.createElement('button');
        btn.className = `action-btn ${cls}`;
        btn.textContent = icon;
        btn.title = title;
        return btn;
    };

    // Przycisk Kalendarza (tylko jeśli jest data)
    if (task.dueDate) {
        actions.appendChild(createBtn('calendar-btn', '📆', 'Pobierz do kalendarza'));
    }

    // Edycja i Usuwanie
    actions.appendChild(createBtn('edit-btn', '✏️', 'Edytuj'));
    actions.appendChild(createBtn('delete-btn', '🗑', 'Usuń'));

    // Składanie całości
    li.appendChild(content);
    li.appendChild(actions);

    return li;
}

// --- OPTYMALIZACJA RENDEROWANIA ---

// Renderuje całą listę (używa DocumentFragment dla wydajności)
export function renderFullList(tasks) {
    elements.list.innerHTML = ''; // Czyścimy listę
    
    if (tasks.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = '🎉 Brak zadań! Odpocznij.';
        elements.list.appendChild(emptyMsg);
        return;
    }

    // Fragment to "wirtualny kontener" - wrzucenie go do DOM wywołuje render tylko raz
    const fragment = document.createDocumentFragment();
    
    tasks.forEach(task => {
        fragment.appendChild(createTodoItem(task));
    });

    elements.list.appendChild(fragment);
}

// Dodaje pojedyncze zadanie na górę (bez przerysowywania całej listy)
export function appendTaskNode(task) {
    // Usuń komunikat "Brak zadań" jeśli istnieje
    const emptyState = elements.list.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const li = createTodoItem(task);
    elements.list.prepend(li); // Dodaj na początek
}

// Usuwa pojedyncze zadanie z DOM
export function removeTaskNode(id) {
    const item = elements.list.querySelector(`.todo-item[data-id="${id}"]`);
    if (item) {
        // Opcjonalnie: prosta animacja wyjścia
        item.style.opacity = '0';
        setTimeout(() => item.remove(), 200);
    }
    
    // Jeśli usunięto ostatnie, pokaż Empty State (obsługiwane przy odświeżeniu lub w renderStats)
}

// Aktualizuje węzeł (Partial Update)
export function updateTaskNode(id, changes) {
    const item = elements.list.querySelector(`.todo-item[data-id="${id}"]`);
    if (!item) return;

    if (changes.type === 'toggle') {
        item.classList.toggle('completed');
    }
    
    if (changes.type === 'text') {
        const textSpan = item.querySelector('.text');
        if (textSpan) textSpan.textContent = changes.value;
    }
}

// --- UI HELPERS ---

export function renderStats({ total, completed }) {
    elements.stats.textContent = `${total} zadania • ${completed} ukończone`;

    if (elements.clearBtn) {
        if (completed > 0) {
            elements.clearBtn.classList.remove('hidden');
        } else {
            elements.clearBtn.classList.add('hidden');
        }
    }
    
    // Sprawdzenie czy lista jest pusta po usunięciu
    if (total === 0 && !elements.list.querySelector('.empty-state')) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = '🎉 Brak zadań! Odpocznij.';
        elements.list.appendChild(emptyMsg);
    }
}

export function resetForm() {
    elements.form.reset();
}

// Pobiera wszystkie dane z formularza
export function getFormData() {
    return {
        text: elements.input.value.trim(),
        date: elements.dateInput.value,
        file: elements.fileInput.files[0]
    };
}