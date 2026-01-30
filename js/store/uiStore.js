export class UIStore {
    constructor() {
        this.state = {
            filter: 'all',      // 'all', 'active', 'completed'
            sort: false,        // false = default, true = active first
            taskToDeleteId: null
        };
    }

    setFilter(mode) {
        this.state.filter = mode;
    }

    getFilter() {
        return this.state.filter;
    }

    setSort(isActive) {
        this.state.sort = isActive;
    }

    getSort() {
        return this.state.sort;
    }

    setTaskToDelete(id) {
        this.state.taskToDeleteId = id;
    }

    getTaskToDelete() {
        return this.state.taskToDeleteId;
    }
    
    clearTaskToDelete() {
        this.state.taskToDeleteId = null;
    }
}
