export class Router {
    constructor(routes = {}, options = {}) {
        this.routes = routes; // map of path -> handler
        this.options = Object.assign({ mode: 'hash' }, options);
        this._onHashChange = this._onHashChange.bind(this);
    }

    // Start listening and immediately apply current route
    start() {
        window.addEventListener('hashchange', this._onHashChange);
        // Apply current route immediately
        this._onHashChange();
    }

    stop() {
        window.removeEventListener('hashchange', this._onHashChange);
    }

    // Set the hash to a new route + optional query params
    navigateTo(path, params = {}) {
        const q = new URLSearchParams(params).toString();
        const hash = path + (q ? `?${q}` : '');
        if (location.hash !== `#${hash}`) {
            location.hash = hash;
        } else {
            // Force re-run handler when same hash is requested
            this._onHashChange();
        }
    }

    // Internal: handle hash change
    _onHashChange() {
        const raw = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
        const [pathPart, queryString] = raw.split('?');
        const query = Object.fromEntries(new URLSearchParams(queryString || ''));

        // Try exact match first
        if (this.routes[pathPart]) {
            this.routes[pathPart](null, query);
            return;
        }

        // Try pattern matches like /filter/:filter or /task/:id
        for (const pattern in this.routes) {
            const patternParts = pattern.split('/').filter(Boolean);
            const pathParts = pathPart.split('/').filter(Boolean);

            if (patternParts.length !== pathParts.length) continue;

            const params = {};
            let matched = true;

            for (let i = 0; i < patternParts.length; i++) {
                const pp = patternParts[i];
                const ap = pathParts[i];
                if (pp.startsWith(':')) {
                    params[pp.slice(1)] = decodeURIComponent(ap);
                } else if (pp !== ap) {
                    matched = false;
                    break;
                }
            }

            if (matched) {
                this.routes[pattern](params, query);
                return;
            }
        }

        // If nothing matched, try root if present
        if (this.routes['/']) this.routes['/'](null, query);
    }
}
