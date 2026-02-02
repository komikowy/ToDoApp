import { testTodoRules } from './unit/todoRules.test.js';
import { testTodoStore } from './unit/todoStore.test.js';
import { testTodoCreationFlow } from './integration/todoCreationFlow.test.js';
import { testTodoDeletionFlow } from './integration/todoDeletionFlow.test.js';
import { testImageHandlingFlow } from './integration/imageHandlingFlow.test.js';

// Definiujemy funkcję w zasięgu modułu
async function runAllTests() {
    console.clear();
    console.log('🚀 Start System Health Check...');
    
    testTodoRules();
    testTodoStore();
    
    try {
        await testTodoCreationFlow();
        await testTodoDeletionFlow();
        await testImageHandlingFlow();
        console.log('🏁 Wszystkie moduły sprawdzone pomyślnie.');
    } catch (error) {
        console.error('❌ Błąd integracji:', error);
    }
}

// Rejestrujemy funkcję w window, aby była dostępna z konsoli (jeśli allow pasting zadziała)
window.runAllTests = runAllTests;

// KLUCZ: Podpinamy przycisk bezpośrednio w kodzie JS
function init() {
    const btn = document.getElementById('start-tests-btn');
    if (btn) {
        // To jest dozwolone przez CSP 'self'
        btn.addEventListener('click', runAllTests);
        console.log('✅ Przycisk połączony z runnerem.');
    }
}

// Uruchamiamy inicjalizację po załadowaniu DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}