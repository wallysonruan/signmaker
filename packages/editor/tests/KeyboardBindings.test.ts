import {
  DEFAULT_BINDINGS, lookupAction, actionToCommand,
} from '../src/KeyboardBindings';
import { EMPTY_STATE } from '../src/types';
import { addSymbol } from '../src/commands';
import type { ActionName } from '../src/KeyboardBindings';

let counter = 0;
const idGen = () => `id${++counter}`;
beforeEach(() => { counter = 0; });

// ── lookupAction ──────────────────────────────────────────────────────────────

describe('lookupAction()', () => {
  test('arrow left → moveLeft', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 37, false, false)).toBe('moveLeft');
  });

  test('arrow right → moveRight', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 39, false, false)).toBe('moveRight');
  });

  test('arrow up → moveUp', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 38, false, false)).toBe('moveUp');
  });

  test('arrow down → moveDown', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 40, false, false)).toBe('moveDown');
  });

  test('shift+left → moveFastLeft', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 37, true, false)).toBe('moveFastLeft');
  });

  test('shift+right → moveFastRight', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 39, true, false)).toBe('moveFastRight');
  });

  test('shift+up → moveFastUp', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 38, true, false)).toBe('moveFastUp');
  });

  test('shift+down → moveFastDown', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 40, true, false)).toBe('moveFastDown');
  });

  test('Tab → selectNext', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 9, false, false)).toBe('selectNext');
  });

  test('Shift+Tab → selectPrev', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 9, true, false)).toBe('selectPrev');
  });

  test('Backspace → deleteSelected', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 8, false, false)).toBe('deleteSelected');
  });

  test('Delete → deleteSelected', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 46, false, false)).toBe('deleteSelected');
  });

  test('Ctrl+Z → undo', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 90, false, true)).toBe('undo');
  });

  test('Ctrl+Shift+Z → redo', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 90, true, true)).toBe('redo');
  });

  test('/ → rotateRight', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 191, false, false)).toBe('rotateRight');
  });

  test('Shift+/ → rotateLeft', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 191, true, false)).toBe('rotateLeft');
  });

  test('. → variation', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 190, false, false)).toBe('variation');
  });

  test('Shift+. → variationBack', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 190, true, false)).toBe('variationBack');
  });

  test(', → mirror', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 188, false, false)).toBe('mirror');
  });

  test('N → fillNext', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 78, false, false)).toBe('fillNext');
  });

  test('Shift+N → fillPrev', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 78, true, false)).toBe('fillPrev');
  });

  test('Ctrl+Home → center', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 36, false, true)).toBe('center');
  });

  test('Escape → selectNone', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 27, false, false)).toBe('selectNone');
  });

  test('unbound key returns null', () => {
    expect(lookupAction(DEFAULT_BINDINGS, 65, false, false)).toBeNull();
  });

  test('shift modifier matters (plain A ≠ shift+A for bound keys)', () => {
    // plain left arrow
    expect(lookupAction(DEFAULT_BINDINGS, 37, false, false)).toBe('moveLeft');
    // shift+left is a different action
    expect(lookupAction(DEFAULT_BINDINGS, 37, true, false)).toBe('moveFastLeft');
  });
});

// ── actionToCommand ───────────────────────────────────────────────────────────

describe('actionToCommand()', () => {
  const allMovements: ActionName[] = [
    'moveLeft', 'moveRight', 'moveUp', 'moveDown',
    'moveFastLeft', 'moveFastRight', 'moveFastUp', 'moveFastDown',
  ];

  test.each(allMovements)('%s returns a Command function', (action) => {
    const cmd = actionToCommand(action);
    expect(typeof cmd).toBe('function');
  });

  test('moveLeft moves symbol left by 1', () => {
    const state = addSymbol('S14c20', 500, 500, idGen)(EMPTY_STATE);
    const id = state.symbols[0].id;
    const cmd = actionToCommand('moveLeft')!;
    const result = cmd({ ...state, selection: new Set([id]) });
    expect(result.symbols[0].x).toBe(499);
  });

  test('moveFastRight moves symbol right by 10', () => {
    const state = addSymbol('S14c20', 500, 500, idGen)(EMPTY_STATE);
    const id = state.symbols[0].id;
    const cmd = actionToCommand('moveFastRight')!;
    const result = cmd({ ...state, selection: new Set([id]) });
    expect(result.symbols[0].x).toBe(510);
  });

  test('deleteSelected returns a Command', () => {
    expect(typeof actionToCommand('deleteSelected')).toBe('function');
  });

  test('rotateRight returns a Command', () => {
    expect(typeof actionToCommand('rotateRight')).toBe('function');
  });

  test('rotateLeft returns a Command', () => {
    expect(typeof actionToCommand('rotateLeft')).toBe('function');
  });

  test('mirror returns a Command', () => {
    expect(typeof actionToCommand('mirror')).toBe('function');
  });

  test('fillNext returns a Command', () => {
    expect(typeof actionToCommand('fillNext')).toBe('function');
  });

  test('fillPrev returns a Command', () => {
    expect(typeof actionToCommand('fillPrev')).toBe('function');
  });

  test('variation returns a Command', () => {
    expect(typeof actionToCommand('variation')).toBe('function');
  });

  test('variationBack returns a Command', () => {
    expect(typeof actionToCommand('variationBack')).toBe('function');
  });

  test('selectNext returns a Command', () => {
    expect(typeof actionToCommand('selectNext')).toBe('function');
  });

  test('selectPrev returns a Command', () => {
    expect(typeof actionToCommand('selectPrev')).toBe('function');
  });

  test('selectNone returns a Command', () => {
    expect(typeof actionToCommand('selectNone')).toBe('function');
  });

  test('undo returns null (requires external history context)', () => {
    expect(actionToCommand('undo')).toBeNull();
  });

  test('redo returns null (requires external history context)', () => {
    expect(actionToCommand('redo')).toBeNull();
  });

  test('center returns null (requires size provider context)', () => {
    expect(actionToCommand('center')).toBeNull();
  });
});
