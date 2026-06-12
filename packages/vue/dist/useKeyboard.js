"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeyboard = useKeyboard;
const editor_1 = require("@signwriter/editor");
function useKeyboard(dispatch, onUndo, onRedo) {
    function attach(el) {
        function handleKeydown(event) {
            const e = event;
            const action = (0, editor_1.lookupAction)(editor_1.DEFAULT_BINDINGS, e.keyCode, e.shiftKey, e.ctrlKey);
            if (action === null)
                return;
            // Prevent default for specific key codes
            if (e.keyCode === 8 || e.keyCode === 9 || e.keyCode === 191) {
                e.preventDefault();
            }
            if (action === 'undo') {
                onUndo();
                return;
            }
            if (action === 'redo') {
                onRedo();
                return;
            }
            const command = (0, editor_1.actionToCommand)(action);
            if (command !== null) {
                dispatch(command);
            }
        }
        el.addEventListener('keydown', handleKeydown);
        return () => {
            el.removeEventListener('keydown', handleKeydown);
        };
    }
    return { attach };
}
//# sourceMappingURL=useKeyboard.js.map