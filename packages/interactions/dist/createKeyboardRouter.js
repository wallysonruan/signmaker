"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKeyboardRouter = createKeyboardRouter;
const DEFAULT_SWITCH_BINDING = { keyCode: 117, shift: false, ctrl: false };
const DEFAULT_TOGGLE_SCOPES = ['canvas', 'palette'];
const DEFAULT_PREVENT_KEYS = [8, 9, 191];
function createKeyboardRouter(options) {
    const { scopeManager, scopeSwitchBinding = DEFAULT_SWITCH_BINDING, toggleScopes = DEFAULT_TOGGLE_SCOPES, preventDefaultKeys = DEFAULT_PREVENT_KEYS, } = options;
    function attach(el) {
        function handleKeydown(event) {
            const e = event;
            // Never intercept keys while typing in a text field.
            const target = e.target;
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA')
                return;
            // Scope-switch shortcut (default: F6).
            if (scopeSwitchBinding !== null) {
                const sb = scopeSwitchBinding;
                if (e.keyCode === sb.keyCode &&
                    (sb.shift ?? false) === e.shiftKey &&
                    (sb.ctrl ?? false) === e.ctrlKey) {
                    e.preventDefault();
                    const current = scopeManager.currentScope();
                    const next = current === toggleScopes[0] ? toggleScopes[1] : toggleScopes[0];
                    scopeManager.enter(next);
                    return;
                }
            }
            const descriptor = {
                keyCode: e.keyCode,
                key: e.key,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
            };
            const consumed = scopeManager.routeKey(descriptor);
            if (consumed && preventDefaultKeys.includes(e.keyCode)) {
                e.preventDefault();
            }
        }
        el.addEventListener('keydown', handleKeydown);
        return () => el.removeEventListener('keydown', handleKeydown);
    }
    return { attach };
}
//# sourceMappingURL=createKeyboardRouter.js.map