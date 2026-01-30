
import { TodoStore } from '../js/store/todoStore.js';
import { UIStore } from '../js/store/uiStore.js';
import { NotificationService } from '../js/services/notificationService.js';
import { TodoView } from '../js/view/todoView.js';
import { TodoController } from '../js/controllers/todoController.js';

export function initApp() {
    console.log("Inicjalizacja Systemu...");
    
    const todoStore = new TodoStore();
    const uiStore = new UIStore();
    const notificationService = new NotificationService();
    
    const view = new TodoView();

    new TodoController(todoStore, uiStore, notificationService, view);

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('SW OK'))
                .catch(err => console.error('SW Error', err));
        });
    }
}