const DB_NAME = 'TodoApp_Images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export class ImageStore {
    constructor() {
        this.dbPromise = this._initDB();
    }

    // Inicjalizacja IndexedDB

    _initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    // Zapis obrazu (Blob) i zwrócenie jego ID

    async saveImage(file) {
        const db = await this.dbPromise;
        const id = crypto.randomUUID(); // Generujemy unikalne ID dla pliku
        
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            // Zapisujemy sam Blob (plik)
            const request = store.put(file, id);
            
            request.onsuccess = () => resolve(id); // Zwracamy ID, nie plik
            request.onerror = () => reject(request.error);
        });
    }

// Pobranie obrazu jako URL na podstawie ID

    async getImage(id) {
        if (!id) return null;
        const db = await this.dbPromise;
        
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);
            
            request.onsuccess = () => {
                const file = request.result;
                // Zamieniamy plik na URL (blob:http://...), który można wyświetlić w <img>
                resolve(file ? URL.createObjectURL(file) : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Usunięcie obrazu na podstawie ID

    async deleteImage(id) {
        if (!id) return;
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject();
        });
    }
}