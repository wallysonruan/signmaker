import { ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import {
  EMPTY_STATE,
  createHistory,
  apply,
  undo,
  redo,
  canUndo,
  canRedo,
} from '@signwriter/editor';
import type { EditorState, Command, History } from '@signwriter/editor';

export interface UseEditorStateReturn {
  state: ComputedRef<EditorState>;
  canUndo: ComputedRef<boolean>;
  canRedo: ComputedRef<boolean>;
  dispatch(command: Command): void;
  replaceState(state: EditorState): void;
  undo(): void;
  redo(): void;
}

export function useEditorState(): UseEditorStateReturn {
  const history = ref<History>(createHistory(EMPTY_STATE));

  const state = computed<EditorState>(() => history.value.present);
  const canUndoRef = computed<boolean>(() => canUndo(history.value));
  const canRedoRef = computed<boolean>(() => canRedo(history.value));

  function dispatch(command: Command): void {
    history.value = apply(history.value, command);
  }

  function replaceState(newState: EditorState): void {
    history.value = {
      ...history.value,
      present: newState,
    };
  }

  function undoFn(): void {
    history.value = undo(history.value);
  }

  function redoFn(): void {
    history.value = redo(history.value);
  }

  return {
    state,
    canUndo: canUndoRef,
    canRedo: canRedoRef,
    dispatch,
    replaceState,
    undo: undoFn,
    redo: redoFn,
  };
}
