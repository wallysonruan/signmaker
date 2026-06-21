export interface PaletteDragCallbacks {
    /** Called once when the drag threshold is crossed and the drag becomes active. */
    onDragStart?(key: string, clientX: number, clientY: number): void;
    /** Called on every pointer move while the drag is active. */
    onDragMove?(clientX: number, clientY: number): void;
    /** Called when the pointer is released over a valid drop zone. */
    onDrop(key: string, clientX: number, clientY: number): void;
    /** Called when the pointer is released outside any drop zone. */
    onMiss?(): void;
    /** Called when the drag is cancelled (e.g. pointercancel). */
    onCancel?(): void;
}
export interface PaletteDragController {
    /** Whether a drag is currently active (threshold crossed, not yet released). */
    isDragging(): boolean;
    /** Call this from pointerdown on the draggable button. */
    onButtonPointerDown(key: string, e: PointerEvent): void;
    /** Release global event listeners and reset state. */
    dispose(): void;
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
export declare function createPaletteDragState(callbacks: PaletteDragCallbacks, isOverDropZone?: (clientX: number, clientY: number) => boolean): PaletteDragController;
//# sourceMappingURL=createPaletteDragState.d.ts.map