console.log("APP STARTUJE!");
alert("APP STARTUJE!");

import * as Store from './store.js';
import * as View from './view.js';

let currentTasks = Store.getTasks();
const MAX_LENGTH = 200;

function updateView() {
    View.renderList(currentTasks);
    View.renderStats(Store.calculateStats(currentTasks));
}

function handleAdd(e) {
    e.preventDefault();
    const text = View.getInputValue();

    if (!text) return;
    if (text.length > MAX_LENGTH) {
        alert("Za długi tekst!");
        return;
    }

    currentTasks = Store.addTask(currentTasks, text);
    updateView();
    View.clearInput();
}

function handleListClick(e) {
    const item = e.target.closest('.todo-item');
    if (!item) return;
    const id = Number(item.dataset.id);

    if (e.target.closest('.delete-btn')) {
        currentTasks = Store.removeTask(currentTasks, id);
    } else if (e.target.closest('.todo-content')) {
        currentTasks = Store.toggleTask(currentTasks, id);
    }
    updateView();
}

function init() {
    View.elements.form.addEventListener('submit', handleAdd);
    View.elements.list.addEventListener('click', handleListClick);
    updateView();

    // Rejestracja PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('SW OK'))
                .catch(err => console.error('SW Error', err));
        });
    }
}

init();