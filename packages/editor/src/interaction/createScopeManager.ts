import type { Unsubscribe } from '../CommandBus';
import type { KeyEventDescriptor } from './ScopedKeyboardRouter';

// ─── Scope ────────────────────────────────────────────────────────────────────

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
export function createScope(name: string, init: ScopeInit = {}): Scope {
  let enabled = init.enabled ?? true;
  const enterHooks: Array<() => void> = [];
  const exitHooks:  Array<() => void> = [];

  function sub<T>(list: T[], fn: T): Unsubscribe {
    list.push(fn);
    return () => { const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1); };
  }

  return {
    name,
    isEnabled: () => enabled,
    enable:    () => { enabled = true; },
    disable:   () => { enabled = false; },
    enter:     () => { enterHooks.forEach(fn => fn()); },
    exit:      () => { exitHooks.forEach(fn => fn()); },
    handleKey: init.handleKey ?? (() => false),
    onEnter:   fn => sub(enterHooks, fn),
    onExit:    fn => sub(exitHooks, fn),
  };
}

// ─── ScopeManager ─────────────────────────────────────────────────────────────

export type ScopeHook        = (scopeName: string) => void;
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
  afterScopeEnter(fn:  ScopeHook): Unsubscribe;
  beforeScopeExit(fn:  ScopeHook): Unsubscribe;
  afterScopeExit(fn:   ScopeHook): Unsubscribe;

  /**
   * Route a key event to the currently active scope's handleKey.
   * @returns true if the scope consumed the event.
   */
  routeKey(e: KeyEventDescriptor): boolean;
}

export function createScopeManager(): ScopeManager {
  const scopes   = new Map<string, Scope>();
  let   current: string | null = null;

  const onChanged:    ScopeChangedHook[] = [];
  const beforeEnter:  ScopeHook[]        = [];
  const afterEnter:   ScopeHook[]        = [];
  const beforeExit:   ScopeHook[]        = [];
  const afterExit:    ScopeHook[]        = [];

  function sub<T>(list: T[], fn: T): Unsubscribe {
    list.push(fn);
    return () => { const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1); };
  }

  function exitCurrent(): void {
    if (current === null) return;
    const prev = current;
    beforeExit.forEach(fn => fn(prev));
    scopes.get(prev)?.exit();
    afterExit.forEach(fn => fn(prev));
    current = null;
  }

  function register(scope: Scope): void {
    scopes.set(scope.name, scope);
  }

  function unregister(name: string): void {
    if (current === name) exit();
    scopes.delete(name);
  }

  function enable(name: string): void {
    scopes.get(name)?.enable();
  }

  function disable(name: string): void {
    const scope = scopes.get(name);
    if (!scope) return;
    scope.disable();
    if (current === name) exit();
  }

  function enter(name: string): void {
    const scope = scopes.get(name);
    if (!scope || !scope.isEnabled() || current === name) return;

    const prev = current;
    exitCurrent();

    beforeEnter.forEach(fn => fn(name));
    current = name;
    scope.enter();
    afterEnter.forEach(fn => fn(name));

    onChanged.forEach(fn => fn(name, prev));
  }

  function exit(): void {
    if (current === null) return;
    const prev = current;
    exitCurrent();
    onChanged.forEach(fn => fn(null, prev));
  }

  function routeKey(e: KeyEventDescriptor): boolean {
    if (current === null) return false;
    return scopes.get(current)?.handleKey(e) ?? false;
  }

  return {
    register,
    unregister,
    enable,
    disable,
    enter,
    exit,
    currentScope:     () => current,
    onScopeChanged:   fn => sub(onChanged,   fn),
    beforeScopeEnter: fn => sub(beforeEnter, fn),
    afterScopeEnter:  fn => sub(afterEnter,  fn),
    beforeScopeExit:  fn => sub(beforeExit,  fn),
    afterScopeExit:   fn => sub(afterExit,   fn),
    routeKey,
  };
}
