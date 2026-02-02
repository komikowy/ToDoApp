import { TodoController } from '../../controllers/todoController.js';
import { TodoStore } from '../../store/todoStore.js';
import { UIStore } from '../../store/uiStore.js';
import { ImageStore } from '../../store/imageStore.js';
import { NotificationService } from '../../services/notificationService.js';

export async function testTodoCreationFlow() {
    console.group('🧪 Integration: Todo Creation Flow');
    
    // 1. SETUP
    localStorage.clear();
    const store = new TodoStore();
    const ui = new UIStore();
    const img = new ImageStore();
    const notify = new NotificationService();

    // 2. KOMPLETNY MOCK VIEW
    // Dodajemy wszystkie metody, które kontroler wywołuje w konstruktorze i podczas refreshu
    const mockView = {
        // Metody bindowania (nasłuchy)
        bindAdd: () => {},
        bindListAction: () => {},
        bindFilterChange: () => {},
        bindSortChange: () => {},
        bindClearCompleted: () => {},
        bindNotificationToggle: () => {},
        bindDialogConfirm: () => {},
        
        // Metody aktualizacji UI
        setImageLoader: () => {},
        render: () => {},
        updateStats: () => {},
        setActiveFilter: () => {},
        setSortToggle: () => {},
        resetForm: () => {},
        
        // TA METODA BRAKOWAŁA:
        updateNotifyIcon: (status) => console.log(`   [MockView] Ikona powiadomień: ${status}`),
        
        // Metody powiadomień
        showToast: (msg, type) => console.log(`   [MockView Toast]: ${type} - ${msg}`)
    };
    
    try {
        // 3. INICJALIZACJA
        const controller = new TodoController(store, ui, img, notify, mockView);

        // 4. AKCJA
        await controller.handleAdd({ 
            text: 'Zadanie integracyjne UUID', 
            date: '2026-06-06', 
            file: null 
        });

        // 5. WERYFIKACJA
        const tasks = store.getAll();
        console.assert(tasks.length === 1, '❌ Błąd: Zadanie nie trafiło do Store');
        console.assert(tasks[0].id.length === 36, '❌ Błąd: ID nie jest UUID');
        
        console.log('✅ Flow dodawania: OK');
    } catch (e) {
        console.error('❌ Krytyczny błąd wewnątrz testu:', e);
    }
    
    console.groupEnd();
}