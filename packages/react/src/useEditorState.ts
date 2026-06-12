import { useReducer, useCallback } from 'react';
import type { EditorState, Command } from '@signwriter/editor';
import {
  EMPTY_STATE,
  createHistory, apply, canUndo, canRedo, undo, redo,
} from '@signwriter/editor';
import type { History } from '@signwriter/editor';

// ── Action types ──────────────────────────────────────────────────────────────

type Action =
  | { type: 'DISPATCH'; command: Command }
  | { type: 'REPLACE'; state: EditorState }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(history: History, action: Action): History {
  switch (action.type) {
    case 'DISPATCH': return apply(history, action.command);
    case 'REPLACE':  return { ...history, present: action.state };
    case 'UNDO':     return undo(history);
    case 'REDO':     return redo(history);
  }
}

// ── Public return type ────────────────────────────────────────────────────────

export interface UseEditorStateResult {
  state: EditorState;
  canUndo: boolean;
  canRedo: boolean;
  dispatch(command: Command): void;
  replaceState(state: EditorState): void;
  undo(): void;
  redo(): void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEditorState(initial?: EditorState): UseEditorStateResult {
  const [history, send] = useReducer(
    reducer,
    null,
    () => createHistory(initial ?? EMPTY_STATE),
  );

  const dispatch = useCallback(
    (command: Command) => send({ type: 'DISPATCH', command }),
    [],
  );

  const replaceState = useCallback(
    (state: EditorState) => send({ type: 'REPLACE', state }),
    [],
  );

  const undoFn = useCallback(() => send({ type: 'UNDO' }), []);
  const redoFn = useCallback(() => send({ type: 'REDO' }), []);

  return {
    state:    history.present,
    canUndo:  canUndo(history),
    canRedo:  canRedo(history),
    dispatch,
    replaceState,
    undo:     undoFn,
    redo:     redoFn,
  };
}
