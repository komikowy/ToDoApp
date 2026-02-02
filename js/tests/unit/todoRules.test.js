import { createTodo, validateText, MAX_LENGTH } from '../../domain/todoRules.js';

export function testTodoRules() {
    console.group('🧪 Unit: TodoRules');

    // Test: Czy UUID jest generowane
    const task = createTodo('Zadanie');
    console.assert(task.id.length === 36, '❌ Błąd: Niepoprawny format UUID');

    // Test: Walidacja długości
    try {
        validateText('a'.repeat(MAX_LENGTH + 1));
        console.error('❌ Błąd: Powinien rzucić błąd przy >200 znakach');
    } catch (e) {
        console.log('✅ Walidacja długości: OK');
    }

    console.groupEnd();
}