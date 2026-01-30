export class TodoItem {
    // Dodajemy parametr imageLoader (to jest nasz ImageStore)
    static create(task, imageLoader = null) {
        const li = document.createElement('li');
        // Używamy isCompleted zgodnie z TodoRules, fallback na done jeśli stare dane
        const isDone = task.isCompleted !== undefined ? task.isCompleted : task.done;
        
        li.className = `todo-item ${isDone ? 'completed' : ''}`;
        li.dataset.id = task.id;

        // Budowanie struktury DOM
        const checkbox = this._createCheckbox(isDone);
        const textContainer = this._createTextContainer(task);
        const dueDateContainer = this._createDueDate(task);
        
        // Przekazujemy imageLoader do panelu prawego
        const rightPanel = this._createRightPanel(task, imageLoader);

        li.append(checkbox, textContainer, dueDateContainer, rightPanel);
        return li;
    }

    static _createCheckbox(isDone) {
        const div = document.createElement('div');
        div.className = 'custom-checkbox';
        if (isDone) {
            div.textContent = '✔'; // Opcjonalnie: wizualne zaznaczenie
        }
        return div;
    }

    static _createTextContainer(task) {
        const container = document.createElement('div');
        container.className = 'text-container';

        const text = document.createElement('span');
        text.className = 'text';
        text.textContent = task.text;

        const createdInfo = document.createElement('span');
        createdInfo.className = 'created-at';
        
        // Obsługa daty utworzenia
        let dateStr = '';
        try {
            const dateObj = new Date(task.createdAt || Date.now());
            dateStr = dateObj.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
        } catch (e) {
            dateStr = '???';
        }
        
        createdInfo.textContent = `Dodano: ${dateStr}`;

        container.append(text, createdInfo);
        return container;
    }

    static _createDueDate(task) {
        const container = document.createElement('div');
        container.className = 'due-date-container';
        
        // Obsługa pola dueDate (zgodnie z nowym kontrolerem)
        if (task.dueDate) {
            const span = document.createElement('span');
            span.className = 'date-info';
            try {
                const date = new Date(task.dueDate).toLocaleString('pl-PL', { 
                    day: 'numeric', 
                    month: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                span.textContent = `📅 ${date}`;
            } catch (e) {
                span.textContent = `📅 Błąd daty`;
            }
            container.appendChild(span);
        }
        return container;
    }

    static _createRightPanel(task, imageLoader) {
        const panel = document.createElement('div');
        panel.className = 'right-panel';

        // LOGIKA OBRAZKA (IndexedDB)
        // Sprawdzamy czy task ma ID pliku (task.file)
        if (task.file) {
            const img = document.createElement('img');
            img.className = 'img-preview';
            img.alt = "Ładowanie...";
            // Placeholder na czas ładowania (opcjonalnie)
            img.style.opacity = "0.5"; 

            // Kliknięcie otwiera podgląd
            img.onclick = (e) => {
                e.stopPropagation();
                // Otwieramy tylko jeśli obrazek się załadował (ma src)
                if (img.src && img.src.startsWith('blob:')) {
                    window.open(img.src, '_blank');
                }
            };

            panel.appendChild(img);

            // Asynchroniczne pobranie z IndexedDB
            if (imageLoader) {
                imageLoader.getImage(task.file).then(blobUrl => {
                    if (blobUrl) {
                        img.src = blobUrl;
                        img.style.opacity = "1"; // Pełna widoczność po załadowaniu
                    } else {
                        // Jeśli nie znaleziono obrazka w bazie, usuwamy element img
                        img.remove();
                    }
                }).catch(err => {
                    console.error("Błąd ładowania miniatury:", err);
                    img.remove();
                });
            }
        }

        // Przyciski akcji
        const actions = document.createElement('div');
        actions.className = 'actions';
        
        if (task.dueDate) actions.appendChild(this._createBtn('calendar-btn', '📆'));
        actions.appendChild(this._createBtn('edit-btn', '✏️'));
        actions.appendChild(this._createBtn('delete-btn', '🗑'));
        
        panel.appendChild(actions);
        return panel;
    }

    static _createBtn(cls, icon) {
        const btn = document.createElement('button');
        btn.className = `action-btn ${cls}`;
        btn.textContent = icon;
        return btn;
    }
}