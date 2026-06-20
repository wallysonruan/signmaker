import { ref, computed } from 'vue';
import {
  createHistory,
  apply as applyToHistory,
  canUndo,
  canRedo,
  undo as historyUndo,
  redo as historyRedo,
  EMPTY_STATE,
  createCommandBus,
  type History,
  type EditorState,
  type Command,
  type CommandBusPort,
} from '@signwriter/editor';
import type { ComputedRef } from 'vue';

export interface UseEditorStateReturn {
  state:        ComputedRef<EditorState>;
  canUndo:      ComputedRef<boolean>;
  canRedo:      ComputedRef<boolean>;
  /** Command bus — attach beforeCommand / afterCommand / intercept hooks here. */
  bus:          CommandBusPort;
  dispatch(command: Command): void;
  replaceState(newState: EditorState): void;
  undo(): void;
  redo(): void;
}

export function useEditorState(): UseEditorStateReturn {
  const history = ref<History>(createHistory(EMPTY_STATE));

  const bus: CommandBusPort = createCommandBus({
    apply(transform: Command): EditorState {
      history.value = applyToHistory(history.value, transform);
      return history.value.present;
    },
  });

  const state      = computed<EditorState>(() => history.value.present);
  const canUndoRef = computed<boolean>(() => canUndo(history.value));
  const canRedoRef = computed<boolean>(() => canRedo(history.value));

  function dispatch(command: Command): void {
    bus.dispatch('', command);
  }

  function replaceState(newState: EditorState): void {
    history.value = { ...history.value, present: newState };
  }

  function undoFn(): void {
    history.value = historyUndo(history.value);
  }

  function redoFn(): void {
    history.value = historyRedo(history.value);
  }

  return {
    state,
    canUndo: canUndoRef,
    canRedo: canRedoRef,
    bus,
    dispatch,
    replaceState,
    undo: undoFn,
    redo: redoFn,
  };
}
