import { TodoStore } from '../../store/todoStore.js';

export function testTodoStore() {
    console.group('🧪 Unit: TodoStore');
    
    localStorage.clear();
    const store = new TodoStore();
    const mockTask = { id: '1', text: 'Test', isCompleted: false };

    store.add(mockTask);
    console.assert(store.getAll().length === 1, '❌ Błąd: Nie dodano zadania');

    store.toggle('1');
    console.assert(store.getAll()[0].isCompleted === true, '❌ Błąd: Nie przełączono statusu');

    console.groupEnd();
}