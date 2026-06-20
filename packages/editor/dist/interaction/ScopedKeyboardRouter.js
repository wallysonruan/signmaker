"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeKeyEvent = routeKeyEvent;
const KeyboardBindings_1 = require("../KeyboardBindings");
const DEFAULT_SCOPE_SWITCH = { keyCode: 117 }; // F6
/** Expand = Ctrl+Enter or Cmd+Enter (keyCode 13 with ctrl or meta). */
function isExpandKey(e) {
    return e.keyCode === 13 && (e.ctrlKey || e.metaKey);
}
function isScopeSwitch(e, binding) {
    var _a, _b;
    return (e.keyCode === binding.keyCode &&
        ((_a = binding.shift) !== null && _a !== void 0 ? _a : false) === e.shiftKey &&
        ((_b = binding.ctrl) !== null && _b !== void 0 ? _b : false) === e.ctrlKey);
}
/**
 * Pure keyboard router.
 *
 * Takes a raw key event descriptor and the current scope + palette nav state,
 * and returns a discriminated-union result describing what should happen.
 * No side effects — callers apply the result.
 */
function routeKeyEvent(e, scope, palette, options = {}) {
    var _a, _b;
    const switchBinding = (_a = options.scopeSwitchBinding) !== null && _a !== void 0 ? _a : DEFAULT_SCOPE_SWITCH;
    const canvasBindings = (_b = options.canvasBindings) !== null && _b !== void 0 ? _b : KeyboardBindings_1.DEFAULT_BINDINGS;
    // Global: scope-switch shortcut fires regardless of active scope
    if (isScopeSwitch(e, switchBinding)) {
        return { type: 'toggleScope' };
    }
    if (scope.activeScope === 'palette') {
        // Escape: back one level (or exit palette scope — caller decides)
        if (e.keyCode === 27) {
            return palette.level === 0
                ? { type: 'toggleScope' } // exit palette → canvas
                : { type: 'paletteBack' };
        }
        // Arrow keys: grid navigation
        if (e.keyCode === 37)
            return { type: 'paletteNavigate', direction: 'left' };
        if (e.keyCode === 39)
            return { type: 'paletteNavigate', direction: 'right' };
        if (e.keyCode === 38)
            return { type: 'paletteNavigate', direction: 'up' };
        if (e.keyCode === 40)
            return { type: 'paletteNavigate', direction: 'down' };
        // Enter: add (plain) or expand (Ctrl/Cmd)
        if (e.keyCode === 13) {
            return isExpandKey(e)
                ? { type: 'paletteExpand' }
                : { type: 'paletteAdd' };
        }
        // All other keys: let DOM handle (Tab moves between back/tab buttons)
        return { type: 'none' };
    }
    // Canvas scope: delegate to existing KeyboardBindings
    const action = (0, KeyboardBindings_1.lookupAction)(canvasBindings, e.keyCode, e.shiftKey, e.ctrlKey);
    if (action === null)
        return { type: 'none' };
    return { type: 'canvasAction', action };
}
//# sourceMappingURL=ScopedKeyboardRouter.js.map