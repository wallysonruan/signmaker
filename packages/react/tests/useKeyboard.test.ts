import { renderHook } from '@testing-library/react';
import { useKeyboard } from '../src/useKeyboard';
import { addSymbol, EMPTY_STATE } from '@signwriter/editor';
import type { Command } from '@signwriter/editor';

let idCounter = 0;
const idGen = () => `key-sym-${++idCounter}`;

beforeEach(() => { idCounter = 0; });

function fireKeydown(
  target: EventTarget,
  keyCode: number,
  options: { shiftKey?: boolean; ctrlKey?: boolean } = {},
): void {
  const event = new KeyboardEvent('keydown', {
    keyCode,
    bubbles: true,
    cancelable: true,
    shiftKey: options.shiftKey ?? false,
    ctrlKey: options.ctrlKey ?? false,
  });
  target.dispatchEvent(event);
}

describe('useKeyboard', () => {
  test('attach returns a function', () => {
    const dispatch = jest.fn();
    const onUndo = jest.fn();
    const onRedo = jest.fn();

    const { result } = renderHook(() => useKeyboard(dispatch, onUndo, onRedo));
    const cleanup = result.current.attach(document);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  test('Arrow Left key calls dispatch with a command that moves symbol left', () => {
    const dispatched: Command[] = [];
    const dispatch = jest.fn((c: Command) => dispatched.push(c));
    const onUndo = jest.fn();
    const onRedo = jest.fn();

    const { result } = renderHook(() => useKeyboard(dispatch, onUndo, onRedo));
    const cleanup = result.current.attach(document);

    // keyCode 37 = Arrow Left
    fireKeydown(document, 37);

    expect(dispatch).toHaveBeenCalledTimes(1);

    // Verify the command actually moves left: apply it to a state with a selected symbol
    const stateWithSymbol = addSymbol('S14c20', 100, 200, idGen)(EMPTY_STATE);
    const originalX = stateWithSymbol.symbols[0].x;
    // moveLeft = moveSelected(-1, 0) but symbol isn't selected here; use selected state
    const selectedState = { ...stateWithSymbol, selection: new Set([stateWithSymbol.symbols[0].id]) };
    const afterCommandSelected = dispatched[0](selectedState);
    expect(afterCommandSelected.symbols[0].x).toBe(originalX - 1);

    cleanup();
  });

  test('Ctrl+Z calls onUndo', () => {
    const dispatch = jest.fn();
    const onUndo = jest.fn();
    const onRedo = jest.fn();

    const { result } = renderHook(() => useKeyboard(dispatch, onUndo, onRedo));
    const cleanup = result.current.attach(document);

    // keyCode 90 + ctrl = Ctrl+Z = undo
    fireKeydown(document, 90, { ctrlKey: true });

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();

    cleanup();
  });

  test('cleanup function removes listener: dispatching key after cleanup does nothing', () => {
    const dispatch = jest.fn();
    const onUndo = jest.fn();
    const onRedo = jest.fn();

    const { result } = renderHook(() => useKeyboard(dispatch, onUndo, onRedo));
    const cleanup = result.current.attach(document);

    // Fire before cleanup — should work
    fireKeydown(document, 37);
    expect(dispatch).toHaveBeenCalledTimes(1);

    cleanup();
    dispatch.mockClear();

    // Fire after cleanup — should be ignored
    fireKeydown(document, 37);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
