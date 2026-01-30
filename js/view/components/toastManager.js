export class ToastManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    show(message, type = 'info') {
        if (!this.container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.container.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
}
