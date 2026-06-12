"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHistory = createHistory;
exports.apply = apply;
exports.canUndo = canUndo;
exports.canRedo = canRedo;
exports.undo = undo;
exports.redo = redo;
/** Create a history with a single initial state and no past or future. */
function createHistory(initial) {
    return { past: [], present: initial, future: [] };
}
/**
 * Apply a command to the present state.
 *
 * If the resulting state is reference-equal to the current present, no new
 * history entry is pushed (deduplication). Otherwise, the current present
 * becomes the last past entry, the new state becomes present, and the future
 * is cleared (matching the original "new operation after undo truncates redo"
 * behavior).
 */
function apply(history, command) {
    const next = command(history.present);
    if (next === history.present)
        return history; // no-op command
    return {
        past: [...history.past, history.present],
        present: next,
        future: [],
    };
}
/** Whether there is a previous state to restore. */
function canUndo(history) {
    return history.past.length > 0;
}
/** Whether there is a future state to restore. */
function canRedo(history) {
    return history.future.length > 0;
}
/**
 * Step back one state.
 * Returns the same history if already at the beginning (no-op).
 */
function undo(history) {
    if (!canUndo(history))
        return history;
    const past = history.past.slice(0, -1);
    const present = history.past[history.past.length - 1];
    return { past, present, future: [history.present, ...history.future] };
}
/**
 * Step forward one state.
 * Returns the same history if already at the end (no-op).
 */
function redo(history) {
    if (!canRedo(history))
        return history;
    const [present, ...future] = history.future;
    return { past: [...history.past, history.present], present, future };
}
//# sourceMappingURL=CommandHistory.js.map