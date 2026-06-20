import type { EditorState, Command } from './types';
export type Unsubscribe = () => void;
/**
 * Result returned by an interceptor.
 *
 * - `continue`  — pass the (optionally modified) transform along the pipeline.
 * - `cancel`    — abort; the transform is never applied.
 * - `handled`   — the interceptor did the work; skip the normal apply path.
 */
export type InterceptorResult = {
    readonly action: 'continue';
    readonly transform?: Command;
} | {
    readonly action: 'cancel';
} | {
    readonly action: 'handled';
};
export type DispatchResult = {
    readonly status: 'applied';
    readonly state: EditorState;
} | {
    readonly status: 'cancelled';
} | {
    readonly status: 'handled';
};
/**
 * Called before a transform is applied.
 * @param name    Command name, or '' for unnamed/anonymous dispatches.
 * @param payload Optional caller-supplied metadata.
 */
export type BeforeHook = (name: string, payload: unknown) => void;
/**
 * Called after a transform has been applied.
 * @param name    Command name.
 * @param state   The resulting EditorState.
 * @param payload Optional caller-supplied metadata.
 */
export type AfterHook = (name: string, state: EditorState, payload: unknown) => void;
/**
 * Intercepts a dispatch before it reaches the before-hooks and apply step.
 * Receives the current transform (possibly already modified by a prior interceptor).
 */
export type Interceptor = (name: string, transform: Command, payload: unknown) => InterceptorResult;
/**
 * Central dispatch seam.
 *
 * All state-mutating operations should flow through the bus so that
 * cross-cutting concerns (analytics, telemetry, validation, collaboration)
 * can observe or intercept them without touching application code.
 *
 * `nameFilter` can be a specific command name or `'*'` to match all commands.
 */
export interface CommandBusPort {
    /** Dispatch a named or anonymous command transform. */
    dispatch(name: string, transform: Command, payload?: unknown): DispatchResult;
    /** Register a hook that fires before the transform is applied. */
    beforeCommand(nameFilter: string, fn: BeforeHook): Unsubscribe;
    /** Register a hook that fires after the transform is applied. */
    afterCommand(nameFilter: string, fn: AfterHook): Unsubscribe;
    /**
     * Register an interceptor that can continue, modify, cancel, or handle a
     * command before any hooks or the apply step run.
     * Interceptors run in registration order; the first cancel or handled wins.
     */
    intercept(nameFilter: string, handler: Interceptor): Unsubscribe;
}
export interface CommandBusInit {
    /**
     * Called to actually apply the transform to the current state. Must be
     * synchronous. Receives the (possibly intercepted) transform and the command
     * name so the apply step can record a named history entry.
     */
    apply(transform: Command, name: string): EditorState;
}
export declare function createCommandBus(init: CommandBusInit): CommandBusPort;
//# sourceMappingURL=CommandBus.d.ts.map