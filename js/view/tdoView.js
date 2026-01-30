import { TodoItem } from '../js/view/components/todoItem.js';
import { ToastManager } from '../js/view/components/toastManager.js';
import { ModalManager } from '../js/view/components/modalManager.js';

export class TodoView {
    constructor() {
        // Główny kontener
        this.list = document.getElementById('todo-list');
        
        // Formularz
        this.form = document.getElementById('todo-form');
        this.input = document.getElementById('todo-input');
        this.dateInput = document.getElementById('todo-date');
        this.fileInput = document.getElementById('todo-image');
        
        // Inne
        this.stats = document.getElementById('stats-counter');
        this.clearBtn = document.getElementById('clear-completed');
        this.notifyBtn = document.getElementById('notify-btn');
        this.filters = document.querySelectorAll('.filter-btn');
        this.sortToggle = document.getElementById('sort-toggle');

        // Komponenty
        this.toastManager = new ToastManager('toast-container');
        this.modalManager = new ModalManager('confirm-dialog', 'dialog-confirm', 'dialog-cancel');
    }

    // --- DELEGACJA DO KOMPONENTÓW ---

    render(tasks) {
        this.list.innerHTML = '';
        if (tasks.length === 0) {
            this._renderEmpty();
            return;
        }
        
        const fragment = document.createDocumentFragment();
        tasks.forEach(task => {
            // View używa TodoItem buildera, zamiast robić to samemu
            fragment.appendChild(TodoItem.create(task));
        });
        this.list.appendChild(fragment);
    }

    showToast(msg, type) {
        this.toastManager.show(msg, type);
    }

    showDialog() {
        this.modalManager.open();
    }

    closeDialog() {
        this.modalManager.close();
    }

    bindDialogConfirm(handler) {
        this.modalManager.bindConfirm(handler);
    }

    // --- BINDING (Reszta bez zmian, bo to rola View) ---

    bindAdd(handler) {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            handler({
                text: this.input.value.trim(),
                date: this.dateInput.value,
                file: this.fileInput.files[0]
            });
        });
    }

    bindListAction(handler) {
        this.list.addEventListener('click', (e) => {
            const item = e.target.closest('.todo-item');
            if (!item) return;
            
            const id = Number(item.dataset.id);
            const action = e.target.closest('.delete-btn') ? 'delete' :
                           e.target.closest('.edit-btn') ? 'edit' :
                           e.target.closest('.calendar-btn') ? 'calendar' :
                           'toggle';
            handler(action, id);
        });
    }

    bindFilterChange(handler) {
        this.filters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filters.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                handler(e.target.dataset.filter);
            });
        });
    }

    bindSortChange(handler) {
        if(this.sortToggle) this.sortToggle.addEventListener('change', e => handler(e.target.checked));
    }

    bindClearCompleted(handler) {
        if(this.clearBtn) this.clearBtn.addEventListener('click', handler);
    }

    bindNotificationToggle(handler) {
        if(this.notifyBtn) this.notifyBtn.addEventListener('click', handler);
    }

    // --- UI UPDATES ---

    updateStats({ total, completed }) {
        this.stats.textContent = `${total} zadania • ${completed} ukończone`;
        if (this.clearBtn) {
            this.clearBtn.classList.toggle('hidden', completed === 0);
        }
    }

    updateNotifyIcon(granted) {
        if(this.notifyBtn) this.notifyBtn.textContent = granted ? '🔔' : '🔕';
    }

    resetForm() {
        this.form.reset();
    }

    _renderEmpty() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.textContent = '🎉 Brak zadań! Odpocznij.';
        this.list.appendChild(div);
    }
}
