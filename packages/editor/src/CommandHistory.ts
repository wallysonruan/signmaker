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
  readonly past:    readonly EditorState[];
  readonly present: EditorState;
  readonly future:  readonly EditorState[];
}

/** Create a history with a single initial state and no past or future. */
export function createHistory(initial: EditorState): History {
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
export function apply(history: History, command: Command): History {
  const next = command(history.present);
  if (next === history.present) return history;  // no-op command
  return {
    past:    [...history.past, history.present],
    present: next,
    future:  [],
  };
}

/** Whether there is a previous state to restore. */
export function canUndo(history: History): boolean {
  return history.past.length > 0;
}

/** Whether there is a future state to restore. */
export function canRedo(history: History): boolean {
  return history.future.length > 0;
}

/**
 * Step back one state.
 * Returns the same history if already at the beginning (no-op).
 */
export function undo(history: History): History {
  if (!canUndo(history)) return history;
  const past    = history.past.slice(0, -1);
  const present = history.past[history.past.length - 1];
  return { past, present, future: [history.present, ...history.future] };
}

/**
 * Step forward one state.
 * Returns the same history if already at the end (no-op).
 */
export function redo(history: History): History {
  if (!canRedo(history)) return history;
  const [present, ...future] = history.future;
  return { past: [...history.past, history.present], present, future };
}
