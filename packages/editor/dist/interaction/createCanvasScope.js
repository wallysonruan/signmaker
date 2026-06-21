"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCanvasScope = createCanvasScope;
const createScopeManager_1 = require("./createScopeManager");
const KeyboardBindings_1 = require("../KeyboardBindings");
/**
 * Build the canvas interaction scope: it owns the KeyboardBindings dispatch
 * behaviour. lookupAction maps a key event to an action; undo/redo are routed to
 * callbacks (they need external history context), and every other action is
 * turned into a command and dispatched.
 *
 * Returns true from handleKey when it matched (consumed) an action, so the
 * caller can preventDefault.
 */
function createCanvasScope(deps) {
    var _a;
    const bindings = (_a = deps.bindings) !== null && _a !== void 0 ? _a : KeyboardBindings_1.DEFAULT_BINDINGS;
    return (0, createScopeManager_1.createScope)('canvas', {
        handleKey(e) {
            const action = (0, KeyboardBindings_1.lookupAction)(bindings, e.keyCode, e.shiftKey, e.ctrlKey);
            if (action === null)
                return false;
            if (action === 'undo') {
                deps.onUndo();
                return true;
            }
            if (action === 'redo') {
                deps.onRedo();
                return true;
            }
            const command = (0, KeyboardBindings_1.actionToCommand)(action);
            if (command !== null)
                deps.dispatch(command);
            return true;
        },
    });
}
//# sourceMappingURL=createCanvasScope.js.map