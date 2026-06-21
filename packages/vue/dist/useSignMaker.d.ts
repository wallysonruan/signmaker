import { SignMaker, SignMakerDeps, EditorState, Command, CommandBusPort, HistoryPort, ScopeManager, FocusManagerPort, PaletteNavigationState } from '@signwriter/editor';
import { UseScopeManagerOptions } from './useScopeManager';
import { ComputedRef, Ref } from 'vue';
export interface UseSignMakerOptions extends SignMakerDeps {
    /**
     * Keyboard routing options (scope-switch key, canvas bindings) forwarded to
     * the scope wiring.
     */
    router?: Pick<UseScopeManagerOptions, 'scopeSwitchBinding' | 'canvasBindings'>;
}
export interface UseSignMakerReturn {
    state: ComputedRef<EditorState>;
    canUndo: ComputedRef<boolean>;
    canRedo: ComputedRef<boolean>;
    scope: ComputedRef<'palette' | 'canvas'>;
    paletteNav: Ref<PaletteNavigationState>;
    bus: CommandBusPort;
    history: HistoryPort;
    scopeManager: ScopeManager;
    focusManager: FocusManagerPort;
    /** The underlying framework-agnostic composition root. */
    signMaker: SignMaker;
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
export declare function useSignMaker(options?: UseSignMakerOptions): UseSignMakerReturn;
//# sourceMappingURL=useSignMaker.d.ts.map