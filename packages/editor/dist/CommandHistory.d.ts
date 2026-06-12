import type { EditorState, Command } from './types';
/**
 * Immutable undo/redo history.
 *
 * Equivalent to the original signmaker.vm history array + cursor, but without
 * JSON serialization or the `.replace(/true/g,'false')` normalization hack.
 * Past/present/future are EditorState values; JSON representation is the
 * caller's responsibility.
 */
export interface History {
    readonly past: readonly EditorState[];
    readonly present: EditorState;
    readonly future: readonly EditorState[];
}
/** Create a history with a single initial state and no past or future. */
export declare function createHistory(initial: EditorState): History;
/**
 * Apply a command to the present state.
 *
 * If the resulting state is reference-equal to the current present, no new
 * history entry is pushed (deduplication). Otherwise, the current present
 * becomes the last past entry, the new state becomes present, and the future
 * is cleared (matching the original "new operation after undo truncates redo"
 * behavior).
 */
export declare function apply(history: History, command: Command): History;
/** Whether there is a previous state to restore. */
export declare function canUndo(history: History): boolean;
/** Whether there is a future state to restore. */
export declare function canRedo(history: History): boolean;
/**
 * Step back one state.
 * Returns the same history if already at the beginning (no-op).
 */
export declare function undo(history: History): History;
/**
 * Step forward one state.
 * Returns the same history if already at the end (no-op).
 */
export declare function redo(history: History): History;
//# sourceMappingURL=CommandHistory.d.ts.map