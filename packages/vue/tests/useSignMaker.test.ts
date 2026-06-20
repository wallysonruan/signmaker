import { useSignMaker } from '../src/useSignMaker';
import { addSymbol, createDefaultHistory, createScopeManager, EMPTY_STATE } from '@signwriter/editor';

let counter = 0;
const idGen = () => `id${++counter}`;
beforeEach(() => { counter = 0; });

/** Minimal EventTarget stub mirroring the useScopeManager test helper. */
class MockEventTarget {
  private handlers: Map<string, EventListener[]> = new Map();
  addEventListener(type: string, handler: EventListenerOrEventListenerObject): void {
    const h = typeof handler === 'function' ? handler : handler.handleEvent.bind(handler);
    const list = this.handlers.get(type) ?? [];
    list.push(h as EventListener);
    this.handlers.set(type, list);
  }
  removeEventListener(): void { /* not needed here */ }
  dispatchEvent(event: Event): boolean {
    (this.handlers.get(event.type) ?? []).forEach((fn) => fn(event));
    return true;
  }
}

function makeKeyEvent(keyCode: number): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'keyCode', { value: keyCode, writable: false });
  return event;
}

describe('useSignMaker', () => {
  test('initial reactive state is EMPTY_STATE', () => {
    const sm = useSignMaker();
    expect(sm.state.value).toBe(EMPTY_STATE);
    expect(sm.canUndo.value).toBe(false);
    expect(sm.canRedo.value).toBe(false);
  });

  test('dispatch updates reactive state and canUndo', () => {
    const sm = useSignMaker();
    sm.dispatch(addSymbol('S14c20', 100, 200, idGen));
    expect(sm.state.value.symbols).toHaveLength(1);
    expect(sm.canUndo.value).toBe(true);
  });

  test('undo / redo update reactive state', () => {
    const sm = useSignMaker();
    sm.dispatch(addSymbol('S14c20', 100, 200, idGen));
    sm.undo();
    expect(sm.state.value.symbols).toHaveLength(0);
    expect(sm.canRedo.value).toBe(true);
    sm.redo();
    expect(sm.state.value.symbols).toHaveLength(1);
  });

  test('replaceState updates state without recording history', () => {
    const sm = useSignMaker();
    sm.dispatch(addSymbol('S14c20', 100, 200, idGen));
    const depth = sm.canUndo.value;
    sm.replaceState({ ...sm.state.value, entry: 'loaded' });
    expect(sm.state.value.entry).toBe('loaded');
    expect(sm.canUndo.value).toBe(depth);
  });

  test('bus.dispatch records a named history entry', () => {
    const sm = useSignMaker();
    const names: string[] = [];
    sm.history.onPush((c) => names.push(c.name));
    sm.bus.dispatch('add-symbol', addSymbol('S14c20', 100, 200, idGen));
    expect(names).toEqual(['add-symbol']);
  });

  test('scope starts at canvas and F6 toggles it reactively', () => {
    const el = new MockEventTarget();
    const sm = useSignMaker();
    sm.attach(el as unknown as EventTarget);
    expect(sm.scope.value).toBe('canvas');
    el.dispatchEvent(makeKeyEvent(117)); // F6
    expect(sm.scope.value).toBe('palette');
  });

  test('canvas keyboard shortcuts dispatch through the shared bus', () => {
    const el = new MockEventTarget();
    const sm = useSignMaker();
    sm.dispatch(addSymbol('S14c20', 100, 200, idGen));
    sm.attach(el as unknown as EventTarget);
    el.dispatchEvent(makeKeyEvent(37)); // moveLeft
    expect(sm.state.value.symbols[0].x).toBe(99);
  });

  test('shares one scope manager and focus manager', () => {
    const sm = useSignMaker();
    expect(sm.scopeManager.currentScope()).toBe('canvas');
    expect(sm.signMaker.scopeManager).toBe(sm.scopeManager);
    expect(sm.signMaker.focusManager).toBe(sm.focusManager);
  });

  test('accepts an injected history port observed end-to-end', () => {
    const history = createDefaultHistory(EMPTY_STATE);
    const sm = useSignMaker({ history });
    expect(sm.history).toBe(history);
    sm.dispatch(addSymbol('S14c20', 100, 200, idGen));
    expect(history.current().symbols).toHaveLength(1);
    expect(sm.state.value.symbols).toHaveLength(1);
  });

  test('accepts an injected scope manager', () => {
    const scopeManager = createScopeManager();
    const sm = useSignMaker({ scopeManager });
    expect(sm.scopeManager).toBe(scopeManager);
    expect(scopeManager.currentScope()).toBe('canvas'); // useScopeManager entered it
  });
});
