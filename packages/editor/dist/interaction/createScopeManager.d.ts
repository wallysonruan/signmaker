import type { Unsubscribe } from '../CommandBus';
import type { KeyEventDescriptor } from './ScopedKeyboardRouter';
/**
 * A named, enable/disable-able interaction unit that can handle key events and
 * fire lifecycle hooks when it becomes active or inactive.
 *
 * Scopes are registered with a ScopeManager; the manager calls enter()/exit()
 * during transitions and delegates key events via handleKey().
 */
export interface Scope {
    readonly name: string;
    isEnabled(): boolean;
    enable(): void;
    disable(): void;
    /** Called by the manager when this scope becomes the active scope. */
    enter(): void;
    /** Called by the manager when this scope is no longer the active scope. */
    exit(): void;
    /**
     * Handle a key event while this scope is active.
     * @returns true if the event was consumed (caller should call preventDefault).
     */
    handleKey(e: KeyEventDescriptor): boolean;
    onEnter(fn: () => void): Unsubscribe;
    onExit(fn: () => void): Unsubscribe;
}
export interface ScopeInit {
    /** Whether the scope starts enabled. Default: true. */
    enabled?: boolean;
    /** Key event handler; return true to signal consumption. Default: always returns false. */
    handleKey?: (e: KeyEventDescriptor) => boolean;
}
/** Create a minimal Scope with optional key handling. */
export declare function createScope(name: string, init?: ScopeInit): Scope;
export type ScopeHook = (scopeName: string) => void;
export type ScopeChangedHook = (to: string | null, from: string | null) => void;
/**
 * Manages a set of named scopes.
 *
 * Scopes are registered dynamically. At most one scope is active at a time.
 * Lifecycle hooks fire on every transition; individual scopes also fire their
 * own enter/exit hooks when the manager transitions them.
 *
 * The host application may register its own scopes and embed SignMaker's scopes
 * as siblings, treating SignMaker as just another participant in a shared scope
 * tree rather than an owner of interaction.
 */
export interface ScopeManager {
    register(scope: Scope): void;
    unregister(name: string): void;
    enable(name: string): void;
    disable(name: string): void;
    /**
     * Transition to a named scope.
     * No-op when the scope is unknown, disabled, or already active.
     */
    enter(name: string): void;
    /** Exit the current scope (sets active scope to null). */
    exit(): void;
    /** Returns the name of the currently active scope, or null if none. */
    currentScope(): string | null;
    onScopeChanged(fn: ScopeChangedHook): Unsubscribe;
    beforeScopeEnter(fn: ScopeHook): Unsubscribe;
    afterScopeEnter(fn: ScopeHook): Unsubscribe;
    beforeScopeExit(fn: ScopeHook): Unsubscribe;
    afterScopeExit(fn: ScopeHook): Unsubscribe;
    /**
     * Route a key event to the currently active scope's handleKey.
     * @returns true if the scope consumed the event.
     */
    routeKey(e: KeyEventDescriptor): boolean;
}
export declare function createScopeManager(): ScopeManager;
//# sourceMappingURL=createScopeManager.d.ts.map