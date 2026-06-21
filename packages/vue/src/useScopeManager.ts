import { ref, computed } from 'vue';
import {
  createScope,
  createScopeManager,
  createCanvasScope,
  createFocusManager,
  INITIAL_PALETTE_NAV,
  type Command,
  type PaletteNavigationState,
  type ScopedRouterOptions,
  type ScopeManager,
  type FocusManagerPort,
} from '@signwriter/editor';
import { createKeyboardRouter } from '@signwriter/interactions';
import type { ComputedRef, Ref } from 'vue';

export interface UseScopeManagerOptions extends ScopedRouterOptions {
  /**
   * Scope tree to register palette/canvas into. Defaults to a fresh
   * createScopeManager(). Inject your own (e.g. from createSignMaker) so
   * SignMaker's scopes live alongside the host application's scopes.
   */
  scopeManager?: ScopeManager;
  /**
   * Focus manager driving DOM focus on scope changes. Defaults to a fresh
   * createFocusManager(). Inject your own to route focus through an
   * application-wide focus system.
   */
  focusManager?: FocusManagerPort;
}

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
  /**
   * Focus manager driving DOM focus on scope changes. Register focus targets
   * by scope name (e.g. focusManager.register('palette', paletteRef.value)).
   * Focus moves automatically when the active scope changes — no watch needed.
   */
  focusManager: FocusManagerPort;
  /**
   * Attach the keyboard handler to an EventTarget. Prefer a scoped container
   * element over `document` so SignMaker does not capture keys globally and
   * can coexist with other widgets / instances on the page.
   * Returns a detach function.
   */
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
  options:  UseScopeManagerOptions = {},
): UseScopeManagerReturn {
  const paletteNav = ref<PaletteNavigationState>(INITIAL_PALETTE_NAV);
  const focusManager = options.focusManager ?? createFocusManager();

  // Canvas scope owns the KeyboardBindings dispatch behaviour.
  const canvasScope = createCanvasScope({
    dispatch,
    onUndo,
    onRedo,
    bindings: options.canvasBindings,
  });

  // Palette scope consumes nothing at the document level — the SymbolPalette
  // component handles arrow keys / Enter / Escape via its own @keydown.
  const paletteScope = createScope('palette');

  const manager = options.scopeManager ?? createScopeManager();
  manager.register(canvasScope);
  manager.register(paletteScope);

  // Reactive mirror of manager.currentScope() for templates / watchers, and
  // automatic focus handoff to the entered scope's registered target.
  const scopeRef = ref<'palette' | 'canvas'>('canvas');
  manager.onScopeChanged((to) => {
    if (to === 'palette' || to === 'canvas') scopeRef.value = to;
    if (to !== null) focusManager.focusScope(to);
  });
  manager.enter('canvas');

  const router = createKeyboardRouter({
    scopeManager: manager,
    scopeSwitchBinding: options.scopeSwitchBinding
      ? {
          keyCode: options.scopeSwitchBinding.keyCode,
          shift:   options.scopeSwitchBinding.shift,
          ctrl:    options.scopeSwitchBinding.ctrl,
        }
      : undefined,
  });

  return {
    scope:       computed(() => scopeRef.value),
    paletteNav,
    manager,
    focusManager,
    attach: router.attach,
  };
}
