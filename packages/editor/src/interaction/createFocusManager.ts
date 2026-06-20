import type { Unsubscribe } from '../CommandBus';

/** Anything that can receive focus (e.g. an HTMLElement or a component handle). */
export interface FocusTarget {
  focus(): void;
}

export type FocusTargetFn = () => void;

/**
 * Maps scope names to focus targets and moves focus on demand.
 *
 * Framework-agnostic: a target is either an object with a focus() method or a
 * plain callback, so the same port works with DOM elements, Vue component
 * handles, test stubs, or a host application's own focus system.
 *
 * The default implementation is one adapter; a consumer can replace it
 * entirely (e.g. to route focus through an application-wide focus manager)
 * without SignMaker knowing which implementation is in use.
 */
export interface FocusManagerPort {
  /**
   * Associate a focus target with a scope name.
   * Re-registering a name replaces the previous target.
   * @returns an unsubscribe that removes the target (only if still current).
   */
  register(scopeName: string, target: FocusTarget | FocusTargetFn): Unsubscribe;

  /**
   * Move focus to the target registered for a scope name.
   * @returns true if a target existed and was invoked.
   */
  focusScope(scopeName: string): boolean;

  /** Whether a target is currently registered for the scope name. */
  hasTarget(scopeName: string): boolean;
}

export function createFocusManager(): FocusManagerPort {
  const targets = new Map<string, FocusTargetFn>();

  function register(scopeName: string, target: FocusTarget | FocusTargetFn): Unsubscribe {
    const fn: FocusTargetFn = typeof target === 'function' ? target : () => target.focus();
    targets.set(scopeName, fn);
    return () => { if (targets.get(scopeName) === fn) targets.delete(scopeName); };
  }

  function focusScope(scopeName: string): boolean {
    const fn = targets.get(scopeName);
    if (!fn) return false;
    fn();
    return true;
  }

  function hasTarget(scopeName: string): boolean {
    return targets.has(scopeName);
  }

  return { register, focusScope, hasTarget };
}
