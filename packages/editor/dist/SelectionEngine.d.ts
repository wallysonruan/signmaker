import type { EditorState, EditorSymbol } from './types';
/** Return all selected symbols in list order. */
export declare function getSelected(state: EditorState): EditorSymbol[];
/** Deselect all symbols. */
export declare function selectNone(state: EditorState): EditorState;
/** Select a single symbol by ID, deselecting all others. */
export declare function selectById(state: EditorState, id: string): EditorState;
/**
 * Cycle selection by step positions through the symbol list (wraps around).
 *
 * Matches original select(step) behavior (index.js:687-701):
 *   - If nothing is selected, treats current index as -1 before stepping
 *   - Deselects all, then selects the single symbol at the new index
 *   - No-op on empty list
 *
 * With nothing selected and step=+1, index becomes (-1+1+len)%len = 0 (first).
 */
export declare function cycleSelection(state: EditorState, step: number): EditorState;
//# sourceMappingURL=SelectionEngine.d.ts.map