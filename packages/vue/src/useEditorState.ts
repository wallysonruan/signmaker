import { shallowRef, computed, triggerRef } from 'vue';
import {
  EMPTY_STATE,
  createCommandBus,
  createDefaultHistory,
  createMementoCommand,
  type EditorState,
  type Command,
  type CommandBusPort,
  type HistoryPort,
} from '@wallysonruan/signmaker-editor-engine';
import type { ComputedRef, ShallowRef } from 'vue';

export interface UseEditorStateOptions {
  /**
   * Replaceable history. Defaults to createDefaultHistory(EMPTY_STATE).
   * Inject your own HistoryPort (event sourcing, a shared application-wide
   * stack, collaboration) without SignMaker knowing the implementation.
   */
  history?: HistoryPort;
}

export interface UseEditorStateReturn {
  state:        ComputedRef<EditorState>;
  canUndo:      ComputedRef<boolean>;
  canRedo:      ComputedRef<boolean>;
  /** Command bus — attach beforeCommand / afterCommand / intercept hooks here. */
  bus:          CommandBusPort;
  /** The underlying history port — attach onPush/onUndo/… hooks or replace it. */
  history:      HistoryPort;
  /** Dispatch an anonymous transform. For a named history entry + named hooks, use bus.dispatch(name, transform). */
  dispatch(command: Command): void;
  replaceState(newState: EditorState): void;
  undo(): void;
  redo(): void;
}

export function useEditorState(options: UseEditorStateOptions = {}): UseEditorStateReturn {
  const history: HistoryPort = options.history ?? createDefaultHistory(EMPTY_STATE);

  // A shallowRef whose .value is the history's current state. We bump it
  // explicitly after each mutation so Vue tracks the (immutable) state object
  // by reference without deeply proxying it.
  const stateRef: ShallowRef<EditorState> = shallowRef(history.current());
  const sync = (): void => {
    stateRef.value = history.current();
    triggerRef(stateRef);
  };

  const bus: CommandBusPort = createCommandBus({
    apply(transform: Command, name: string): EditorState {
      history.push(createMementoCommand(name, transform));
      sync();
      return history.current();
    },
  });

  const state     = computed<EditorState>(() => stateRef.value);
  const canUndoCp = computed<boolean>(() => { void stateRef.value; return history.canUndo(); });
  const canRedoCp = computed<boolean>(() => { void stateRef.value; return history.canRedo(); });

  function dispatch(command: Command): void {
    bus.dispatch('', command);
  }

  function replaceState(newState: EditorState): void {
    history.replace(newState);
    sync();
  }

  function undoFn(): void {
    history.undo();
    sync();
  }

  function redoFn(): void {
    history.redo();
    sync();
  }

  return {
    state,
    canUndo: canUndoCp,
    canRedo: canRedoCp,
    bus,
    history,
    dispatch,
    replaceState,
    undo: undoFn,
    redo: redoFn,
  };
}
