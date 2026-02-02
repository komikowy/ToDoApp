import { TodoController } from '../../controllers/todoController.js';
import { TodoStore } from '../../store/todoStore.js';
import { UIStore } from '../../store/uiStore.js';
import { ImageStore } from '../../store/imageStore.js';
import { NotificationService } from '../../services/notificationService.js';
import { TodoView } from '../../view/todoView.js';

export async function testTodoCreationIntegration() {
    console.group('🧪 Integration: Todo Creation Flow');
    
    // Setup - SRP: każda instancja ma swoją rolę
    localStorage.clear();
    const store = new TodoStore();
    const ui = new UIStore();
    const img = new ImageStore();
    const notify = new NotificationService();
    const view = new TodoView(); // W teście integracyjnym widok może być uproszczony (mock)
    
    const controller = new TodoController(store, ui, img, notify, view);

    // Akcja: Dodanie zadania przez kontroler
    await controller.handleAdd({ 
        text: 'Integracja SRP', 
        date: '2026-05-05', 
        file: null 
    });

    // Weryfikacja: Czy dane przeszły przez cały system do Store
    const tasks = store.getAll();
    console.assert(tasks.length === 1, '❌ Zadanie nie dotarło do Store');
    console.assert(tasks[0].text === 'Integracja SRP', '❌ Tekst zadania uległ uszkodzeniu');
    console.assert(tasks[0].id.length === 36, '❌ Zadanie nie otrzymało poprawnego UUID');

    console.groupEnd();
}