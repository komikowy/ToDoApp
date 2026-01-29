export class TodoItem {
    static create(task) {
        const li = document.createElement('li');
        li.className = `todo-item ${task.done ? 'completed' : ''}`;
        li.dataset.id = task.id;

        // Budowanie struktury DOM (Grid layout)
        const checkbox = this._createCheckbox();
        const textContainer = this._createTextContainer(task);
        const dueDateContainer = this._createDueDate(task);
        const rightPanel = this._createRightPanel(task);

        li.append(checkbox, textContainer, dueDateContainer, rightPanel);
        return li;
    }

    static _createCheckbox() {
        const div = document.createElement('div');
        div.className = 'custom-checkbox';
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
        const date = new Date(task.createdAt || task.id).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
        createdInfo.textContent = `Dodano: ${date}`;

        container.append(text, createdInfo);
        return container;
    }

    static _createDueDate(task) {
        const container = document.createElement('div');
        container.className = 'due-date-container';
        
        if (task.dueDate) {
            const span = document.createElement('span');
            span.className = 'date-info';
            const date = new Date(task.dueDate).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
            span.textContent = `📅 ${date}`;
            container.appendChild(span);
        }
        return container;
    }

    static _createRightPanel(task) {
        const panel = document.createElement('div');
        panel.className = 'right-panel';

        if (task.image) {
            const img = document.createElement('img');
            img.src = task.image;
            img.className = 'img-preview';
            img.onclick = (e) => {
                e.stopPropagation();
                this._openImageSafe(task.image);
            };
            panel.appendChild(img);
        }

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

    static _openImageSafe(base64) {
        const win = window.open("", "_blank");
        if(!win) return;
        win.document.write('<!DOCTYPE html><html><body style="background:#222;display:flex;justify-content:center;align-items:center;height:100vh;margin:0"></body></html>');
        const img = win.document.createElement('img');
        img.src = base64;
        img.style.maxWidth = "100%";
        win.document.body.appendChild(img);
    }
}