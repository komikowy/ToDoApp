import { TodoStore } from '../store/todoStore.js';
import { UIStore } from '../store/uiStore.js';
import { NotificationService } from '../services/notificationService.js';
import { TodoView } from '../view/todoView.js';
import { TodoController } from '../controllers/todoController.js';

export function initApp() {
    console.log("Inicjalizacja Systemu...");
    
    // 1. Inicjalizacja Warstwy Danych i Usług
    const todoStore = new TodoStore();
    const uiStore = new UIStore();
    const notificationService = new NotificationService();
    
    // 2. Inicjalizacja Widoku
    const view = new TodoView();

    // 3. Inicjalizacja Kontrolera (Dependency Injection)
    new TodoController(todoStore, uiStore, notificationService, view);

    // 4. Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('SW OK'))
                .catch(err => console.error('SW Error', err));
        });
    }
}