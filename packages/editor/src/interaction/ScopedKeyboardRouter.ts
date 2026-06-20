import {
  lookupAction, DEFAULT_BINDINGS,
  type ActionName, type KeyBinding,
} from '../KeyboardBindings';
import type { ScopeState } from './ScopeManager';
import type { PaletteNavigationState } from './PaletteNavigationState';

export interface ScopedRouterOptions {
  /** Key binding that toggles between Palette and Canvas scopes. Default: F6 (keyCode 117). */
  scopeSwitchBinding?: KeyBinding;
  /** Canvas key bindings. Defaults to DEFAULT_BINDINGS. */
  canvasBindings?: ReadonlyArray<readonly [KeyBinding, ActionName]>;
}

export type ScopedRouterResult =
  | { type: 'toggleScope' }
  | { type: 'paletteNavigate'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'paletteExpand' }
  | { type: 'paletteBack' }
  | { type: 'paletteAdd' }
  | { type: 'canvasAction'; action: ActionName }
  | { type: 'none' };

export interface KeyEventDescriptor {
  readonly keyCode: number;
  readonly key:     string;
  readonly shiftKey: boolean;
  readonly ctrlKey:  boolean;
  readonly metaKey:  boolean;
}

const DEFAULT_SCOPE_SWITCH: KeyBinding = { keyCode: 117 }; // F6

/** Expand = Ctrl+Enter or Cmd+Enter (keyCode 13 with ctrl or meta). */
function isExpandKey(e: KeyEventDescriptor): boolean {
  return e.keyCode === 13 && (e.ctrlKey || e.metaKey);
}

function isScopeSwitch(e: KeyEventDescriptor, binding: KeyBinding): boolean {
  return (
    e.keyCode === binding.keyCode &&
    (binding.shift ?? false) === e.shiftKey &&
    (binding.ctrl  ?? false) === e.ctrlKey
  );
}

/**
 * Pure keyboard router.
 *
 * Takes a raw key event descriptor and the current scope + palette nav state,
 * and returns a discriminated-union result describing what should happen.
 * No side effects — callers apply the result.
 */
export function routeKeyEvent(
  e:       KeyEventDescriptor,
  scope:   ScopeState,
  palette: PaletteNavigationState,
  options: ScopedRouterOptions = {},
): ScopedRouterResult {
  const switchBinding  = options.scopeSwitchBinding ?? DEFAULT_SCOPE_SWITCH;
  const canvasBindings = options.canvasBindings      ?? DEFAULT_BINDINGS;

  // Global: scope-switch shortcut fires regardless of active scope
  if (isScopeSwitch(e, switchBinding)) {
    return { type: 'toggleScope' };
  }

  if (scope.activeScope === 'palette') {
    // Escape: back one level (or exit palette scope — caller decides)
    if (e.keyCode === 27) {
      return palette.level === 0
        ? { type: 'toggleScope' }  // exit palette → canvas
        : { type: 'paletteBack' };
    }
    // Arrow keys: grid navigation
    if (e.keyCode === 37) return { type: 'paletteNavigate', direction: 'left' };
    if (e.keyCode === 39) return { type: 'paletteNavigate', direction: 'right' };
    if (e.keyCode === 38) return { type: 'paletteNavigate', direction: 'up' };
    if (e.keyCode === 40) return { type: 'paletteNavigate', direction: 'down' };
    // Enter: add (plain) or expand (Ctrl/Cmd)
    if (e.keyCode === 13) {
      return isExpandKey(e)
        ? { type: 'paletteExpand' }
        : { type: 'paletteAdd' };
    }
    // All other keys: let DOM handle (Tab moves between back/tab buttons)
    return { type: 'none' };
  }

  // Canvas scope: delegate to existing KeyboardBindings
  const action = lookupAction(canvasBindings, e.keyCode, e.shiftKey, e.ctrlKey);
  if (action === null) return { type: 'none' };
  return { type: 'canvasAction', action };
}
