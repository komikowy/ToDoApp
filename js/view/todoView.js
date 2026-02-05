import { TodoItem } from './components/TodoItem.js';
import { ToastManager } from './components/ToastManager.js';
import { ModalManager } from './components/ModalManager.js';

export class TodoView {
    constructor() {
        this.imageLoader = null;
        this.list = document.getElementById('todo-list');
        this.form = document.getElementById('todo-form');
        this.input = document.getElementById('todo-input');
        this.dateInput = document.getElementById('todo-date');
        this.fileInput = document.getElementById('todo-image');
        
        // Elementy UI statystyk i filtrów
        this.stats = document.getElementById('stats-counter');
        this.clearBtn = document.getElementById('clear-completed');
        this.notifyBtn = document.getElementById('notify-btn');
        this.filters = document.querySelectorAll('.filter-btn');
        this.sortToggle = document.getElementById('sort-toggle');

        // Inicjalizacja menedżerów pomocniczych
        this.toastManager = new ToastManager('toast-container');
        this.modalManager = new ModalManager('confirm-dialog', 'dialog-confirm', 'dialog-cancel');
    }

    setImageLoader(loader) {
        this.imageLoader = loader;
    }

    /**
     * Inteligentne renderowanie listy zadań.
     * Realizuje cele: Wydajność (Fragmenty) i Pamięć (Revoke).
     */
    render(tasks) {
        // 1. PAMIĘĆ: Zwolnienie starych adresów Blob URL przed usunięciem widoku
        const oldImages = this.list.querySelectorAll('img.img-preview');
        oldImages.forEach(img => {
            if (img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });

        // 2. WYDAJNOŚĆ: Obsługa pustego stanu bez innerHTML
        if (tasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = '🎉 Brak zadań!';
            this.list.replaceChildren(emptyState);
            return;
        }
        
        // 3. WYDAJNOŚĆ: Budowanie DOM w pamięci (DocumentFragment)
        const fragment = document.createDocumentFragment();
        tasks.forEach(task => {
            fragment.appendChild(TodoItem.create(task, this.imageLoader));
        });

        // 4. WYDAJNOŚĆ: Jedna operacja na żywym DOM zamiast wielu
        this.list.replaceChildren(fragment);
    }

    // --- BINDING (Obsługa zdarzeń) ---

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
            const id = item.dataset.id; // UUID
            
            // Delegacja zdarzeń w zależności od klikniętego elementu
            if (e.target.closest('.delete-btn')) handler('delete', id);
            else if (e.target.closest('.edit-btn')) handler('edit', id);
            else if (e.target.closest('.calendar-btn')) handler('calendar', id);
            else if (e.target.closest('.img-preview')) return; 
            else handler('toggle', id);
        });
    }
    
    // --- METODY POMOCNICZE I UI ---

    showToast(msg, type) { 
        this.toastManager.show(msg, type); 
    }

    /**
     * ZMIANA: Obsługa dynamicznego modala (usuwanie/czyszczenie/edycja).
     * @param {string} title - Tytuł modala
     * @param {string} desc - Opis w modalu
     * @param {string|null} inputValue - Jeśli podany, włącza tryb edycji
     * @param {string} confirmText - Tekst na przycisku (np. "Usuń", "Zapisz")
     */
    showDialog(title, desc, inputValue = null, confirmText = "Usuń") { 
        this.modalManager.open(title, desc, inputValue, confirmText); 
    }

    /**
     * NOWOŚĆ: Metoda dla kontrolera do pobrania wpisanego tekstu w modalu.
     */
    getDialogInputValue() {
        return this.modalManager.getInputValue();
    }

    closeDialog() { 
        this.modalManager.close(); 
    }

    bindDialogConfirm(h) { 
        this.modalManager.bindConfirm(h); 
    }

    bindFilterChange(h) { 
        this.filters.forEach(b => b.addEventListener('click', e => { 
            this.filters.forEach(x => x.classList.remove('active')); 
            e.target.classList.add('active'); 
            h(e.target.dataset.filter); 
        })); 
    }

    bindSortChange(h) { 
        if(this.sortToggle) {
            this.sortToggle.addEventListener('change', e => h(e.target.checked));
        }
    }

    bindClearCompleted(h) { 
        if(this.clearBtn) {
            this.clearBtn.addEventListener('click', h); 
        }
    }

    bindNotificationToggle(h) { 
        if(this.notifyBtn) {
            this.notifyBtn.addEventListener('click', h); 
        }
    }
    
    updateStats({total, completed}) {
        this.stats.textContent = `${total} zadania • ${completed} ukończone`;
        if(this.clearBtn) {
            this.clearBtn.classList.toggle('hidden', completed === 0);
        }
    }

    updateNotifyIcon(active) { 
        if(this.notifyBtn) {
            this.notifyBtn.textContent = active ? '🔔' : '🔕'; 
        }
    }

    setActiveFilter(f) { 
        this.filters.forEach(b => b.classList.toggle('active', b.dataset.filter === f)); 
    }

    setSortToggle(s) { 
        if(this.sortToggle) {
            this.sortToggle.checked = s; 
        }
    }

    resetForm() { 
        this.form.reset(); 
    }
}