import type { ScopeManager } from '@signwriter/editor';
export interface KeyboardRouterOptions {
    scopeManager: ScopeManager;
    /**
     * Key that triggers a scope switch. Default: F6 (keyCode 117).
     * Set to null to disable the built-in toggle.
     */
    scopeSwitchBinding?: {
        keyCode: number;
        shift?: boolean;
        ctrl?: boolean;
    } | null;
    /**
     * The two scope names to toggle between when the scope-switch key is pressed.
     * Default: ['canvas', 'palette'].
     */
    toggleScopes?: readonly [string, string];
    /**
     * Key codes for which preventDefault is called when the event is consumed
     * by the active scope. Default: [8 (Backspace), 9 (Tab), 191 (/)].
     */
    preventDefaultKeys?: readonly number[];
}
export interface KeyboardRouter {
    /** Attach keyboard handling to an EventTarget. Returns a detach function. */
    attach(el: EventTarget): () => void;
}
export declare function createKeyboardRouter(options: KeyboardRouterOptions): KeyboardRouter;
//# sourceMappingURL=createKeyboardRouter.d.ts.map