"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFocusManager = createFocusManager;
function createFocusManager() {
    const targets = new Map();
    function register(scopeName, target) {
        const fn = typeof target === 'function' ? target : () => target.focus();
        targets.set(scopeName, fn);
        return () => { if (targets.get(scopeName) === fn)
            targets.delete(scopeName); };
    }
    function focusScope(scopeName) {
        const fn = targets.get(scopeName);
        if (!fn)
            return false;
        fn();
        return true;
    }
    function hasTarget(scopeName) {
        return targets.has(scopeName);
    }
    return { register, focusScope, hasTarget };
}
//# sourceMappingURL=createFocusManager.js.map