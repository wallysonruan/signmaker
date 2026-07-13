import type { ScopeManager, KeyEventDescriptor } from '@wallysonruan/signmaker-editor-engine';

export interface KeyboardRouterOptions {
  scopeManager: ScopeManager;
  /**
   * Key that triggers a scope switch. Default: F6 (keyCode 117).
   * Set to null to disable the built-in toggle.
   */
  scopeSwitchBinding?: { keyCode: number; shift?: boolean; ctrl?: boolean } | null;
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

const DEFAULT_SWITCH_BINDING = { keyCode: 117, shift: false, ctrl: false };
const DEFAULT_TOGGLE_SCOPES  = ['canvas', 'palette'] as const;
const DEFAULT_PREVENT_KEYS   = [8, 9, 191] as const;

export function createKeyboardRouter(options: KeyboardRouterOptions): KeyboardRouter {
  const {
    scopeManager,
    scopeSwitchBinding = DEFAULT_SWITCH_BINDING,
    toggleScopes       = DEFAULT_TOGGLE_SCOPES,
    preventDefaultKeys = DEFAULT_PREVENT_KEYS,
  } = options;

  function attach(el: EventTarget): () => void {
    function handleKeydown(event: Event): void {
      const e = event as KeyboardEvent;

      // Never intercept keys while typing in a text field.
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      // Scope-switch shortcut (default: F6).
      if (scopeSwitchBinding !== null) {
        const sb = scopeSwitchBinding;
        if (
          e.keyCode === sb.keyCode &&
          (sb.shift ?? false) === e.shiftKey &&
          (sb.ctrl  ?? false) === e.ctrlKey
        ) {
          e.preventDefault();
          const current = scopeManager.currentScope();
          const next = current === toggleScopes[0] ? toggleScopes[1] : toggleScopes[0];
          scopeManager.enter(next);
          return;
        }
      }

      const descriptor: KeyEventDescriptor = {
        keyCode:  e.keyCode,
        key:      e.key,
        shiftKey: e.shiftKey,
        ctrlKey:  e.ctrlKey,
        metaKey:  e.metaKey,
      };

      const consumed = scopeManager.routeKey(descriptor);
      if (consumed && (preventDefaultKeys as readonly number[]).includes(e.keyCode)) {
        e.preventDefault();
      }
    }

    el.addEventListener('keydown', handleKeydown);
    return () => el.removeEventListener('keydown', handleKeydown);
  }

  return { attach };
}
