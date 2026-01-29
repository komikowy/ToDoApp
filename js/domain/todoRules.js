export const MAX_LENGTH = 200;

export function validateText(text) {
    if (!text) throw new Error("Wpisz treść zadania!");
    if (text.length > MAX_LENGTH) throw new Error("Za długi tekst!");
    return true;
}

export function createTodo(text, image = null, dueDate = null) {
    validateText(text);
    return {
        id: Date.now(),
        text: text,
        done: false,
        image: image,
        dueDate: dueDate,
        createdAt: Date.now()
    };
}