import { TodoStore } from '../js/store/todoStore.js';
import { TodoView } from '../js/view/todoView.js';
import { TodoController } from '../js/controllers/todoController.js';

export function initApp() {
    console.log("Inicjalizacja aplikacji Enterprise PWA...");
    
    const store = new TodoStore();
    const view = new TodoView();
    new TodoController(store, view);

    // Service Worker osobno
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('SW OK'))
                .catch(err => console.error('SW Error', err));
        });
    }
}