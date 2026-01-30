import { TodoItem } from './components/todoItem.js';
import { ToastManager } from './components/toastManager.js';
import { ModalManager } from './components/modalManager.js';

export class TodoView {
    constructor() {
        console.log("🔧 [VIEW] Inicjalizacja widoku...");

        // Placeholder na serwis do ładowania zdjęć (wstrzykiwany później)
        this.imageLoader = null; 

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

        // --- WALIDACJA STRUKTURY HTML ---
        if (!this.form || !this.input || !this.list) {
            console.error("❌ [VIEW ERROR] Brakuje kluczowych elementów w HTML! Sprawdź ID.");
        } else {
            console.log("✅ [VIEW] Wszystkie elementy znalezione.");
        }
        // ---------------------------------

        // Komponenty
        this.toastManager = new ToastManager('toast-container');
        this.modalManager = new ModalManager('confirm-dialog', 'dialog-confirm', 'dialog-cancel');
    }

    // --- METODA WSTRZYKIWANIA ZALEŻNOŚCI ---
    
    // Tę metodę wywołuje Kontroler zaraz po stworzeniu Widoku
    setImageLoader(loader) {
        this.imageLoader = loader;
    }

    // --- DELEGACJA DO KOMPONENTÓW ---

    render(tasks) {
        // console.log("🎨 [VIEW] Renderowanie zadań:", tasks.length);
        this.list.innerHTML = '';
        if (tasks.length === 0) {
            this._renderEmpty();
            return;
        }
        
        const fragment = document.createDocumentFragment();
        tasks.forEach(task => {
            // WAŻNE: Przekazujemy imageLoader do komponentu TodoItem!
            fragment.appendChild(TodoItem.create(task, this.imageLoader));
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

    // --- BINDING ---

    bindAdd(handler) {
        if (!this.form) return;

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            // console.log("🖱️ [VIEW] Wykryto submit formularza!");
            
            const textVal = this.input.value.trim();
            console.log("   -> Wartość inputa:", textVal);

            if (textVal) {
                const payload = {
                    text: textVal,
                    date: this.dateInput ? this.dateInput.value : null,
                    file: this.fileInput && this.fileInput.files ? this.fileInput.files[0] : null
                };
                // console.log("📤 [VIEW] Przekazuję dane do Controllera:", payload);
                handler(payload);
            } else {
                console.warn("⚠️ [VIEW] Pusty input - blokuję wysyłkę.");
            }
        });
    }

    bindListAction(handler) {
        if (!this.list) return;

        this.list.addEventListener('click', (e) => {
            const item = e.target.closest('.todo-item');
            if (!item) return;
            
            // ID jest teraz UUID (String), więc nie rzutujemy na Number
            const id = item.dataset.id; 
            
            const action = e.target.closest('.delete-btn') ? 'delete' :
                           e.target.closest('.edit-btn') ? 'edit' :
                           e.target.closest('.calendar-btn') ? 'calendar' :
                           'toggle';
            
            // console.log(`🖱️ [VIEW] Akcja: ${action}, ID: ${id}`);
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
        if(this.stats) this.stats.textContent = `${total} zadania • ${completed} ukończone`;
        if (this.clearBtn) {
            this.clearBtn.classList.toggle('hidden', completed === 0);
        }
    }

    updateNotifyIcon(granted) {
        if(this.notifyBtn) this.notifyBtn.textContent = granted ? '🔔' : '🔕';
    }

    setActiveFilter(filter) {
        this.filters.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
    }

    setSortToggle(isSorted) {
        if(this.sortToggle) this.sortToggle.checked = !!isSorted;
    }

    resetForm() {
        this.form.reset();
        if (this.fileInput) this.fileInput.value = '';
    }

    _renderEmpty() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.textContent = '🎉 Brak zadań! Odpocznij.';
        this.list.appendChild(div);
    }
}