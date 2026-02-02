export const MAX_LENGTH = 200;

export function validateText(text) {
    if (!text) throw new Error("Wpisz treść zadania!");
    if (text.length > MAX_LENGTH) throw new Error("Za długi tekst!");
    return true;
}

/**
 * Tworzy kompletny obiekt zadania.
 * Zastąpiono Date.now() bezpiecznym UUID.
 */
export function createTodo(text, date = null, fileId = null) {
    validateText(text);
    
    return {
        // Generujemy unikalny identyfikator zgodny ze standardem RFC 4122
        id: crypto.randomUUID(), 
        text: text.trim(),
        isCompleted: false, // Używamy nowej nazwy pola dla jasności
        createdAt: new Date().toISOString(), // Standard ISO jest lepszy do sortowania
        dueDate: date,
        file: fileId // Referencja do ID w IndexedDB
    };
}