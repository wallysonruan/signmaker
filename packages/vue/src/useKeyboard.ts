import { lookupAction, actionToCommand, DEFAULT_BINDINGS } from '@wallysonruan/signmaker-editor-engine';
import type { Command } from '@wallysonruan/signmaker-editor-engine';

export interface UseKeyboardReturn {
  attach(el: EventTarget): () => void;
}

export function useKeyboard(
  dispatch: (c: Command) => void,
  onUndo: () => void,
  onRedo: () => void,
): UseKeyboardReturn {
  function attach(el: EventTarget): () => void {
    function handleKeydown(event: Event): void {
      const e = event as KeyboardEvent;
      const action = lookupAction(
        DEFAULT_BINDINGS,
        e.keyCode,
        e.shiftKey,
        e.ctrlKey,
      );

      if (action === null) return;

      // Prevent default for specific key codes
      if (e.keyCode === 8 || e.keyCode === 9 || e.keyCode === 191) {
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
      if (command !== null) {
        dispatch(command);
      }
    }

    el.addEventListener('keydown', handleKeydown);
    return () => {
      el.removeEventListener('keydown', handleKeydown);
    };
  }

  return { attach };
}
