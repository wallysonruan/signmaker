"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGestureController = createGestureController;
const WHEEL_ZOOM_STEP = Math.pow(2, 1 / 4);
function createGestureController(callbacks) {
    function attach(el) {
        const pointerMap = new Map();
        let panOrigin = null;
        let panMoved = false;
        let prevPinchDist = 0;
        let spaceDown = false;
        let symbolDragActive = false;
        function getPinchInfo() {
            if (pointerMap.size < 2)
                return null;
            const [a, b] = [...pointerMap.values()];
            return {
                midX: (a.x + b.x) / 2,
                midY: (a.y + b.y) / 2,
                dist: Math.hypot(b.x - a.x, b.y - a.y),
            };
        }
        function onPointerDown(e) {
            pointerMap.set(e.pointerId, { x: e.clientX, y: e.clientY });
            el.setPointerCapture(e.pointerId);
            // Entering pinch mode: cancel active drag/pan.
            if (pointerMap.size >= 2) {
                if (symbolDragActive) {
                    symbolDragActive = false;
                    callbacks.onSymbolPointerCancel?.();
                }
                panOrigin = null;
                const info = getPinchInfo();
                prevPinchDist = info?.dist ?? 0;
                return;
            }
            // Middle mouse or space+left → pan.
            if (e.button === 1 || (e.button === 0 && spaceDown)) {
                e.preventDefault();
                panOrigin = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
                return;
            }
            // Left button: symbol drag or background pan.
            if (e.button === 0) {
                const symbolEl = e.target.closest('[data-symbol-id]');
                const symbolId = symbolEl?.getAttribute('data-symbol-id') ?? null;
                if (symbolId) {
                    symbolDragActive = true;
                    callbacks.onSymbolPointerDown?.(symbolId, e.clientX, e.clientY);
                }
                else {
                    panMoved = false;
                    panOrigin = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
                }
            }
        }
        function onPointerMove(e) {
            pointerMap.set(e.pointerId, { x: e.clientX, y: e.clientY });
            // Pinch zoom.
            if (pointerMap.size >= 2) {
                const info = getPinchInfo();
                if (info && prevPinchDist > 0) {
                    const factor = info.dist / prevPinchDist;
                    const rect = el.getBoundingClientRect();
                    callbacks.onZoom(factor, info.midX - rect.left, info.midY - rect.top);
                }
                prevPinchDist = info?.dist ?? 0;
                return;
            }
            // Background pan.
            if (panOrigin?.pointerId === e.pointerId) {
                const dx = e.clientX - panOrigin.x;
                const dy = e.clientY - panOrigin.y;
                if (!panMoved && Math.hypot(dx, dy) > 4)
                    panMoved = true;
                panOrigin = { ...panOrigin, x: e.clientX, y: e.clientY };
                callbacks.onPan(dx, dy);
                return;
            }
            // Symbol drag.
            if (symbolDragActive) {
                callbacks.onSymbolPointerMove?.(e.clientX, e.clientY);
            }
        }
        function onPointerUp(e) {
            pointerMap.delete(e.pointerId);
            if (panOrigin?.pointerId === e.pointerId) {
                panOrigin = null;
                return;
            }
            if (symbolDragActive) {
                symbolDragActive = false;
                callbacks.onSymbolPointerUp?.();
            }
        }
        function onPointerCancel(e) {
            pointerMap.delete(e.pointerId);
            if (panOrigin?.pointerId === e.pointerId) {
                panOrigin = null;
                return;
            }
            if (symbolDragActive) {
                symbolDragActive = false;
                callbacks.onSymbolPointerCancel?.();
            }
        }
        function onClick(_e) {
            if (panMoved) {
                panMoved = false;
                return;
            }
            callbacks.onBackgroundClick?.();
        }
        function onWheel(e) {
            e.preventDefault();
            if (e.ctrlKey) {
                const rect = el.getBoundingClientRect();
                const screenX = e.clientX - rect.left;
                const screenY = e.clientY - rect.top;
                const rawDelta = e.deltaMode === 0 ? e.deltaY : e.deltaY * 16;
                const factor = Math.pow(WHEEL_ZOOM_STEP, -rawDelta / 100);
                callbacks.onZoom(factor, screenX, screenY);
                return;
            }
            const dx = e.deltaMode === 0 ? e.deltaX : e.deltaX * 16;
            const dy = e.deltaMode === 0 ? e.deltaY : e.deltaY * 16;
            callbacks.onPan(-dx, -dy);
        }
        function onKeydown(e) {
            if (e.key === ' ' && !e.repeat) {
                spaceDown = true;
                e.preventDefault();
                callbacks.onSpaceDown?.();
            }
        }
        function onKeyup(e) {
            if (e.key === ' ') {
                spaceDown = false;
                callbacks.onSpaceUp?.();
            }
        }
        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointercancel', onPointerCancel);
        el.addEventListener('click', onClick);
        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('keydown', onKeydown);
        el.addEventListener('keyup', onKeyup);
        return () => {
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
            el.removeEventListener('pointercancel', onPointerCancel);
            el.removeEventListener('click', onClick);
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('keydown', onKeydown);
            el.removeEventListener('keyup', onKeyup);
        };
    }
    return { attach };
}
//# sourceMappingURL=createGestureController.js.map