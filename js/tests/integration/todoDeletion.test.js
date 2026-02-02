export async function testTodoDeletionIntegration(controller, store, ui) {
    console.group('🧪 Integration: Todo Deletion Flow');
    
    // Dodajemy zadanie do usunięcia
    const task = { id: crypto.randomUUID(), text: 'Do usunięcia', isCompleted: false };
    store.add(task);

    // Symulacja akcji usuwania (wywołanie modalu)
    controller.handleListAction('delete', task.id);
    console.assert(ui.getTaskToDelete() === task.id, '❌ ID zadania nie zostało ustawione w UIStore');

    // Potwierdzenie usunięcia
    await controller.handleConfirmDelete();
    console.assert(store.getAll().length === 0, '❌ Zadanie nie zostało usunięte z TodoStore');
    console.assert(ui.getTaskToDelete() === null, '❌ UIStore nie został wyczyszczony');

    console.groupEnd();
}