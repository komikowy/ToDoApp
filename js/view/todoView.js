export class TodoView {
    constructor() {
        this.elements = {
            list: document.getElementById('todo-list'),
            input: document.getElementById('todo-input'),
            dateInput: document.getElementById('todo-date'),
            fileInput: document.getElementById('todo-image'),
            form: document.getElementById('todo-form'),
            stats: document.getElementById('stats-counter'),
            toastContainer: document.getElementById('toast-container'),
            notifyBtn: document.getElementById('notify-btn'),
            dialog: document.getElementById('confirm-dialog'),
            dialogConfirmBtn: document.getElementById('dialog-confirm'),
            dialogCancelBtn: document.getElementById('dialog-cancel'),
            clearBtn: document.getElementById('clear-completed'),
            filters: document.querySelectorAll('.filter-btn'),
            sortToggle: document.getElementById('sort-toggle')
        };
    }

    // --- BINDING EVENTS (Observer Pattern) ---

    bindAdd(handler) {
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                text: this.elements.input.value.trim(),
                date: this.elements.dateInput.value,
                file: this.elements.fileInput.files[0]
            };
            handler(data);
        });
    }

    bindListAction(handler) {
        this.elements.list.addEventListener('click', (e) => {
            const item = e.target.closest('.todo-item');
            if (!item) return;
            
            const id = Number(item.dataset.id);
            
            // Rozpoznajemy akcję po klasie klikniętego elementu
            const action = e.target.closest('.delete-btn') ? 'delete' :
                           e.target.closest('.edit-btn') ? 'edit' :
                           e.target.closest('.calendar-btn') ? 'calendar' :
                           'toggle'; // Kliknięcie w checkbox lub treść to toggle
            
            handler(action, id);
        });
    }

    bindFilterChange(handler) {
        this.elements.filters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.elements.filters.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                handler(e.target.dataset.filter);
            });
        });
    }

    bindSortChange(handler) {
        if (this.elements.sortToggle) {
            this.elements.sortToggle.addEventListener('change', (e) => {
                handler(e.target.checked);
            });
        }
    }

    bindClearCompleted(handler) {
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', handler);
        }
    }
    
    bindNotificationToggle(handler) {
        if (this.elements.notifyBtn) {
            this.elements.notifyBtn.addEventListener('click', handler);
        }
    }
    
    bindDialogConfirm(handler) {
        if (this.elements.dialogConfirmBtn) {
            this.elements.dialogConfirmBtn.addEventListener('click', handler);
        }
        if (this.elements.dialogCancelBtn) {
            this.elements.dialogCancelBtn.addEventListener('click', () => this.elements.dialog.close());
        }
    }

    // --- RENDERING ---

    render(tasks) {
        this.elements.list.innerHTML = '';
        
        if (tasks.length === 0) {
            this._renderEmpty();
            return;
        }

        const fragment = document.createDocumentFragment();
        tasks.forEach(task => fragment.appendChild(this._createItem(task)));
        this.elements.list.appendChild(fragment);
    }

    updateStats({ total, completed }) {
        this.elements.stats.textContent = `${total} zadania • ${completed} ukończone`;
        
        if(this.elements.clearBtn) {
            if (completed > 0) {
                this.elements.clearBtn.classList.remove('hidden');
            } else {
                this.elements.clearBtn.classList.add('hidden');
            }
        }
    }
    
    showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
    
    resetForm() {
        this.elements.form.reset();
    }
    
    updateNotifyIcon(granted) {
        if(this.elements.notifyBtn) {
            this.elements.notifyBtn.textContent = granted ? '🔔' : '🔕';
        }
    }

    showDialog() {
        this.elements.dialog.showModal();
    }

    closeDialog() {
        this.elements.dialog.close();
    }

    // --- PRIVATE HELPERS (HTML Construction) ---

    _createItem(task) {
        const li = document.createElement('li');
        li.className = `todo-item ${task.done ? 'completed' : ''}`;
        li.dataset.id = task.id;

        // 1. KOLUMNA LEWA: Checkbox
        const checkbox = document.createElement('div');
        checkbox.className = 'custom-checkbox';

        // 2. KOLUMNA ŚRODKOWA GÓRA: Treść + Data dodania
        const textContainer = document.createElement('div');
        textContainer.className = 'text-container';

        // Treść zadania
        const span = document.createElement('span');
        span.className = 'text';
        span.textContent = task.text;

        // Data dodania
        const createdTimestamp = task.createdAt || task.id;
        const createdDate = new Date(createdTimestamp).toLocaleDateString('pl-PL', {
            day: 'numeric', month: 'short'
        });
        
        const createdInfo = document.createElement('span');
        createdInfo.className = 'created-at';
        createdInfo.textContent = `Dodano: ${createdDate}`;

        textContainer.appendChild(span);
        textContainer.appendChild(createdInfo);

        // 3. KOLUMNA ŚRODKOWA DÓŁ: Termin wykonania
        const dueDateContainer = document.createElement('div');
        dueDateContainer.className = 'due-date-container';
        
        if (task.dueDate) {
            const dateSpan = document.createElement('span');
            dateSpan.className = 'date-info';
            const formattedDate = new Date(task.dueDate).toLocaleString('pl-PL', {
                day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            dateSpan.textContent = `📅 ${formattedDate}`;
            dueDateContainer.appendChild(dateSpan);
        }

        // 4. KOLUMNA PRAWA: Panel (Zdjęcie + Akcje)
        const rightPanel = document.createElement('div');
        rightPanel.className = 'right-panel';

        // Zdjęcie (jeśli jest)
        if (task.image) {
            const img = document.createElement('img');
            img.src = task.image;
            img.className = 'img-preview';
            img.alt = 'Załącznik';
            img.title = 'Kliknij, aby powiększyć';
            
            // Bezpieczny podgląd (Fix CSP)
            img.onclick = (e) => {
                e.stopPropagation();
                const win = window.open("", "_blank");
                win.document.write('<!DOCTYPE html><html lang="pl"><head><title>Podgląd</title></head><body></body></html>');
                
                const image = win.document.createElement('img');
                image.src = task.image;
                image.style.maxWidth = "100%";
                image.style.display = "block";
                image.style.margin = "0 auto";
                
                win.document.body.style.backgroundColor = "#222";
                win.document.body.style.margin = "0";
                win.document.body.style.display = "flex";
                win.document.body.style.justifyContent = "center";
                win.document.body.style.alignItems = "center";
                win.document.body.style.minHeight = "100vh";
                
                win.document.body.appendChild(image);
                win.document.close();
            };
            rightPanel.appendChild(img);
        }

        // Akcje (Przyciski)
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

        rightPanel.appendChild(actions);

        // SKŁADANIE CAŁOŚCI (Grid layout)
        li.appendChild(checkbox);        // Grid Col 1
        li.appendChild(textContainer);   // Grid Col 2 Row 1
        li.appendChild(dueDateContainer);// Grid Col 2 Row 2
        li.appendChild(rightPanel);      // Grid Col 3

        return li;
    }
    
    _renderEmpty() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.textContent = '🎉 Brak zadań! Odpocznij.';
        this.elements.list.appendChild(div);
    }
}