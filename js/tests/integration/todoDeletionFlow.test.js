import { TodoController } from '../../controllers/todoController.js';
import { TodoStore } from '../../store/todoStore.js';
import { UIStore } from '../../store/uiStore.js';
import { ImageStore } from '../../store/imageStore.js';
import { NotificationService } from '../../services/notificationService.js';

export async function testTodoDeletionFlow() {
    console.group('🧪 Integration: Todo Deletion Flow');
    
    // 1. SETUP - Czyste instancje dla tego testu
    localStorage.clear();
    const store = new TodoStore();
    const ui = new UIStore();
    const img = new ImageStore();
    const notify = new NotificationService();

    // 2. MOCK VIEW (Taki sam jak w poprzednim teście)
    const mockView = {
        bindAdd: () => {},
        bindListAction: () => {},
        bindFilterChange: () => {},
        bindSortChange: () => {},
        bindClearCompleted: () => {},
        bindNotificationToggle: () => {},
        bindDialogConfirm: () => {},
        setImageLoader: () => {},
        render: () => {},
        updateStats: () => {},
        setActiveFilter: () => {},
        setSortToggle: () => {},
        resetForm: () => {},
        updateNotifyIcon: () => {},
        showToast: (msg) => console.log(`   [MockView Toast]: ${msg}`),
        showDialog: () => console.log('   [MockView]: Otwarto modal usuwania'),
        closeDialog: () => console.log('   [MockView]: Zamknięto modal')
    };

    const controller = new TodoController(store, ui, img, notify, mockView);

    try {
        // 3. PRZYGOTOWANIE DANYCH
        // Symulujemy zadanie już istniejące w bazie
        const task = { id: crypto.randomUUID(), text: 'Do usunięcia', isCompleted: false };
        store.add(task);
        console.log('   [Test]: Dodano zadanie do usunięcia');

        // 4. AKCJA 1: Inicjacja usuwania (kliknięcie ikony kosza)
        controller.handleListAction('delete', task.id);
        console.assert(ui.getTaskToDelete() === task.id, '❌ ID zadania nie trafiło do UIStore');

        // 5. AKCJA 2: Potwierdzenie w modalu
        await controller.handleConfirmDelete();

        // 6. WERYFIKACJA
        const tasks = store.getAll();
        console.assert(tasks.length === 0, '❌ Zadanie nadal istnieje w TodoStore');
        console.assert(ui.getTaskToDelete() === null, '❌ UIStore nie został wyczyszczony');

        console.log('✅ Flow usuwania: OK');
    } catch (e) {
        console.error('❌ Błąd w flow usuwania:', e);
    }

    console.groupEnd();
}