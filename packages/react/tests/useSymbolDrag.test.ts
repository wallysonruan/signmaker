import { renderHook, act } from '@testing-library/react';
import { useSymbolDrag } from '../src/useSymbolDrag';
import { addSymbol, EMPTY_STATE } from '@signwriter/editor';
import type { EditorState, Command } from '@signwriter/editor';

let idCounter = 0;
const idGen = () => `sym-${++idCounter}`;

beforeEach(() => { idCounter = 0; });

describe('useSymbolDrag', () => {
  function setup(initialState: EditorState = EMPTY_STATE) {
    let currentState = initialState;
    const replaceState = jest.fn((s: EditorState) => { currentState = s; });
    const dispatch = jest.fn((_c: Command) => {});
    const getState = () => currentState;

    const { result } = renderHook(() =>
      useSymbolDrag(getState, replaceState, dispatch),
    );

    return { result, replaceState, dispatch, getState };
  }

  test('isDragging starts false', () => {
    const { result } = setup();
    expect(result.current.isDragging).toBe(false);
  });

  test('after onPointerDown, isDragging is true and replaceState was called', () => {
    const stateWithSymbol = addSymbol('S14c20', 100, 200, idGen)(EMPTY_STATE);
    const symbolId = stateWithSymbol.symbols[0].id;
    const { result, replaceState } = setup(stateWithSymbol);

    act(() => {
      result.current.onPointerDown(symbolId, 150, 250);
    });

    expect(result.current.isDragging).toBe(true);
    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  test('after onPointerUp, isDragging is false and dispatch was called', () => {
    const stateWithSymbol = addSymbol('S14c20', 100, 200, idGen)(EMPTY_STATE);
    const symbolId = stateWithSymbol.symbols[0].id;
    const { result, dispatch } = setup(stateWithSymbol);

    act(() => {
      result.current.onPointerDown(symbolId, 150, 250);
    });
    act(() => {
      result.current.onPointerUp();
    });

    expect(result.current.isDragging).toBe(false);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test('after onPointerCancel, isDragging is false', () => {
    const stateWithSymbol = addSymbol('S14c20', 100, 200, idGen)(EMPTY_STATE);
    const symbolId = stateWithSymbol.symbols[0].id;
    const { result } = setup(stateWithSymbol);

    act(() => {
      result.current.onPointerDown(symbolId, 150, 250);
    });
    act(() => {
      result.current.onPointerCancel();
    });

    expect(result.current.isDragging).toBe(false);
  });
});
