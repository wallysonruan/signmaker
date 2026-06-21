import { EMPTY_STATE } from './types';
import type { EditorState, Command } from './types';
import { createCommandBus } from './CommandBus';
import type { CommandBusPort } from './CommandBus';
import { createDefaultHistory, createMementoCommand } from './HistoryManager';
import type { HistoryPort } from './HistoryManager';
import { createScopeManager } from './interaction/createScopeManager';
import type { ScopeManager } from './interaction/createScopeManager';
import { createFocusManager } from './interaction/createFocusManager';
import type { FocusManagerPort } from './interaction/createFocusManager';

/**
 * Overrides for the SignMaker composition root. Every port has a default
 * adapter, so all fields are optional — supply only what you want to replace.
 */
export interface SignMakerDeps {
  /** Starting editor state. Default: EMPTY_STATE. Ignored when `history` is given. */
  initialState?: EditorState;
  /** Undo/redo history. Default: createDefaultHistory(initialState). */
  history?:      HistoryPort;
  /** Interaction scope tree. Default: createScopeManager(). */
  scopeManager?: ScopeManager;
  /** DOM focus routing on scope change. Default: createFocusManager(). */
  focusManager?: FocusManagerPort;
  /**
   * Dispatch seam. Default: a bus whose apply() pushes a memento command onto
   * `history`. Advanced — when you inject a bus you are responsible for wiring
   * its apply() to your history; the default path does that for you.
   */
  commandBus?:   CommandBusPort;
}

/**
 * The wired SignMaker instance: the four replaceable ports plus a small facade
 * of convenience methods that delegate to them.
 */
export interface SignMaker {
  readonly history:      HistoryPort;
  readonly bus:          CommandBusPort;
  readonly scopeManager: ScopeManager;
  readonly focusManager: FocusManagerPort;

  /**
   * Dispatch a transform through the bus. The name is threaded into the history
   * entry (and bus hooks) so undo/redo and observers see a meaningful label.
   * Pass '' for an anonymous dispatch.
   */
  dispatch(name: string, transform: Command, payload?: unknown): void;

  getState(): EditorState;
  replace(state: EditorState): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

/**
 * Composition root (inversion of control). Wires the default port adapters
 * together and lets a host application override any of them, so SignMaker
 * participates inside a larger app rather than owning its own services.
 *
 * Framework-agnostic: this constructs no DOM and no reactivity. The Vue adapter
 * `useSignMaker()` layers reactive state and keyboard/focus wiring on top.
 */
export function createSignMaker(deps: SignMakerDeps = {}): SignMaker {
  const history: HistoryPort =
    deps.history ?? createDefaultHistory(deps.initialState ?? EMPTY_STATE);

  const bus: CommandBusPort =
    deps.commandBus ??
    createCommandBus({
      apply(transform: Command, name: string): EditorState {
        history.push(createMementoCommand(name, transform));
        return history.current();
      },
    });

  const scopeManager: ScopeManager = deps.scopeManager ?? createScopeManager();
  const focusManager: FocusManagerPort = deps.focusManager ?? createFocusManager();

  return {
    history,
    bus,
    scopeManager,
    focusManager,
    dispatch: (name, transform, payload) => { bus.dispatch(name, transform, payload); },
    getState: () => history.current(),
    replace:  (state) => history.replace(state),
    undo:     () => history.undo(),
    redo:     () => history.redo(),
    canUndo:  () => history.canUndo(),
    canRedo:  () => history.canRedo(),
  };
}
