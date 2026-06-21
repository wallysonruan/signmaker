"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaletteDragState = createPaletteDragState;
const DRAG_THRESHOLD = 10;
function defaultIsOverDropZone(clientX, clientY) {
    return document
        .elementsFromPoint(clientX, clientY)
        .some((el) => el.hasAttribute('data-canvas'));
}
/**
 * Framework-agnostic palette drag state machine.
 *
 * Manages the idle → pending → active → (drop | miss | cancel) lifecycle.
 * The caller is responsible for ghost element creation, lifecycle cleanup
 * (e.g. onUnmounted), and reactive isDragging wrappers.
 *
 * @param callbacks  Lifecycle hooks called at each state transition.
 * @param isOverDropZone  Override drop zone detection. Default: checks data-canvas attribute.
 */
function createPaletteDragState(callbacks, isOverDropZone = defaultIsOverDropZone) {
    let pending = null;
    let active = null;
    function removeListeners() {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerCancel);
    }
    function reset() {
        pending = null;
        active = null;
        removeListeners();
    }
    function onPointerMove(e) {
        if (active !== null) {
            if (e.pointerId !== active.pointerId)
                return;
            e.preventDefault();
            callbacks.onDragMove?.(e.clientX, e.clientY);
            return;
        }
        if (pending === null || e.pointerId !== pending.pointerId)
            return;
        const dx = e.clientX - pending.startX;
        const dy = e.clientY - pending.startY;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
            const { key, pointerId } = pending;
            pending = null;
            active = { key, pointerId };
            callbacks.onDragStart?.(key, e.clientX, e.clientY);
            e.preventDefault();
        }
    }
    function onPointerUp(e) {
        if (active !== null && e.pointerId === active.pointerId) {
            const { key } = active;
            const { clientX, clientY } = e;
            reset();
            if (isOverDropZone(clientX, clientY)) {
                callbacks.onDrop(key, clientX, clientY);
            }
            else {
                callbacks.onMiss?.();
            }
            return;
        }
        if (pending !== null && e.pointerId === pending.pointerId) {
            reset();
        }
    }
    function onPointerCancel(e) {
        const wasActive = active !== null && e.pointerId === active.pointerId;
        const wasPending = pending !== null && e.pointerId === pending.pointerId;
        if (wasActive || wasPending) {
            reset();
            if (wasActive)
                callbacks.onCancel?.();
        }
    }
    function onButtonPointerDown(key, e) {
        if (e.button !== 0 && e.pointerType === 'mouse')
            return;
        pending = { key, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId };
        document.addEventListener('pointermove', onPointerMove, { passive: false });
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerCancel);
    }
    return {
        isDragging: () => active !== null,
        onButtonPointerDown,
        dispose: reset,
    };
}
//# sourceMappingURL=createPaletteDragState.js.map