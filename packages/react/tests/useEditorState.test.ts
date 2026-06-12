import { renderHook, act } from '@testing-library/react';
import { useEditorState } from '../src/useEditorState';
import { addSymbol, EMPTY_STATE } from '@signwriter/editor';

let idCounter = 0;
const idGen = () => `test-id-${++idCounter}`;

beforeEach(() => { idCounter = 0; });

describe('useEditorState', () => {
  test('initial state is EMPTY_STATE', () => {
    const { result } = renderHook(() => useEditorState());
    expect(result.current.state).toEqual(EMPTY_STATE);
  });

  test('dispatch(addSymbol) updates symbols to length 1', () => {
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.dispatch(addSymbol('S14c20', 100, 200, idGen));
    });
    expect(result.current.state.symbols).toHaveLength(1);
    expect(result.current.state.symbols[0].key).toBe('S14c20');
  });

  test('canUndo is false initially, true after dispatch', () => {
    const { result } = renderHook(() => useEditorState());
    expect(result.current.canUndo).toBe(false);
    act(() => {
      result.current.dispatch(addSymbol('S14c20', 100, 200, idGen));
    });
    expect(result.current.canUndo).toBe(true);
  });

  test('undo() reverts state', () => {
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.dispatch(addSymbol('S14c20', 100, 200, idGen));
    });
    expect(result.current.state.symbols).toHaveLength(1);
    act(() => {
      result.current.undo();
    });
    expect(result.current.state.symbols).toHaveLength(0);
  });

  test('redo() re-applies after undo', () => {
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.dispatch(addSymbol('S14c20', 100, 200, idGen));
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);
    act(() => {
      result.current.redo();
    });
    expect(result.current.state.symbols).toHaveLength(1);
  });

  test('replaceState updates state but canUndo does not change (no new history entry)', () => {
    const { result } = renderHook(() => useEditorState());
    // canUndo is false initially
    expect(result.current.canUndo).toBe(false);

    const newState = { ...EMPTY_STATE, entry: 'replaced' };
    act(() => {
      result.current.replaceState(newState);
    });
    expect(result.current.state.entry).toBe('replaced');
    // REPLACE only swaps present — no past entry added
    expect(result.current.canUndo).toBe(false);
  });
});
