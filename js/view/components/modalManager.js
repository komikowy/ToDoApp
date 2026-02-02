export class ModalManager {
    constructor(dialogId, confirmBtnId, cancelBtnId) {
        this.dialog = document.getElementById(dialogId);
        this.confirmBtn = document.getElementById(confirmBtnId);
        this.cancelBtn = document.getElementById(cancelBtnId);

        this._initEvents();
    }

    _initEvents() {
        if (this.cancelBtn && this.dialog) {
            this.cancelBtn.addEventListener('click', () => this.close());
        }
    }

    bindConfirm(handler) {
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', handler);
        }
    }

    open() {
        this.dialog?.showModal();
    }

    close() {
        this.dialog?.close();
    }
}