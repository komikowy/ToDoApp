import { TodoController } from '../../controllers/todoController.js';
import { TodoStore } from '../../store/todoStore.js';
import { UIStore } from '../../store/uiStore.js';
import { ImageStore } from '../../store/imageStore.js';
import { NotificationService } from '../../services/notificationService.js';

export async function testImageHandlingFlow() {
    console.group('🧪 Integration: Image Handling Flow');

    // 1. SETUP - Izolacja środowiska
    localStorage.clear();
    // Czyścimy też IndexedDB (opcjonalnie, ale ImageStore.saveImage nadpisuje dane)
    const store = new TodoStore();
    const ui = new UIStore();
    const imgStore = new ImageStore();
    const notify = new NotificationService();

    // 2. MOCK VIEW - Pełna implementacja dla stabilności kontrolera
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
        showToast: (msg, type) => console.log(`   [MockView Toast]: ${type} - ${msg}`)
    };

    const controller = new TodoController(store, ui, imgStore, notify, mockView);

    try {
        // 3. PRZYGOTOWANIE MOCKA PLIKU
        // Tworzymy mały, binarny plik w pamięci (Blob)
        const mockFile = new File(["fake-image-content"], "test-image.png", { type: "image/png" });
        console.log('   [Test]: Przygotowano plik binarny');

        // 4. AKCJA: Dodanie zadania z obrazem przez kontroler
        await controller.handleAdd({ 
            text: 'Zadanie z obrazem IndexedDB', 
            date: null, 
            file: mockFile 
        });

        // 5. WERYFIKACJA 1: Czy zadanie w TodoStore ma przypisane ID pliku?
        const tasks = store.getAll();
        const fileId = tasks[0].file;
        
        console.assert(tasks.length === 1, '❌ Zadanie nie zostało dodane');
        console.assert(typeof fileId === 'string' && fileId.length > 0, '❌ Zadanie nie posiada ID powiązanego pliku');

        // 6. WERYFIKACJA 2: Czy plik faktycznie istnieje w IndexedDB?
        const storedImageUrl = await imgStore.getImage(fileId);
        console.assert(storedImageUrl !== null, '❌ Plik nie został znaleziony w IndexedDB');
        console.log(`   [Test]: Plik odnaleziony w IndexedDB pod ID: ${fileId.substring(0,8)}...`);

        console.log('✅ Flow obsługi obrazów (IndexedDB): OK');
    } catch (e) {
        console.error('❌ Błąd w flow obrazów:', e);
    }

    console.groupEnd();
}