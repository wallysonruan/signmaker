import { ref, computed } from 'vue';
import {
  createScope,
  createScopeManager,
  INITIAL_PALETTE_NAV,
  actionToCommand,
  lookupAction,
  DEFAULT_BINDINGS,
  type Command,
  type PaletteNavigationState,
  type ScopedRouterOptions,
  type ActionName,
  type KeyBinding,
  type KeyEventDescriptor,
  type ScopeManager,
} from '@signwriter/editor';
import type { ComputedRef, Ref } from 'vue';

export interface UseScopeManagerReturn {
  /** The currently active scope ('palette' or 'canvas'). */
  scope:      ComputedRef<'palette' | 'canvas'>;
  /**
   * Writable ref for palette navigation state.
   * Bind it as v-model:nav on SymbolPalette:
   *   <SymbolPalette v-model:nav="paletteNav" />
   * Vue auto-unwraps the ref in the template so @update:nav flows back here.
   */
  paletteNav: Ref<PaletteNavigationState>;
  /**
   * The underlying generic ScopeManager. Use it to register additional scopes,
   * enable/disable palette or canvas, observe transitions (onScopeChanged), or
   * hook the scope lifecycle (beforeScopeEnter/afterScopeExit, …).
   *
   * SignMaker registers 'palette' and 'canvas' here; a host application can
   * register its own sibling scopes on the same manager so SignMaker cooperates
   * as just another participant rather than owning interaction.
   */
  manager:    ScopeManager;
  /** Attach the global keyboard handler to an EventTarget. Returns a detach function. */
  attach(el: EventTarget): () => void;
}

/**
 * Combined keyboard manager for apps using both Palette and Canvas.
 * Replaces useKeyboard in the host application.
 *
 * Built on the framework-agnostic createScopeManager: 'palette' and 'canvas'
 * are registered as scopes. F6 (configurable) toggles between them. Canvas
 * shortcuts are routed through the active scope's handler; palette shortcuts
 * (arrow keys, Enter, Escape) are handled by the SymbolPalette component's own
 * @keydown when it has DOM focus, so the palette scope here consumes nothing.
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
  const paletteNav = ref<PaletteNavigationState>(INITIAL_PALETTE_NAV);

  const bindings = (options.canvasBindings ?? DEFAULT_BINDINGS) as
    ReadonlyArray<readonly [KeyBinding, ActionName]>;

  // Canvas scope owns the KeyboardBindings dispatch behaviour. Returns true
  // when it matched (consumed) an action, so the caller can preventDefault.
  const canvasScope = createScope('canvas', {
    handleKey(e: KeyEventDescriptor): boolean {
      const action = lookupAction(bindings, e.keyCode, e.shiftKey, e.ctrlKey);
      if (action === null) return false;
      if (action === 'undo') { onUndo(); return true; }
      if (action === 'redo') { onRedo(); return true; }
      const command = actionToCommand(action);
      if (command !== null) dispatch(command);
      return true;
    },
  });

  // Palette scope consumes nothing at the document level — the SymbolPalette
  // component handles arrow keys / Enter / Escape via its own @keydown.
  const paletteScope = createScope('palette');

  const manager = createScopeManager();
  manager.register(canvasScope);
  manager.register(paletteScope);

  // Reactive mirror of manager.currentScope() for templates / watchers.
  const scopeRef = ref<'palette' | 'canvas'>('canvas');
  manager.onScopeChanged((to) => {
    if (to === 'palette' || to === 'canvas') scopeRef.value = to;
  });
  manager.enter('canvas');

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
        manager.enter(scopeRef.value === 'canvas' ? 'palette' : 'canvas');
        return;
      }

      const descriptor: KeyEventDescriptor = {
        keyCode:  e.keyCode,
        key:      e.key,
        shiftKey: e.shiftKey,
        ctrlKey:  e.ctrlKey,
        metaKey:  e.metaKey,
      };

      const consumed = manager.routeKey(descriptor);
      if (consumed && (e.keyCode === 8 || e.keyCode === 9 || e.keyCode === 191)) {
        e.preventDefault();
      }
    }

    el.addEventListener('keydown', handleKeydown);
    return () => el.removeEventListener('keydown', handleKeydown);
  }

  return {
    scope:      computed(() => scopeRef.value),
    paletteNav,
    manager,
    attach,
  };
}
