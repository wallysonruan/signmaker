import type { EditorState, Command } from './types';
import type { Unsubscribe } from './CommandBus';

// ─── ReversibleCommand ──────────────────────────────────────────────────────────

/**
 * A first-class, reversible command.
 *
 * Unlike the bare `Command` transform ((state) => state), a ReversibleCommand
 * carries a name and knows how to undo itself. History depends on this
 * interface — not the other way around — so an application can push its own
 * command types onto a shared history alongside SignMaker's.
 */
export interface ReversibleCommand {
  readonly name: string;
  /** Apply the command, returning the next state. */
  execute(state: EditorState): EditorState;
  /** Reverse the command, returning the prior state. */
  undo(state: EditorState): EditorState;
}

/**
 * Wrap a pure transform into a reversible command using the memento pattern:
 * the pre-execute state is captured during execute() and restored by undo().
 *
 * This gives every existing command factory (addSymbol, moveSelected, …) a
 * correct inverse for free, without hand-writing reverse logic. Each instance
 * is single-use per history slot; redo re-executes and re-captures.
 */
export function createMementoCommand(name: string, transform: Command): ReversibleCommand {
  let before: EditorState | undefined;
  return {
    name,
    execute(state: EditorState): EditorState {
      before = state;
      return transform(state);
    },
    undo(_state: EditorState): EditorState {
      // Returns the captured pre-execute state. _state is the post-execute
      // present; ignored because the memento restores by value.
      return before as EditorState;
    },
  };
}

// ─── HistoryPort ────────────────────────────────────────────────────────────────

export type HistoryCommandHook = (command: ReversibleCommand) => void;

/**
 * Replaceable undo/redo history.
 *
 * The default implementation is one adapter; consumers can inject their own
 * (event sourcing, collaboration, a shared application-wide stack) without
 * SignMaker knowing which implementation is in use.
 */
export interface HistoryPort {
  /** Execute a command and record it; clears the redo stack. No-ops are not recorded. */
  push(command: ReversibleCommand): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  /** The current state. */
  current(): EditorState;
  /** Replace the current state without recording a history entry (e.g. external load). */
  replace(state: EditorState): void;
  /** Drop all past/future entries, keeping the current state. */
  clear(): void;

  onPush(fn:  HistoryCommandHook): Unsubscribe;
  onUndo(fn:  HistoryCommandHook): Unsubscribe;
  onRedo(fn:  HistoryCommandHook): Unsubscribe;
  onClear(fn: () => void): Unsubscribe;

  beforePush(fn: HistoryCommandHook): Unsubscribe;
  afterPush(fn:  HistoryCommandHook): Unsubscribe;
  beforeUndo(fn: HistoryCommandHook): Unsubscribe;
  afterUndo(fn:  HistoryCommandHook): Unsubscribe;
  beforeRedo(fn: HistoryCommandHook): Unsubscribe;
  afterRedo(fn:  HistoryCommandHook): Unsubscribe;
}

export function createDefaultHistory(initial: EditorState): HistoryPort {
  let present: EditorState = initial;
  const past:   ReversibleCommand[] = [];
  const future: ReversibleCommand[] = [];

  const hooks = {
    push:       [] as HistoryCommandHook[],
    undo:       [] as HistoryCommandHook[],
    redo:       [] as HistoryCommandHook[],
    clear:      [] as Array<() => void>,
    beforePush: [] as HistoryCommandHook[],
    afterPush:  [] as HistoryCommandHook[],
    beforeUndo: [] as HistoryCommandHook[],
    afterUndo:  [] as HistoryCommandHook[],
    beforeRedo: [] as HistoryCommandHook[],
    afterRedo:  [] as HistoryCommandHook[],
  };

  function sub<T>(list: T[], fn: T): Unsubscribe {
    list.push(fn);
    return () => { const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1); };
  }

  function push(command: ReversibleCommand): void {
    const next = command.execute(present);
    if (next === present) return; // no-op dedup (reference equality), matches prior behavior

    hooks.beforePush.forEach(fn => fn(command));
    past.push(command);
    present = next;
    future.length = 0;
    hooks.afterPush.forEach(fn => fn(command));
    hooks.push.forEach(fn => fn(command));
  }

  function undo(): void {
    const command = past[past.length - 1];
    if (!command) return;

    hooks.beforeUndo.forEach(fn => fn(command));
    present = command.undo(present);
    past.pop();
    future.unshift(command);
    hooks.afterUndo.forEach(fn => fn(command));
    hooks.undo.forEach(fn => fn(command));
  }

  function redo(): void {
    const command = future[0];
    if (!command) return;

    hooks.beforeRedo.forEach(fn => fn(command));
    present = command.execute(present);
    future.shift();
    past.push(command);
    hooks.afterRedo.forEach(fn => fn(command));
    hooks.redo.forEach(fn => fn(command));
  }

  function clear(): void {
    past.length = 0;
    future.length = 0;
    hooks.clear.forEach(fn => fn());
  }

  return {
    push,
    undo,
    redo,
    canUndo:  () => past.length > 0,
    canRedo:  () => future.length > 0,
    current:  () => present,
    replace:  (state: EditorState) => { present = state; },
    clear,
    onPush:     fn => sub(hooks.push, fn),
    onUndo:     fn => sub(hooks.undo, fn),
    onRedo:     fn => sub(hooks.redo, fn),
    onClear:    fn => sub(hooks.clear, fn),
    beforePush: fn => sub(hooks.beforePush, fn),
    afterPush:  fn => sub(hooks.afterPush, fn),
    beforeUndo: fn => sub(hooks.beforeUndo, fn),
    afterUndo:  fn => sub(hooks.afterUndo, fn),
    beforeRedo: fn => sub(hooks.beforeRedo, fn),
    afterRedo:  fn => sub(hooks.afterRedo, fn),
  };
}
