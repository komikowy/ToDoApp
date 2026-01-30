export const MAX_LENGTH = 200;

export function validateText(text) {
    if (!text) throw new Error("Wpisz treść zadania!");
    if (text.length > MAX_LENGTH) throw new Error("Za długi tekst!");
    return true;
}

export function createTodo(text, date = null, file = null) {
    if (!text || typeof text !== 'string') {
        throw new Error("Validation Error: Task text is required and must be a string.");
    }

    return {
        id: self.crypto && self.crypto.randomUUID 
            ? self.crypto.randomUUID() 
            : 'id-' + Date.now().toString(36) + Math.random().toString(36).substr(2),
        text: text.trim(),
        isCompleted: false,
        createdAt: new Date().toISOString(),
        dueDate: date || null,
        file: file || null
    };
}