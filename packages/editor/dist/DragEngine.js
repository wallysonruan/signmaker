"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDrag = startDrag;
exports.updateDrag = updateDrag;
exports.endDrag = endDrag;
exports.cancelDrag = cancelDrag;
const SelectionEngine_1 = require("./SelectionEngine");
const commands_1 = require("./commands");
/**
 * Begin dragging a symbol.
 * Returns the new editor state (symbol selected) and the initial drag state.
 */
function startDrag(editorState, symbolId) {
    const afterDeselect = (0, SelectionEngine_1.selectNone)(editorState);
    const afterSelect = (0, SelectionEngine_1.selectById)(afterDeselect, symbolId);
    const drag = { symbolId, startX: 0, startY: 0, deltaX: 0, deltaY: 0 };
    return { editorState: afterSelect, drag };
}
/**
 * Update the accumulated drag delta (called on pointer move).
 * Does not modify EditorState — the symbol position is only committed on endDrag.
 */
function updateDrag(drag, deltaX, deltaY) {
    return { ...drag, deltaX, deltaY };
}
/**
 * Commit the drag: apply the accumulated delta to the selected symbol's position.
 * Returns the updated EditorState.
 */
function endDrag(editorState, drag) {
    if (drag.deltaX === 0 && drag.deltaY === 0)
        return editorState;
    return (0, commands_1.moveSelected)(drag.deltaX, drag.deltaY)(editorState);
}
/**
 * Cancel the drag: return the editor state without applying the delta.
 * The symbol remains at its original position.
 */
function cancelDrag(editorState) {
    return editorState;
}
//# sourceMappingURL=DragEngine.js.map