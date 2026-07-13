import { useScopeManager } from '../src/useScopeManager';
import { useEditorState } from '../src/useEditorState';
import { addSymbol } from '@wallysonruan/signmaker-editor-engine';

let counter = 0;
const idGen = () => `id${++counter}`;

beforeEach(() => { counter = 0; });

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
    (this.handlers.get(event.type) ?? []).forEach((fn) => fn(event));
    return true;
  }
  listenerCount(type: string): number {
    return (this.handlers.get(type) ?? []).length;
  }
}

function makeKeyEvent(keyCode: number, opts: { shiftKey?: boolean; ctrlKey?: boolean; key?: string } = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    shiftKey: opts.shiftKey ?? false,
    ctrlKey: opts.ctrlKey ?? false,
    key: opts.key ?? '',
  });
  Object.defineProperty(event, 'keyCode', { value: keyCode, writable: false });
  return event;
}

describe('useScopeManager', () => {
  test('starts in canvas scope', () => {
    const { dispatch, undo, redo } = useEditorState();
    const { scope } = useScopeManager(dispatch, undo, redo);
    expect(scope.value).toBe('canvas');
  });

  test('F6 toggles between canvas and palette', () => {
    const el = new MockEventTarget();
    const { dispatch, undo, redo } = useEditorState();
    const { scope, attach } = useScopeManager(dispatch, undo, redo);
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(117)); // F6
    expect(scope.value).toBe('palette');
    el.dispatchEvent(makeKeyEvent(117)); // F6
    expect(scope.value).toBe('canvas');
  });

  test('canvas scope dispatches arrow-key commands', () => {
    const el = new MockEventTarget();
    const editor = useEditorState();
    editor.dispatch(addSymbol('S14c20', 100, 200, idGen)); // selected on add
    const { attach } = useScopeManager(editor.dispatch, editor.undo, editor.redo);
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(37)); // moveLeft
    expect(editor.state.value.symbols[0].x).toBe(99);
  });

  test('palette scope suppresses canvas shortcuts', () => {
    const el = new MockEventTarget();
    const editor = useEditorState();
    editor.dispatch(addSymbol('S14c20', 100, 200, idGen));
    const { attach } = useScopeManager(editor.dispatch, editor.undo, editor.redo);
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(117)); // → palette
    el.dispatchEvent(makeKeyEvent(37));  // arrow should NOT move symbol in palette scope
    expect(editor.state.value.symbols[0].x).toBe(100);
  });

  test('Ctrl+Z routes to onUndo in canvas scope', () => {
    const el = new MockEventTarget();
    const undoMock = jest.fn();
    const { attach } = useScopeManager(jest.fn(), undoMock, jest.fn());
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(90, { ctrlKey: true }));
    expect(undoMock).toHaveBeenCalledTimes(1);
  });

  test('exposes the underlying manager with currentScope()', () => {
    const { dispatch, undo, redo } = useEditorState();
    const { manager } = useScopeManager(dispatch, undo, redo);
    expect(manager.currentScope()).toBe('canvas');
    manager.enter('palette');
    expect(manager.currentScope()).toBe('palette');
  });

  test('disabling a scope via manager prevents F6 from entering it', () => {
    const el = new MockEventTarget();
    const { dispatch, undo, redo } = useEditorState();
    const { scope, manager, attach } = useScopeManager(dispatch, undo, redo);
    attach(el as unknown as EventTarget);

    manager.disable('palette');
    el.dispatchEvent(makeKeyEvent(117)); // F6 → would go to palette, but it's disabled
    expect(scope.value).toBe('canvas');
  });

  test('focus moves to the entered scope target on scope change', () => {
    const { dispatch, undo, redo } = useEditorState();
    const { manager, focusManager } = useScopeManager(dispatch, undo, redo);
    const palette = jest.fn();
    const canvas = jest.fn();
    focusManager.register('palette', palette);
    focusManager.register('canvas', canvas);

    manager.enter('palette');
    expect(palette).toHaveBeenCalledTimes(1);
    manager.enter('canvas');
    expect(canvas).toHaveBeenCalledTimes(1);
  });

  test('F6 toggle drives focus through the focus manager', () => {
    const el = new MockEventTarget();
    const { focusManager, attach } = useScopeManager(jest.fn(), jest.fn(), jest.fn());
    const palette = jest.fn();
    focusManager.register('palette', palette);
    attach(el as unknown as EventTarget);

    el.dispatchEvent(makeKeyEvent(117)); // F6 → palette
    expect(palette).toHaveBeenCalledTimes(1);
  });

  test('accepts an injected focus manager', () => {
    const calls: string[] = [];
    const injected = {
      register: jest.fn(),
      focusScope: (name: string) => { calls.push(name); return true; },
      hasTarget: () => true,
    };
    const { manager, focusManager } = useScopeManager(jest.fn(), jest.fn(), jest.fn(), {
      focusManager: injected,
    });
    expect(focusManager).toBe(injected);
    manager.enter('palette');
    expect(calls).toContain('palette');
  });

  test('attach cleanup removes the listener', () => {
    const el = new MockEventTarget();
    const { dispatch, undo, redo } = useEditorState();
    const { attach } = useScopeManager(dispatch, undo, redo);
    const detach = attach(el as unknown as EventTarget);
    expect(el.listenerCount('keydown')).toBe(1);
    detach();
    expect(el.listenerCount('keydown')).toBe(0);
  });
});
