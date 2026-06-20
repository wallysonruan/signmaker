import { ref, computed } from 'vue';
import {
  createScopeState,
  toggleScope,
  INITIAL_PALETTE_NAV,
  actionToCommand,
  lookupAction,
  DEFAULT_BINDINGS,
  type Command,
  type ScopeState,
  type PaletteNavigationState,
  type ScopedRouterOptions,
  type ActionName,
  type KeyBinding,
} from '@signwriter/editor';
import type { ComputedRef, Ref } from 'vue';

export interface UseScopeManagerReturn {
  /** The currently active scope ('palette' or 'canvas'). */
  scope:      ComputedRef<ScopeState['activeScope']>;
  /**
   * Writable ref for palette navigation state.
   * Bind it as v-model:nav on SymbolPalette:
   *   <SymbolPalette v-model:nav="paletteNav" />
   * Vue auto-unwraps the ref in the template so @update:nav flows back here.
   */
  paletteNav: Ref<PaletteNavigationState>;
  /** Attach the global keyboard handler to an EventTarget. Returns a detach function. */
  attach(el: EventTarget): () => void;
}

/**
 * Combined keyboard manager for apps using both Palette and Canvas.
 * Replaces useKeyboard in the host application.
 *
 * F6 (configurable) toggles between palette and canvas scope.
 * Canvas shortcuts are suppressed while the palette scope is active.
 * Palette shortcuts (arrow keys, Enter, Escape) are handled by the
 * SymbolPalette component's own @keydown when it has DOM focus.
 *
 * Focus management after a scope switch is the host app's responsibility:
 *   watch(scope, (s) => (s === 'palette' ? paletteRef.value?.focus() : canvasRef.value?.focus()))
 */
export function useScopeManager(
  dispatch: (c: Command) => void,
  onUndo:   () => void,
  onRedo:   () => void,
  options:  ScopedRouterOptions = {},
): UseScopeManagerReturn {
  const scopeState = ref<ScopeState>(createScopeState('canvas'));
  const paletteNav = ref<PaletteNavigationState>(INITIAL_PALETTE_NAV);

  const scopeSwitchKeyCode = options.scopeSwitchBinding?.keyCode ?? 117; // F6

  function attach(el: EventTarget): () => void {
    function handleKeydown(event: Event): void {
      const e = event as KeyboardEvent;

      // Skip when focus is in a text input
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      // Global scope-switch shortcut (default: F6)
      if (
        e.keyCode === scopeSwitchKeyCode &&
        (options.scopeSwitchBinding?.shift ?? false) === e.shiftKey &&
        (options.scopeSwitchBinding?.ctrl  ?? false) === e.ctrlKey
      ) {
        e.preventDefault();
        scopeState.value = toggleScope(scopeState.value);
        return;
      }

      // When palette scope is active, palette's own @keydown handles keys.
      if (scopeState.value.activeScope === 'palette') return;

      // Canvas scope: existing KeyboardBindings behaviour
      const bindings = (options.canvasBindings ?? DEFAULT_BINDINGS) as
        ReadonlyArray<readonly [KeyBinding, ActionName]>;
      const action = lookupAction(bindings, e.keyCode, e.shiftKey, e.ctrlKey);

      if (action === null) return;

      if (e.keyCode === 8 || e.keyCode === 9 || e.keyCode === 191) {
        e.preventDefault();
      }

      if (action === 'undo') { onUndo(); return; }
      if (action === 'redo') { onRedo(); return; }

      const command = actionToCommand(action);
      if (command !== null) dispatch(command);
    }

    el.addEventListener('keydown', handleKeydown);
    return () => el.removeEventListener('keydown', handleKeydown);
  }

  return {
    scope:      computed(() => scopeState.value.activeScope),
    paletteNav,
    attach,
  };
}
