import { TodoStore } from '../store/todoStore.js';
import { ImageStore } from '../store/imageStore.js';
import { UIStore } from '../store/uiStore.js';
import { NotificationService } from '../services/notificationService.js';
import { TodoView } from '../view/todoView.js';
import { TodoController } from '../controllers/todoController.js';

/**
 * Globalna granica błędów (Error Boundary)
 * Chroni aplikację przed "cichymi" awariami.
 */
function setupGlobalErrorBoundary(view) {
    // Przechwytywanie błędów synchronicznych
    window.onerror = (message, source, lineno) => {
        console.error(`🔥 Global Error: ${message} at ${source}:${lineno}`);
        view?.showToast("Wystąpił nieoczekiwany błąd aplikacji.", "error");
        return false; 
    };

    // Przechwytywanie błędów asynchronicznych (np. przerwane transakcje IndexedDB)
    window.onunhandledrejection = (event) => {
        console.error("🌊 Unhandled Promise Rejection:", event.reason);
        view?.showToast("Błąd bazy danych lub połączenia.", "error");
    };
}

/**
 * Główna funkcja startowa aplikacji.
 * Odpowiada za Dependency Injection (Wstrzykiwanie zależności).
 */
export function initApp() {
    console.log("🚀 Inicjalizacja aplikacji PRO (IndexedDB)...");
    
    // 1. Widok inicjujemy jako pierwszy, aby Error Boundary mógł z niego korzystać
    const view = new TodoView();
    setupGlobalErrorBoundary(view);

    try {
        // 2. Inicjalizacja warstwy danych i usług
        const todoStore = new TodoStore();
        const imageStore = new ImageStore();
        const uiStore = new UIStore();
        const notificationService = new NotificationService();

        // 3. Połączenie wszystkiego w Kontrolerze
        new TodoController(todoStore, uiStore, imageStore, notificationService, view);

        // 4. Rejestracja Service Workera dla trybu Offline
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(() => console.log("✅ SW zarejestrowany"))
                    .catch(err => {
                        console.error("❌ SW Error:", err);
                        view.showToast("Tryb offline może być ograniczony.", "info");
                    });
            });
        }
    } catch (criticalError) {
        console.error("💥 Krytyczny błąd startu:", criticalError);
        view.showToast("Nie udało się zainicjować aplikacji.", "error");
    }
}