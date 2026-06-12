import type { Command } from '@signwriter/editor';
import {
  DEFAULT_BINDINGS, lookupAction, actionToCommand,
} from '@signwriter/editor';

// ── Public return type ────────────────────────────────────────────────────────

export interface UseKeyboardResult {
  attach(el: EventTarget): () => void;
}

// ── Key codes that need preventDefault ───────────────────────────────────────

const PREVENT_DEFAULT_KEYS = new Set([8, 9, 191]);

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKeyboard(
  dispatch: (c: Command) => void,
  onUndo: () => void,
  onRedo: () => void,
): UseKeyboardResult {
  function attach(el: EventTarget): () => void {
    function onKeyDown(event: Event): void {
      const e = event as KeyboardEvent;

      // Skip if focus is on a text input
      const target = e.target as HTMLElement | null;
      if (target && target.tagName) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
      }

      const action = lookupAction(
        DEFAULT_BINDINGS,
        e.keyCode,
        e.shiftKey,
        e.ctrlKey,
      );

      if (action === null) return;

      if (PREVENT_DEFAULT_KEYS.has(e.keyCode)) {
        e.preventDefault();
      }

      if (action === 'undo') {
        onUndo();
        return;
      }

      if (action === 'redo') {
        onRedo();
        return;
      }

      const command = actionToCommand(action);
      if (command) {
        dispatch(command);
      }
    }

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }

  return { attach };
}
