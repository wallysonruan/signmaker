import { shallowRef, computed, triggerRef } from 'vue';
import {
  createSignMaker,
  type SignMaker,
  type SignMakerDeps,
  type EditorState,
  type Command,
  type CommandBusPort,
  type HistoryPort,
  type ScopeManager,
  type FocusManagerPort,
  type PaletteNavigationState,
} from '@signwriter/editor';
import { useScopeManager, type UseScopeManagerOptions } from './useScopeManager';
import type { ComputedRef, Ref } from 'vue';

export interface UseSignMakerOptions extends SignMakerDeps {
  /**
   * Keyboard routing options (scope-switch key, canvas bindings) forwarded to
   * the scope wiring.
   */
  router?: Pick<UseScopeManagerOptions, 'scopeSwitchBinding' | 'canvasBindings'>;
}

export interface UseSignMakerReturn {
  // ── Reactive editor state ──
  state:    ComputedRef<EditorState>;
  canUndo:  ComputedRef<boolean>;
  canRedo:  ComputedRef<boolean>;

  // ── Reactive interaction state ──
  scope:      ComputedRef<'palette' | 'canvas'>;
  paletteNav: Ref<PaletteNavigationState>;

  // ── Ports (for hooks, interception, replacement) ──
  bus:          CommandBusPort;
  history:      HistoryPort;
  scopeManager: ScopeManager;
  focusManager: FocusManagerPort;
  /** The underlying framework-agnostic composition root. */
  signMaker:    SignMaker;

  // ── Actions ──
  /** Dispatch an anonymous transform. For a named history entry, use bus.dispatch(name, transform). */
  dispatch(command: Command): void;
  replaceState(newState: EditorState): void;
  undo(): void;
  redo(): void;
  /** Attach the scoped keyboard handler to an EventTarget; returns a detach fn. */
  attach(el: EventTarget): () => void;
}

/**
 * Single Vue entry point for SignMaker. Builds the framework-agnostic
 * composition root (createSignMaker) and layers Vue reactivity plus the
 * scope/keyboard/focus wiring on top, so an application needs only one hook.
 *
 * Reactivity is driven by the history's lifecycle hooks: every push/undo/redo/
 * clear bumps a shallowRef holding the (immutable) current state. Inject any
 * port via options (e.g. useSignMaker({ history, scopeManager })) to slot
 * SignMaker into a larger application's services.
 */
export function useSignMaker(options: UseSignMakerOptions = {}): UseSignMakerReturn {
  const { router, ...deps } = options;
  const sm = createSignMaker(deps);

  // Reactive mirror of the immutable current state, bumped via history hooks.
  const stateRef = shallowRef<EditorState>(sm.getState());
  const sync = (): void => {
    stateRef.value = sm.getState();
    triggerRef(stateRef);
  };
  sm.history.onPush(sync);
  sm.history.onUndo(sync);
  sm.history.onRedo(sync);
  sm.history.onClear(sync);

  const state     = computed<EditorState>(() => stateRef.value);
  const canUndoCp = computed<boolean>(() => { void stateRef.value; return sm.canUndo(); });
  const canRedoCp = computed<boolean>(() => { void stateRef.value; return sm.canRedo(); });

  function dispatch(command: Command): void {
    sm.dispatch('', command);
  }
  function replaceState(newState: EditorState): void {
    sm.replace(newState);
    sync();
  }
  function undo(): void { sm.undo(); }
  function redo(): void { sm.redo(); }

  // Reuse the tested scope/keyboard/focus wiring, sharing SignMaker's managers
  // so there is a single scope tree and a single focus manager.
  const { scope, paletteNav, attach } = useScopeManager(dispatch, undo, redo, {
    scopeManager: sm.scopeManager,
    focusManager: sm.focusManager,
    ...router,
  });

  return {
    state,
    canUndo: canUndoCp,
    canRedo: canRedoCp,
    scope,
    paletteNav,
    bus:          sm.bus,
    history:      sm.history,
    scopeManager: sm.scopeManager,
    focusManager: sm.focusManager,
    signMaker:    sm,
    dispatch,
    replaceState,
    undo,
    redo,
    attach,
  };
}
