// --- IMPORTY POMOCNICZE ---
// Zakładam, że helpers.js istnieje.

export const elements = {
    list: document.getElementById('todo-list'),
    input: document.getElementById('todo-input'),
    dateInput: document.getElementById('todo-date'),
    fileInput: document.getElementById('todo-image'),
    form: document.getElementById('todo-form'),
    stats: document.getElementById('stats-counter'),
    clearBtn: document.getElementById('clear-completed'),
    
    // ELEMENTY UI
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
    span.textContent = task.text; 

    textContainer.appendChild(span);

    // Data wykonania (jeśli jest)
    if (task.dueDate) {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date-info';
        const formattedDate = new Date(task.dueDate).toLocaleString('pl-PL', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        dateSpan.textContent = `📅 ${formattedDate}`;
        textContainer.appendChild(dateSpan);
    }

    content.appendChild(checkbox);
    content.appendChild(textContainer);

    // Zdjęcie (jeśli jest)
    if (task.image) {
        const img = document.createElement('img');
        img.src = task.image;
        img.className = 'img-preview';
        img.alt = 'Załącznik';
        img.title = 'Kliknij, aby powiększyć';
        
        // --- POPRAWKA CSP (Bezpieczny podgląd) ---
        img.onclick = (e) => {
            e.stopPropagation();
            const win = window.open("", "_blank");
            
            // Inicjujemy puste okno
            win.document.write('<!DOCTYPE html><html lang="pl"><head><title>Podgląd</title></head><body></body></html>');
            
            // Tworzymy element programowo (zgodne z CSP)
            const image = win.document.createElement('img');
            image.src = task.image;
            
            // Style ustawiane przez JS są dozwolone
            image.style.maxWidth = "100%";
            image.style.display = "block";
            image.style.margin = "0 auto";
            
            // Stylizacja tła okna
            win.document.body.style.backgroundColor = "#222";
            win.document.body.style.margin = "0";
            win.document.body.style.display = "flex";
            win.document.body.style.justifyContent = "center";
            win.document.body.style.alignItems = "center";
            win.document.body.style.minHeight = "100vh";

            win.document.body.appendChild(image);
            win.document.close();
        };
        // ------------------------------------------

        content.appendChild(img);
    }

    // 2. Kontener akcji (prawa strona)
    const actions = document.createElement('div');
    actions.className = 'actions';

    const createBtn = (cls, icon, title) => {
        const btn = document.createElement('button');
        btn.className = `action-btn ${cls}`;
        btn.textContent = icon;
        btn.title = title;
        return btn;
    };

    if (task.dueDate) {
        actions.appendChild(createBtn('calendar-btn', '📆', 'Pobierz do kalendarza'));
    }

    actions.appendChild(createBtn('edit-btn', '✏️', 'Edytuj'));
    actions.appendChild(createBtn('delete-btn', '🗑', 'Usuń'));

    li.appendChild(content);
    li.appendChild(actions);

    return li;
}

// --- OPTYMALIZACJA RENDEROWANIA ---

export function renderFullList(tasks) {
    elements.list.innerHTML = ''; 
    
    if (tasks.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = '🎉 Brak zadań! Odpocznij.';
        elements.list.appendChild(emptyMsg);
        return;
    }

    const fragment = document.createDocumentFragment();
    tasks.forEach(task => {
        fragment.appendChild(createTodoItem(task));
    });
    elements.list.appendChild(fragment);
}

export function appendTaskNode(task) {
    const emptyState = elements.list.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const li = createTodoItem(task);
    elements.list.prepend(li);
}

export function removeTaskNode(id) {
    const item = elements.list.querySelector(`.todo-item[data-id="${id}"]`);
    if (item) {
        item.style.opacity = '0';
        setTimeout(() => item.remove(), 200);
    }
}

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

export function getFormData() {
    return {
        text: elements.input.value.trim(),
        date: elements.dateInput.value,
        file: elements.fileInput.files[0]
    };
}