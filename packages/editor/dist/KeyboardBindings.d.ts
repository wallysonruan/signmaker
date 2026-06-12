import type { Command } from './types';
/**
 * Named actions that correspond to keyboard shortcuts.
 * These map 1:1 to the keyboard config in the original config/keyboard.js.
 */
export type ActionName = 'moveLeft' | 'moveRight' | 'moveUp' | 'moveDown' | 'moveFastLeft' | 'moveFastRight' | 'moveFastUp' | 'moveFastDown' | 'selectNext' | 'selectPrev' | 'deleteSelected' | 'undo' | 'redo' | 'rotateRight' | 'rotateLeft' | 'variation' | 'variationBack' | 'mirror' | 'fillNext' | 'fillPrev' | 'center' | 'selectNone';
/** A key combination descriptor. */
export interface KeyBinding {
    readonly keyCode: number;
    readonly shift?: boolean;
    readonly ctrl?: boolean;
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
export declare const DEFAULT_BINDINGS: ReadonlyArray<readonly [KeyBinding, ActionName]>;
/**
 * Look up which action a key combo maps to.
 * Returns null if no binding matches.
 */
export declare function lookupAction(bindings: ReadonlyArray<readonly [KeyBinding, ActionName]>, keyCode: number, shift: boolean, ctrl: boolean): ActionName | null;
/**
 * Convert a non-history ActionName to an inline EditorState Command.
 *
 * Returns null for 'undo', 'redo', and 'center' — these require external
 * context (history stack or size provider) so they cannot be expressed as a
 * plain Command here.
 */
export declare function actionToCommand(action: ActionName): Command | null;
//# sourceMappingURL=KeyboardBindings.d.ts.map