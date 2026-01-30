// js/app.js

// 1. GLOBALNI STRAŻNICY (Definicja przed importami)
// Używamy window.onerror dla dokładniejszych danych o błędzie (linia, plik)
window.onerror = function (message, source, lineno, colno, error) {
    console.error("🔥 [CRITICAL ERROR]:", message);
    console.error("   📍 Lokalizacja:", source, "linia:", lineno);
    
    // Pokazujemy alert użytkownikowi, żeby wiedział, że aplikacja "umarła"
    alert('Wystąpił krytyczny błąd:\n' + message);
    
    return false; // false oznacza: "nie ukrywaj tego błędu w konsoli przeglądarki"
};

// Wyłapuje błędy Promises (np. nieudane fetch, błędy bazy danych)
window.onunhandledrejection = function (event) {
    console.error("🔥 [UNHANDLED PROMISE]:", event.reason);
    // event.preventDefault(); // Odkomentuj w produkcji, żeby nie spamować konsoli
};

// 2. IMPORT SYSTEMU
import { initApp } from './bootstrap/initApp.js';

console.log("🚀 [APP] Plik app.js załadowany. System gotowy.");

// 3. URUCHOMIENIE APLIKACJI
document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 [APP] DOM załadowany. Próba uruchomienia initApp()...");

    try {
        // Odpalamy silnik aplikacji
        initApp();
    } catch (e) {
        // Jeśli błąd wystąpi w samej funkcji inicjalizującej (np. w konstruktorze)
        console.error("❌ [INIT FATAL]:", e);
        alert("Nie udało się uruchomić aplikacji (Init Error). Sprawdź konsolę.");
    }
});