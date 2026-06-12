import type { EditorState } from './types';
/**
 * Framework-independent drag state machine.
 *
 * The DragEngine tracks an in-progress drag without touching DOM events.
 * Framework wrappers (Phase 7) translate pointer/mouse/touch events into
 * calls to startDrag / updateDrag / endDrag / cancelDrag.
 *
 * Drag behavior mirrors original signmaker:
 *   - On drag start: deselect all, select the dragged symbol
 *   - On drag end: apply the accumulated pixel delta to the symbol's FSW coords
 *   - On cancel: discard the delta (no state change)
 */
export interface DragState {
    readonly symbolId: string;
    readonly startX: number;
    readonly startY: number;
    readonly deltaX: number;
    readonly deltaY: number;
}
/**
 * Begin dragging a symbol.
 * Returns the new editor state (symbol selected) and the initial drag state.
 */
export declare function startDrag(editorState: EditorState, symbolId: string): {
    editorState: EditorState;
    drag: DragState;
};
/**
 * Update the accumulated drag delta (called on pointer move).
 * Does not modify EditorState — the symbol position is only committed on endDrag.
 */
export declare function updateDrag(drag: DragState, deltaX: number, deltaY: number): DragState;
/**
 * Commit the drag: apply the accumulated delta to the selected symbol's position.
 * Returns the updated EditorState.
 */
export declare function endDrag(editorState: EditorState, drag: DragState): EditorState;
/**
 * Cancel the drag: return the editor state without applying the delta.
 * The symbol remains at its original position.
 */
export declare function cancelDrag(editorState: EditorState): EditorState;
//# sourceMappingURL=DragEngine.d.ts.map