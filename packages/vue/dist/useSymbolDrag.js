"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSymbolDrag = useSymbolDrag;
const vue_1 = require("vue");
const editor_1 = require("@signwriter/editor");
function useSymbolDrag(getState, replaceState, dispatch) {
    const activeDrag = (0, vue_1.ref)(null);
    const startX = (0, vue_1.ref)(0);
    const startY = (0, vue_1.ref)(0);
    const isDragging = (0, vue_1.computed)(() => activeDrag.value !== null);
    function onPointerDown(symbolId, clientX, clientY) {
        const { editorState: newState, drag } = (0, editor_1.startDrag)(getState(), symbolId);
        activeDrag.value = drag;
        startX.value = clientX;
        startY.value = clientY;
        replaceState(newState);
    }
    function onPointerMove(clientX, clientY) {
        if (activeDrag.value === null)
            return;
        const deltaX = clientX - startX.value;
        const deltaY = clientY - startY.value;
        activeDrag.value = (0, editor_1.updateDrag)(activeDrag.value, deltaX, deltaY);
    }
    function onPointerUp() {
        if (activeDrag.value === null)
            return;
        const drag = activeDrag.value;
        activeDrag.value = null;
        dispatch((state) => (0, editor_1.endDrag)(state, drag));
    }
    function onPointerCancel() {
        if (activeDrag.value === null)
            return;
        activeDrag.value = null;
        replaceState((0, editor_1.cancelDrag)(getState()));
    }
    return {
        isDragging,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
    };
}
//# sourceMappingURL=useSymbolDrag.js.map