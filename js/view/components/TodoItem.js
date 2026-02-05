export class TodoItem {
    static create(task, imageLoader) {
        const li = document.createElement('li');
        
        // SPRZĄTANIE: Używamy wyłącznie isCompleted, bo system jest już spójny
        li.className = `todo-item ${task.isCompleted ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const checkbox = this._createDiv('custom-checkbox');
        const textContainer = this._createText(task);
        const dateContainer = this._createDate(task);
        const rightPanel = this._createRightPanel(task, imageLoader);

        li.append(checkbox, textContainer, dateContainer, rightPanel);
        return li;
    }

    // Tworzenie ogólnego diva z klasą

    static _createDiv(className) {
        const div = document.createElement('div');
        div.className = className;
        return div;
    }

    // Tworzenie elementu tekstu zadania wraz z datą dodania

    static _createText(task) {
        const container = this._createDiv('text-container');
        
        const text = document.createElement('span');
        text.className = 'text';
        text.textContent = task.text;

        const date = document.createElement('span');
        date.className = 'created-at';
        try {
            // Bezpieczne parsowanie daty ISO
            date.textContent = 'Dodano: ' + new Date(task.createdAt).toLocaleDateString('pl-PL', {day:'numeric', month:'short'});
        } catch(e) { date.textContent = ''; }

        container.append(text, date);
        return container;
    }

    // Tworzenie elementu daty wykonania zadania

    static _createDate(task) {
        const container = this._createDiv('due-date-container');
        if (task.dueDate) {
            const span = document.createElement('span');
            span.className = 'date-info';
            try {
                const d = new Date(task.dueDate);
                span.textContent = '⏰ ' + d.toLocaleString('pl-PL', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
                container.appendChild(span);
            } catch(e) {}
        }
        return container;
    }

    static _createRightPanel(task, imageLoader) {
        const panel = this._createDiv('right-panel');

        // SPRZĄTANIE: Sprawdzanie task.file zgodnie z modelem IndexedDB
        if (task.file) {
            const imgContainer = this._createDiv('img-container');
            const img = document.createElement('img');
            img.className = 'img-preview';
            img.alt = 'Podgląd zadania';
            
            // Lekki placeholder inline (Base64 tutaj jest akceptowalne, bo to stały element UI)
            img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PHJlY3Qgd2lkdGg1MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
            
            imgContainer.appendChild(img);
            panel.appendChild(imgContainer);

            if (imageLoader) {
                imageLoader.getImage(task.file).then(url => {
                    if (url) {
                        img.src = url;
                        // Otwieranie zdjęcia w nowej karcie
                        img.onclick = (e) => { 
                            e.stopPropagation(); 
                            window.open(url, '_blank'); 
                        };
                    }
                });
            }
        }

        // Akcje: kalendarz, edycja, usuwanie

        const actions = this._createDiv('actions');
        if (task.dueDate) actions.appendChild(this._createBtn('calendar-btn', '📆'));
        actions.appendChild(this._createBtn('edit-btn', '✏️'));
        actions.appendChild(this._createBtn('delete-btn', '🗑'));

        panel.appendChild(actions);
        return panel;
    }

    static _createBtn(cls, txt) {
        const btn = document.createElement('button');
        btn.className = `action-btn ${cls}`;
        btn.textContent = txt;
        return btn;
    }
}