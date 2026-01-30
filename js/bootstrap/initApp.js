import { TodoStore } from '../store/todoStore.js';
import { UIStore } from '../store/uiStore.js';
import { ImageStore } from '../store/imageStore.js'; // <--- 1. NOWY IMPORT
import { NotificationService } from '../services/notificationService.js';
import { TodoView } from '../view/todoView.js';
import { TodoController } from '../controllers/todoController.js';

export function initApp() {
    console.log("🚀 Inicjalizacja Systemu (Enterprise Architecture)...");
    
    // 1. Inicjalizacja Warstwy Danych (Stores)
    const todoStore = new TodoStore();
    const uiStore = new UIStore();
    const imageStore = new ImageStore(); // <--- 2. TWORZYMY INSTANCJĘ BAZY ZDJĘĆ
    
    // 2. Usługi
    const notificationService = new NotificationService();
    
    // 3. Widok
    const view = new TodoView();

    // 4. Inicjalizacja Kontrolera (Dependency Injection)
    // WAŻNE: Przekazujemy imageStore jako trzeci argument!
    new TodoController(todoStore, uiStore, imageStore, notificationService, view);

    // 5. Service Worker (Cache)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('✅ Service Worker zarejestrowany:', reg.scope))
                .catch(err => console.error('❌ Błąd Service Workera:', err));
        });
    }
}