"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEditorState = useEditorState;
const vue_1 = require("vue");
const editor_1 = require("@signwriter/editor");
function useEditorState() {
    const history = (0, vue_1.ref)((0, editor_1.createHistory)(editor_1.EMPTY_STATE));
    const state = (0, vue_1.computed)(() => history.value.present);
    const canUndoRef = (0, vue_1.computed)(() => (0, editor_1.canUndo)(history.value));
    const canRedoRef = (0, vue_1.computed)(() => (0, editor_1.canRedo)(history.value));
    function dispatch(command) {
        history.value = (0, editor_1.apply)(history.value, command);
    }
    function replaceState(newState) {
        history.value = {
            ...history.value,
            present: newState,
        };
    }
    function undoFn() {
        history.value = (0, editor_1.undo)(history.value);
    }
    function redoFn() {
        history.value = (0, editor_1.redo)(history.value);
    }
    return {
        state,
        canUndo: canUndoRef,
        canRedo: canRedoRef,
        dispatch,
        replaceState,
        undo: undoFn,
        redo: redoFn,
    };
}
//# sourceMappingURL=useEditorState.js.map