// js/app.js

// 1. GLOBALNI STRAŻNICY (Muszą być na samym początku!)
// Wyłapuje błędy ogólne (np. literówki, błędy składni)
window.addEventListener('error', (event) => {
    console.error("🔥 [CRITICAL ERROR]:", event.error);
    alert('Wystąpił krytyczny błąd aplikacji:\n' + (event.message || 'Nieznany błąd'));
});

// Wyłapuje błędy asynchroniczne (np. błąd zapisu do bazy, fetch, Promises)
window.addEventListener('unhandledrejection', (event) => {
    console.error("🔥 [UNHANDLED PROMISE]:", event.reason);
    // Możemy to zignorować w UI lub pokazać subtelny komunikat
});

// 2. IMPORT SYSTEMU
import { initApp } from './bootstrap/initApp.js';

console.log("🚀 [APP] Plik app.js załadowany. System gotowy do startu.");

// 3. URUCHOMIENIE APLIKACJI
document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 [APP] DOM załadowany. Próba uruchomienia initApp()...");

    try {
        // Odpalamy silnik aplikacji
        initApp();
    } catch (e) {
        // Jeśli sam start aplikacji wyrzuci błąd (np. błąd w konstruktorze)
        console.error("❌ [INIT ERROR] Aplikacja nie mogła wystartować:", e);
        alert("Nie udało się uruchomić aplikacji. Sprawdź konsolę.");
    }
});