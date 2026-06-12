import type { EditorState } from './types';
import { selectNone, selectById } from './SelectionEngine';
import { moveSelected } from './commands';

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
  readonly startX:   number;  // cumulative delta from drag start (in FSW coords / pixels)
  readonly startY:   number;
  readonly deltaX:   number;
  readonly deltaY:   number;
}

/**
 * Begin dragging a symbol.
 * Returns the new editor state (symbol selected) and the initial drag state.
 */
export function startDrag(
  editorState: EditorState,
  symbolId: string,
): { editorState: EditorState; drag: DragState } {
  const afterDeselect  = selectNone(editorState);
  const afterSelect    = selectById(afterDeselect, symbolId);
  const drag: DragState = { symbolId, startX: 0, startY: 0, deltaX: 0, deltaY: 0 };
  return { editorState: afterSelect, drag };
}

/**
 * Update the accumulated drag delta (called on pointer move).
 * Does not modify EditorState — the symbol position is only committed on endDrag.
 */
export function updateDrag(drag: DragState, deltaX: number, deltaY: number): DragState {
  return { ...drag, deltaX, deltaY };
}

/**
 * Commit the drag: apply the accumulated delta to the selected symbol's position.
 * Returns the updated EditorState.
 */
export function endDrag(
  editorState: EditorState,
  drag: DragState,
): EditorState {
  if (drag.deltaX === 0 && drag.deltaY === 0) return editorState;
  return moveSelected(drag.deltaX, drag.deltaY)(editorState);
}

/**
 * Cancel the drag: return the editor state without applying the delta.
 * The symbol remains at its original position.
 */
export function cancelDrag(editorState: EditorState): EditorState {
  return editorState;
}
