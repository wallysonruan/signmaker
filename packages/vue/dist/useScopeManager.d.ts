import { Command, ScopeState, PaletteNavigationState, ScopedRouterOptions } from '@signwriter/editor';
import { ComputedRef, Ref } from 'vue';
export interface UseScopeManagerReturn {
    /** The currently active scope ('palette' or 'canvas'). */
    scope: ComputedRef<ScopeState['activeScope']>;
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
export declare function useScopeManager(dispatch: (c: Command) => void, onUndo: () => void, onRedo: () => void, options?: ScopedRouterOptions): UseScopeManagerReturn;
//# sourceMappingURL=useScopeManager.d.ts.map