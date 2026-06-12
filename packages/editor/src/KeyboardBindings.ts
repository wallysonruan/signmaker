import type { Command, EditorState } from './types';
import {
  moveSelected, deleteSelected,
  rotateSelected, mirrorSelected,
  fillSelected, variationSelected,
} from './commands';
import { selectNone, cycleSelection } from './SelectionEngine';

/**
 * Named actions that correspond to keyboard shortcuts.
 * These map 1:1 to the keyboard config in the original config/keyboard.js.
 */
export type ActionName =
  | 'moveLeft'       | 'moveRight'      | 'moveUp'        | 'moveDown'
  | 'moveFastLeft'   | 'moveFastRight'  | 'moveFastUp'    | 'moveFastDown'
  | 'selectNext'     | 'selectPrev'
  | 'deleteSelected'
  | 'undo'           | 'redo'
  | 'rotateRight'    | 'rotateLeft'
  | 'variation'      | 'variationBack'
  | 'mirror'
  | 'fillNext'       | 'fillPrev'
  | 'center'
  | 'selectNone';

/** A key combination descriptor. */
export interface KeyBinding {
  readonly keyCode: number;
  readonly shift?:  boolean;
  readonly ctrl?:   boolean;
}

/**
 * Default keyboard bindings matching config/keyboard.js from the original app.
 *
 * Key codes:
 *   37=Left, 38=Up, 39=Right, 40=Down
 *   8=Backspace, 46=Delete, 9=Tab
 *   90=Z, 191=/ (slash), 190=. (period), 188=, (comma), 78=N
 *   36=Home (Ctrl+Home = center)
 */
export const DEFAULT_BINDINGS: ReadonlyArray<readonly [KeyBinding, ActionName]> = [
  [{ keyCode: 37 },                     'moveLeft'],
  [{ keyCode: 39 },                     'moveRight'],
  [{ keyCode: 38 },                     'moveUp'],
  [{ keyCode: 40 },                     'moveDown'],
  [{ keyCode: 37, shift: true },        'moveFastLeft'],
  [{ keyCode: 39, shift: true },        'moveFastRight'],
  [{ keyCode: 38, shift: true },        'moveFastUp'],
  [{ keyCode: 40, shift: true },        'moveFastDown'],
  [{ keyCode: 9 },                      'selectNext'],
  [{ keyCode: 9,  shift: true },        'selectPrev'],
  [{ keyCode: 8 },                      'deleteSelected'],
  [{ keyCode: 46 },                     'deleteSelected'],
  [{ keyCode: 90, ctrl: true },         'undo'],
  [{ keyCode: 90, ctrl: true, shift: true }, 'redo'],
  [{ keyCode: 191 },                    'rotateRight'],
  [{ keyCode: 191, shift: true },       'rotateLeft'],
  [{ keyCode: 190 },                    'variation'],
  [{ keyCode: 190, shift: true },       'variationBack'],
  [{ keyCode: 188 },                    'mirror'],
  [{ keyCode: 78 },                     'fillNext'],
  [{ keyCode: 78, shift: true },        'fillPrev'],
  [{ keyCode: 36, ctrl: true },         'center'],
  [{ keyCode: 27 },                     'selectNone'],
];

/**
 * Look up which action a key combo maps to.
 * Returns null if no binding matches.
 */
export function lookupAction(
  bindings: ReadonlyArray<readonly [KeyBinding, ActionName]>,
  keyCode: number,
  shift: boolean,
  ctrl: boolean,
): ActionName | null {
  for (const [binding, action] of bindings) {
    if (
      binding.keyCode === keyCode &&
      (binding.shift  ?? false) === shift &&
      (binding.ctrl   ?? false) === ctrl
    ) {
      return action;
    }
  }
  return null;
}

/**
 * Convert a non-history ActionName to an inline EditorState Command.
 *
 * Returns null for 'undo', 'redo', and 'center' — these require external
 * context (history stack or size provider) so they cannot be expressed as a
 * plain Command here.
 */
export function actionToCommand(action: ActionName): Command | null {
  switch (action) {
    case 'moveLeft':      return moveSelected(-1,  0);
    case 'moveRight':     return moveSelected( 1,  0);
    case 'moveUp':        return moveSelected( 0, -1);
    case 'moveDown':      return moveSelected( 0,  1);
    case 'moveFastLeft':  return moveSelected(-10,  0);
    case 'moveFastRight': return moveSelected( 10,  0);
    case 'moveFastUp':    return moveSelected(  0, -10);
    case 'moveFastDown':  return moveSelected(  0,  10);
    case 'selectNext':    return (s: EditorState) => cycleSelection(s,  1);
    case 'selectPrev':    return (s: EditorState) => cycleSelection(s, -1);
    case 'deleteSelected':return deleteSelected();
    case 'rotateRight':   return rotateSelected( 1);
    case 'rotateLeft':    return rotateSelected(-1);
    case 'variation':     return variationSelected( 1);
    case 'variationBack': return variationSelected(-1);
    case 'mirror':        return mirrorSelected();
    case 'fillNext':      return fillSelected( 1);
    case 'fillPrev':      return fillSelected(-1);
    case 'selectNone':    return (s: EditorState) => selectNone(s);
    case 'undo':
    case 'redo':
    case 'center':
      return null;
  }
}
