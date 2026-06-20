import { createScope } from './createScopeManager';
import type { Scope } from './createScopeManager';
import type { KeyEventDescriptor } from './ScopedKeyboardRouter';
import {
  DEFAULT_BINDINGS,
  lookupAction,
  actionToCommand,
} from '../KeyboardBindings';
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
export function createCanvasScope(deps: CanvasScopeDeps): Scope {
  const bindings = deps.bindings ?? DEFAULT_BINDINGS;
  return createScope('canvas', {
    handleKey(e: KeyEventDescriptor): boolean {
      const action = lookupAction(bindings, e.keyCode, e.shiftKey, e.ctrlKey);
      if (action === null) return false;
      if (action === 'undo') { deps.onUndo(); return true; }
      if (action === 'redo') { deps.onRedo(); return true; }
      const command = actionToCommand(action);
      if (command !== null) deps.dispatch(command);
      return true;
    },
  });
}
