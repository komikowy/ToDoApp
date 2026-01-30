// js/store/imageStore.js

const DB_NAME = 'TodoApp_Images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export class ImageStore {
    constructor() {
        this.dbPromise = this._initDB();
    }

    _initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME); // Key-Value store (ID -> Blob)
                }
            };
        });
    }

    async saveImage(file) {
        if (!file) return null;
        
        // Generujemy ID dla obrazka (UUID)
        const imageId = self.crypto.randomUUID();
        const db = await this.dbPromise;
        
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            // Zapisujemy czysty Blob/File (nie Base64!)
            const request = store.put(file, imageId);
            
            request.onsuccess = () => resolve(imageId); // Zwracamy TYLKO ID
            request.onerror = () => reject(request.error);
        });
    }

    async getImage(imageId) {
        if (!imageId) return null;
        
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(imageId);
            
            request.onsuccess = () => {
                const fileBlob = request.result;
                // Zamieniamy Blob na tymczasowy URL (blob:http://...)
                // To jest super szybkie i nie zatyka pamięci RAM stringami base64
                resolve(fileBlob ? URL.createObjectURL(fileBlob) : null);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteImage(imageId) {
        if(!imageId) return;
        const db = await this.dbPromise;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(imageId);
    }
}