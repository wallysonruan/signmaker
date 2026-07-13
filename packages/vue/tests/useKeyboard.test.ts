import { useKeyboard } from '../src/useKeyboard';
import { useEditorState } from '../src/useEditorState';
import { addSymbol } from '@wallysonruan/signmaker-editor-engine';

let counter = 0;
const idGen = () => `id${++counter}`;

beforeEach(() => {
  counter = 0;
});

/** Minimal EventTarget stub that stores handlers and allows manual dispatch. */
class MockEventTarget {
  private handlers: Map<string, EventListener[]> = new Map();

  addEventListener(type: string, handler: EventListenerOrEventListenerObject): void {
    const h = typeof handler === 'function' ? handler : handler.handleEvent.bind(handler);
    const list = this.handlers.get(type) ?? [];
    list.push(h as EventListener);
    this.handlers.set(type, list);
  }

  removeEventListener(type: string, handler: EventListenerOrEventListenerObject): void {
    const h = typeof handler === 'function' ? handler : handler.handleEvent.bind(handler);
    const list = this.handlers.get(type) ?? [];
    this.handlers.set(type, list.filter((fn) => fn !== h));
  }

  dispatchEvent(event: Event): boolean {
    const list = this.handlers.get(event.type) ?? [];
    list.forEach((fn) => fn(event));
    return true;
  }

  listenerCount(type: string): number {
    return (this.handlers.get(type) ?? []).length;
  }
}

function makeKeyEvent(keyCode: number, options: { shiftKey?: boolean; ctrlKey?: boolean } = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    shiftKey: options.shiftKey ?? false,
    ctrlKey: options.ctrlKey ?? false,
  });
  // keyCode is deprecated but still used by lookupAction; define it via Object.defineProperty
  Object.defineProperty(event, 'keyCode', { value: keyCode, writable: false });
  return event;
}

describe('useKeyboard', () => {
  test('attach() returns a cleanup function', () => {
    const el = new MockEventTarget();
    const { dispatch, undo, redo } = useEditorState();
    const { attach } = useKeyboard(dispatch, undo, redo);

    const cleanup = attach(el as unknown as EventTarget);

    expect(typeof cleanup).toBe('function');
    expect(el.listenerCount('keydown')).toBe(1);
  });

  test('arrow key dispatches moveLeft command (state changes)', () => {
    const el = new MockEventTarget();
    const editorState = useEditorState();
    editorState.dispatch(addSymbol('S14c20', 100, 200, idGen));
    // Select symbol via selectById by dispatching selectNone then the symbol
    const symbolId = editorState.state.value.symbols[0].id;

    const { attach } = useKeyboard(editorState.dispatch, editorState.undo, editorState.redo);
    attach(el as unknown as EventTarget);

    // arrow left = keyCode 37, moves selected symbol -1 in x
    el.dispatchEvent(makeKeyEvent(37)); // moveLeft

    // Symbol should have moved left by 1
    const sym = editorState.state.value.symbols[0];
    // Symbol is selected (addSymbol selects it), so x should be 99
    expect(sym.x).toBe(99);
    void symbolId;
  });

  test('Ctrl+Z calls onUndo', () => {
    const el = new MockEventTarget();
    const undoMock = jest.fn();
    const redoMock = jest.fn();
    const dispatchMock = jest.fn();

    const { attach } = useKeyboard(dispatchMock, undoMock, redoMock);
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(90, { ctrlKey: true })); // Ctrl+Z = undo

    expect(undoMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  test('Escape dispatches selectNone', () => {
    const el = new MockEventTarget();
    const editorState = useEditorState();
    editorState.dispatch(addSymbol('S14c20', 100, 200, idGen));
    // Symbol is selected after addSymbol
    expect(editorState.state.value.selection.size).toBe(1);

    const { attach } = useKeyboard(editorState.dispatch, editorState.undo, editorState.redo);
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(27)); // Escape = selectNone

    expect(editorState.state.value.selection.size).toBe(0);
  });

  test('Backspace key deletes selected symbol', () => {
    const el = new MockEventTarget();
    const editorState = useEditorState();
    editorState.dispatch(addSymbol('S14c20', 100, 200, idGen));
    expect(editorState.state.value.symbols).toHaveLength(1);
    expect(editorState.state.value.selection.size).toBe(1);

    const { attach } = useKeyboard(editorState.dispatch, editorState.undo, editorState.redo);
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(8)); // Backspace = deleteSelected

    expect(editorState.state.value.symbols).toHaveLength(0);
    expect(editorState.state.value.selection.size).toBe(0);
  });

  test('Delete key deletes selected symbol', () => {
    const el = new MockEventTarget();
    const editorState = useEditorState();
    editorState.dispatch(addSymbol('S14c20', 100, 200, idGen));
    expect(editorState.state.value.symbols).toHaveLength(1);

    const { attach } = useKeyboard(editorState.dispatch, editorState.undo, editorState.redo);
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(46)); // Delete = deleteSelected

    expect(editorState.state.value.symbols).toHaveLength(0);
  });

  test('delete is undoable (Backspace then Ctrl+Z restores symbol)', () => {
    const el = new MockEventTarget();
    const editorState = useEditorState();
    editorState.dispatch(addSymbol('S14c20', 100, 200, idGen));

    const { attach } = useKeyboard(editorState.dispatch, editorState.undo, editorState.redo);
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(8));  // delete
    expect(editorState.state.value.symbols).toHaveLength(0);

    el.dispatchEvent(makeKeyEvent(90, { ctrlKey: true })); // Ctrl+Z = undo
    expect(editorState.state.value.symbols).toHaveLength(1);
    expect(editorState.state.value.symbols[0].key).toBe('S14c20');
  });

  test('cleanup function removes the listener', () => {
    const el = new MockEventTarget();
    const dispatchMock = jest.fn();
    const undoMock = jest.fn();

    const { attach } = useKeyboard(dispatchMock, undoMock, jest.fn());
    const cleanup = attach(el as unknown as EventTarget);

    expect(el.listenerCount('keydown')).toBe(1);
    cleanup();
    expect(el.listenerCount('keydown')).toBe(0);

    // After cleanup, dispatching a key should NOT call dispatch
    el.dispatchEvent(makeKeyEvent(37));
    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
