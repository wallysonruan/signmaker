import type { Scope } from './createScopeManager';
import type { ActionName, KeyBinding } from '../KeyboardBindings';
import type { Command } from '../types';
export interface CanvasScopeDeps {
    /** Dispatch a command transform produced by a canvas keyboard action. */
    dispatch(command: Command): void;
    /** Invoked for the undo action (which has no command transform). */
    onUndo(): void;
    /** Invoked for the redo action. */
    onRedo(): void;
    /** Canvas key bindings. Defaults to DEFAULT_BINDINGS. */
    bindings?: ReadonlyArray<readonly [KeyBinding, ActionName]>;
}
/**
 * Build the canvas interaction scope: it owns the KeyboardBindings dispatch
 * behaviour. lookupAction maps a key event to an action; undo/redo are routed to
 * callbacks (they need external history context), and every other action is
 * turned into a command and dispatched.
 *
 * Returns true from handleKey when it matched (consumed) an action, so the
 * caller can preventDefault.
 */
export declare function createCanvasScope(deps: CanvasScopeDeps): Scope;
//# sourceMappingURL=createCanvasScope.d.ts.map