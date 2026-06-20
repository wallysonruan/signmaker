import type { EditorState, Command } from './types';

// ─── Public types ──────────────────────────────────────────────────────────────

export type Unsubscribe = () => void;

/**
 * Result returned by an interceptor.
 *
 * - `continue`  — pass the (optionally modified) transform along the pipeline.
 * - `cancel`    — abort; the transform is never applied.
 * - `handled`   — the interceptor did the work; skip the normal apply path.
 */
export type InterceptorResult =
  | { readonly action: 'continue'; readonly transform?: Command }
  | { readonly action: 'cancel' }
  | { readonly action: 'handled' };

export type DispatchResult =
  | { readonly status: 'applied';   readonly state: EditorState }
  | { readonly status: 'cancelled' }
  | { readonly status: 'handled' };

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
export type Interceptor = (
  name:      string,
  transform: Command,
  payload:   unknown,
) => InterceptorResult;

// ─── Port interface ────────────────────────────────────────────────────────────

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

// ─── Default implementation ────────────────────────────────────────────────────

export interface CommandBusInit {
  /**
   * Called to actually apply the transform to the current state. Must be
   * synchronous. Receives the (possibly intercepted) transform and the command
   * name so the apply step can record a named history entry.
   */
  apply(transform: Command, name: string): EditorState;
}

export function createCommandBus(init: CommandBusInit): CommandBusPort {
  type Entry<T> = { readonly filter: string; readonly fn: T };
  const befores:    Entry<BeforeHook>[]  = [];
  const afters:     Entry<AfterHook>[]   = [];
  const intercepts: Entry<Interceptor>[] = [];

  function matches(filter: string, name: string): boolean {
    return filter === '*' || filter === name;
  }

  function makeUnsub<T>(list: Entry<T>[], entry: Entry<T>): Unsubscribe {
    return () => {
      const i = list.indexOf(entry);
      if (i >= 0) list.splice(i, 1);
    };
  }

  function dispatch(name: string, transform: Command, payload: unknown = undefined): DispatchResult {
    let current = transform;

    for (const { filter, fn } of intercepts) {
      if (!matches(filter, name)) continue;
      const result = fn(name, current, payload);
      if (result.action === 'cancel')  return { status: 'cancelled' };
      if (result.action === 'handled') return { status: 'handled' };
      if (result.action === 'continue' && result.transform) current = result.transform;
    }

    for (const { filter, fn } of befores) {
      if (matches(filter, name)) fn(name, payload);
    }

    const state = init.apply(current, name);

    for (const { filter, fn } of afters) {
      if (matches(filter, name)) fn(name, state, payload);
    }

    return { status: 'applied', state };
  }

  function beforeCommand(filter: string, fn: BeforeHook): Unsubscribe {
    const entry = { filter, fn };
    befores.push(entry);
    return makeUnsub(befores, entry);
  }

  function afterCommand(filter: string, fn: AfterHook): Unsubscribe {
    const entry = { filter, fn };
    afters.push(entry);
    return makeUnsub(afters, entry);
  }

  function intercept(filter: string, fn: Interceptor): Unsubscribe {
    const entry = { filter, fn };
    intercepts.push(entry);
    return makeUnsub(intercepts, entry);
  }

  return { dispatch, beforeCommand, afterCommand, intercept };
}
