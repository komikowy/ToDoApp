export class ModalManager {
    constructor(dialogId, confirmBtnId, cancelBtnId) {
        this.dialog = document.getElementById(dialogId);
        this.confirmBtn = document.getElementById(confirmBtnId);
        this.cancelBtn = document.getElementById(cancelBtnId);
        
        // Cache'ujemy elementy tekstowe
        this.title = this.dialog?.querySelector('h3');
        this.desc = this.dialog?.querySelector('.dialog-content > p');

        // NOWOŚĆ: Cache'ujemy elementy formularza edycji
        this.inputContainer = document.getElementById('dialog-input-container');
        this.inputField = document.getElementById('dialog-input');

        this._initEvents();
    }

    _initEvents() {
        if (this.cancelBtn && this.dialog) {
            this.cancelBtn.addEventListener('click', () => this.close());
        }
        
        // UX: Zamknięcie po kliknięciu w tło (backdrop)
        if (this.dialog) {
            this.dialog.addEventListener('click', (e) => {
                if (e.target === this.dialog) {
                    this.close();
                }
            });

            // UX: Obsługa Enter w polu input (zatwierdza modal)
            this.dialog.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !this.inputContainer.classList.contains('hidden')) {
                    e.preventDefault();
                    this.confirmBtn?.click();
                }
            });
        }
    }

    bindConfirm(handler) {
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', handler);
        }
    }

    /**
     * Otwiera modal w odpowiednim trybie (edycja lub potwierdzenie).
     * @param {string|null} customTitle - Nagłówek
     * @param {string|null} customDesc - Opis
     * @param {string|null} inputValue - Jeśli podany, włącza tryb edycji z tą wartością
     * @param {string} confirmText - Tekst na przycisku (np. "Usuń", "Zapisz")
     */
    open(customTitle = null, customDesc = null, inputValue = null, confirmText = "Zatwierdź") {
        if (!this.dialog) return;

        // 1. Aktualizacja tekstów
        if (this.title) this.title.textContent = customTitle || "Jesteś pewien?";
        if (this.desc) this.desc.textContent = customDesc || "";
        if (this.confirmBtn) this.confirmBtn.textContent = confirmText;

        // 2. Logika Trybów (Edycja vs Usuwanie)
        if (inputValue !== null) {
            // --- TRYB EDYCJI ---
            this.inputContainer?.classList.remove('hidden');
            
            if (this.inputField) {
                this.inputField.value = inputValue;
                // UX: Ustawiamy kursor na końcu tekstu i dajemy focus
                setTimeout(() => {
                    this.inputField.focus();
                    this.inputField.select();
                }, 50);
            }

            // UX: Zmieniamy styl przycisku na "bezpieczny" (nie czerwony)
            this.confirmBtn?.classList.remove('btn-danger');
            this.confirmBtn?.classList.add('btn-primary'); // (Warto dodać styl btn-primary do CSS)

        } else {
            // --- TRYB USUWANIA / POTWIERDZENIA ---
            this.inputContainer?.classList.add('hidden');
            
            // UX: Przywracamy styl "niebezpieczny" (czerwony)
            this.confirmBtn?.classList.remove('btn-primary');
            this.confirmBtn?.classList.add('btn-danger');
        }

        this.dialog.showModal();
    }

    /**
     * Zwraca aktualną wartość wpisaną w input (dla kontrolera).
     */
    getInputValue() {
        return this.inputField ? this.inputField.value.trim() : null;
    }

    close() {
        this.dialog?.close();
    }
}