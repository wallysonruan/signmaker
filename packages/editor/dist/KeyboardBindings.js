"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BINDINGS = void 0;
exports.lookupAction = lookupAction;
exports.actionToCommand = actionToCommand;
const commands_1 = require("./commands");
const SelectionEngine_1 = require("./SelectionEngine");
/**
 * Default keyboard bindings matching config/keyboard.js from the original app.
 *
 * Key codes:
 *   37=Left, 38=Up, 39=Right, 40=Down
 *   8=Backspace, 46=Delete, 9=Tab
 *   90=Z, 191=/ (slash), 190=. (period), 188=, (comma), 78=N
 *   36=Home (Ctrl+Home = center)
 */
exports.DEFAULT_BINDINGS = [
    [{ keyCode: 37 }, 'moveLeft'],
    [{ keyCode: 39 }, 'moveRight'],
    [{ keyCode: 38 }, 'moveUp'],
    [{ keyCode: 40 }, 'moveDown'],
    [{ keyCode: 37, shift: true }, 'moveFastLeft'],
    [{ keyCode: 39, shift: true }, 'moveFastRight'],
    [{ keyCode: 38, shift: true }, 'moveFastUp'],
    [{ keyCode: 40, shift: true }, 'moveFastDown'],
    [{ keyCode: 9 }, 'selectNext'],
    [{ keyCode: 9, shift: true }, 'selectPrev'],
    [{ keyCode: 8 }, 'deleteSelected'],
    [{ keyCode: 46 }, 'deleteSelected'],
    [{ keyCode: 90, ctrl: true }, 'undo'],
    [{ keyCode: 90, ctrl: true, shift: true }, 'redo'],
    [{ keyCode: 191 }, 'rotateRight'],
    [{ keyCode: 191, shift: true }, 'rotateLeft'],
    [{ keyCode: 190 }, 'variation'],
    [{ keyCode: 190, shift: true }, 'variationBack'],
    [{ keyCode: 188 }, 'mirror'],
    [{ keyCode: 78 }, 'fillNext'],
    [{ keyCode: 78, shift: true }, 'fillPrev'],
    [{ keyCode: 36, ctrl: true }, 'center'],
    [{ keyCode: 27 }, 'selectNone'],
];
/**
 * Look up which action a key combo maps to.
 * Returns null if no binding matches.
 */
function lookupAction(bindings, keyCode, shift, ctrl) {
    var _a, _b;
    for (const [binding, action] of bindings) {
        if (binding.keyCode === keyCode &&
            ((_a = binding.shift) !== null && _a !== void 0 ? _a : false) === shift &&
            ((_b = binding.ctrl) !== null && _b !== void 0 ? _b : false) === ctrl) {
            return action;
        }
    }
    return null;
}
/**
 * Convert a non-history ActionName to an inline EditorState Command.
 *
 * Returns null for 'undo', 'redo', and 'center' — these require external
 * context (history stack or size provider) so they cannot be expressed as a
 * plain Command here.
 */
function actionToCommand(action) {
    switch (action) {
        case 'moveLeft': return (0, commands_1.moveSelected)(-1, 0);
        case 'moveRight': return (0, commands_1.moveSelected)(1, 0);
        case 'moveUp': return (0, commands_1.moveSelected)(0, -1);
        case 'moveDown': return (0, commands_1.moveSelected)(0, 1);
        case 'moveFastLeft': return (0, commands_1.moveSelected)(-10, 0);
        case 'moveFastRight': return (0, commands_1.moveSelected)(10, 0);
        case 'moveFastUp': return (0, commands_1.moveSelected)(0, -10);
        case 'moveFastDown': return (0, commands_1.moveSelected)(0, 10);
        case 'selectNext': return (s) => (0, SelectionEngine_1.cycleSelection)(s, 1);
        case 'selectPrev': return (s) => (0, SelectionEngine_1.cycleSelection)(s, -1);
        case 'deleteSelected': return (0, commands_1.deleteSelected)();
        case 'rotateRight': return (0, commands_1.rotateSelected)(1);
        case 'rotateLeft': return (0, commands_1.rotateSelected)(-1);
        case 'variation': return (0, commands_1.variationSelected)(1);
        case 'variationBack': return (0, commands_1.variationSelected)(-1);
        case 'mirror': return (0, commands_1.mirrorSelected)();
        case 'fillNext': return (0, commands_1.fillSelected)(1);
        case 'fillPrev': return (0, commands_1.fillSelected)(-1);
        case 'selectNone': return (s) => (0, SelectionEngine_1.selectNone)(s);
        case 'undo':
        case 'redo':
        case 'center':
            return null;
    }
}
//# sourceMappingURL=KeyboardBindings.js.map