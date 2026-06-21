import { ref } from 'vue';
import { useEditorState } from '../src/useEditorState';
import { EMPTY_STATE, addSymbol, createDefaultHistory } from '@signwriter/editor';

let counter = 0;
const idGen = () => `id${++counter}`;

beforeEach(() => {
  counter = 0;
});

describe('useEditorState', () => {
  test('initial state is EMPTY_STATE', () => {
    const { state } = useEditorState();
    expect(state.value).toEqual(EMPTY_STATE);
  });

  test('dispatch() adds to history', () => {
    const { state, dispatch } = useEditorState();
    dispatch(addSymbol('S14c20', 100, 200, idGen));
    expect(state.value.symbols).toHaveLength(1);
    expect(state.value.symbols[0].key).toBe('S14c20');
  });

  test('canUndo is false initially, true after dispatch', () => {
    const { canUndo, dispatch } = useEditorState();
    expect(canUndo.value).toBe(false);
    dispatch(addSymbol('S14c20', 100, 200, idGen));
    expect(canUndo.value).toBe(true);
  });

  test('undo() reverts state', () => {
    const { state, canUndo, dispatch, undo } = useEditorState();
    dispatch(addSymbol('S14c20', 100, 200, idGen));
    expect(state.value.symbols).toHaveLength(1);
    undo();
    expect(state.value.symbols).toHaveLength(0);
    expect(canUndo.value).toBe(false);
  });

  test('redo() re-applies after undo', () => {
    const { state, canRedo, dispatch, undo, redo } = useEditorState();
    dispatch(addSymbol('S14c20', 100, 200, idGen));
    undo();
    expect(canRedo.value).toBe(true);
    redo();
    expect(state.value.symbols).toHaveLength(1);
    expect(canRedo.value).toBe(false);
  });

  test('replaceState() updates present without adding history entry', () => {
    const { state, canUndo, dispatch, replaceState } = useEditorState();
    dispatch(addSymbol('S14c20', 100, 200, idGen));
    const historyDepthAfterDispatch = canUndo.value; // true (1 entry)

    const newState = { ...state.value, entry: 'transient' };
    replaceState(newState);

    expect(state.value.entry).toBe('transient');
    // canUndo should still reflect same depth (replaceState doesn't add to past)
    expect(canUndo.value).toBe(historyDepthAfterDispatch);
  });

  test('exposes the underlying history port', () => {
    const { history, dispatch } = useEditorState();
    expect(history.canUndo()).toBe(false);
    dispatch(addSymbol('S14c20', 100, 200, idGen));
    expect(history.canUndo()).toBe(true);
  });

  test('history hooks fire on dispatch (onPush)', () => {
    const { history, dispatch } = useEditorState();
    const pushed: string[] = [];
    history.onPush((c) => pushed.push(c.name));
    dispatch(addSymbol('S14c20', 100, 200, idGen));
    expect(pushed).toHaveLength(1);
  });

  test('bus.dispatch(name, …) records a named history entry', () => {
    const { history, bus } = useEditorState();
    const names: string[] = [];
    history.onPush((c) => names.push(c.name));
    bus.dispatch('add-symbol', addSymbol('S14c20', 100, 200, idGen));
    expect(names).toEqual(['add-symbol']);
  });

  test('accepts an injected history port', () => {
    const injected = createDefaultHistory(EMPTY_STATE);
    const { state, history, dispatch } = useEditorState({ history: injected });
    expect(history).toBe(injected);
    dispatch(addSymbol('S14c20', 100, 200, idGen));
    // The injected port and the composable observe the same state.
    expect(injected.current().symbols).toHaveLength(1);
    expect(state.value.symbols).toHaveLength(1);
  });
});

// Ensure ref import is used (avoids unused import warning in test context)
const _ref = ref;
void _ref;
