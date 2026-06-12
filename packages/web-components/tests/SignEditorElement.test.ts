import { SignEditorElement, define } from '../src/index';
import { addSymbol } from '@signwriter/editor';

let counter = 0;
const idGen = () => `id${++counter}`;

beforeAll(() => {
  define();
});

function makeEl(): SignEditorElement {
  const el = document.createElement('sign-editor') as SignEditorElement;
  document.body.appendChild(el);
  return el;
}

function removeEl(el: SignEditorElement): void {
  document.body.removeChild(el);
}

// ── Basic state ───────────────────────────────────────────────────────────────

describe('initial state', () => {
  let el: SignEditorElement;
  beforeEach(() => { counter = 0; el = makeEl(); });
  afterEach(() => removeEl(el));

  it('starts with empty symbols', () => {
    expect(el.state.symbols).toHaveLength(0);
  });

  it('canUndo is false initially', () => {
    expect(el.canUndo).toBe(false);
  });

  it('canRedo is false initially', () => {
    expect(el.canRedo).toBe(false);
  });
});

// ── dispatch ──────────────────────────────────────────────────────────────────

describe('dispatch', () => {
  let el: SignEditorElement;
  beforeEach(() => { counter = 0; el = makeEl(); });
  afterEach(() => removeEl(el));

  it('applies a command', () => {
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
    expect(el.state.symbols).toHaveLength(1);
    expect(el.state.symbols[0].key).toBe('S14c20');
  });

  it('fires a statechange event', () => {
    const events: CustomEvent[] = [];
    el.addEventListener('statechange', (e) => events.push(e as CustomEvent));

    el.dispatch(addSymbol('S14c20', 500, 500, idGen));

    expect(events).toHaveLength(1);
    expect(events[0].detail.state.symbols).toHaveLength(1);
  });

  it('enables canUndo after a command', () => {
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
    expect(el.canUndo).toBe(true);
  });
});

// ── undo / redo ───────────────────────────────────────────────────────────────

describe('undo / redo', () => {
  let el: SignEditorElement;
  beforeEach(() => { counter = 0; el = makeEl(); });
  afterEach(() => removeEl(el));

  it('undo removes the last dispatched command', () => {
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
    el.undo();
    expect(el.state.symbols).toHaveLength(0);
  });

  it('redo re-applies after undo', () => {
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
    el.undo();
    expect(el.canRedo).toBe(true);
    el.redo();
    expect(el.state.symbols).toHaveLength(1);
  });

  it('undo is a no-op when nothing to undo', () => {
    el.undo();
    expect(el.state.symbols).toHaveLength(0);
  });
});

// ── replaceState ──────────────────────────────────────────────────────────────

describe('replaceState', () => {
  let el: SignEditorElement;
  beforeEach(() => { counter = 0; el = makeEl(); });
  afterEach(() => removeEl(el));

  it('updates the present state without adding a history entry', () => {
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
    const sym = el.state.symbols[0];
    el.replaceState({ ...el.state, symbols: [{ ...sym, x: 600 }] });
    expect(el.state.symbols[0].x).toBe(600);
    // undo jumps back past replaceState to before addSymbol
    el.undo();
    expect(el.state.symbols).toHaveLength(0);
  });

  it('fires a statechange event', () => {
    const events: CustomEvent[] = [];
    el.addEventListener('statechange', (e) => events.push(e as CustomEvent));
    el.replaceState({ ...el.state });
    expect(events).toHaveLength(1);
  });
});

// ── keyboard ──────────────────────────────────────────────────────────────────

describe('keyboard handling', () => {
  let el: SignEditorElement;
  beforeEach(() => { counter = 0; el = makeEl(); });
  afterEach(() => removeEl(el));

  it('Backspace deletes the selected symbol', () => {
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
    // addSymbol auto-selects the new symbol
    expect(el.state.selection.size).toBe(1);

    el.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 8, bubbles: true }));

    expect(el.state.symbols).toHaveLength(0);
  });

  it('Ctrl+Z triggers undo', () => {
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
    el.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 90, ctrlKey: true, bubbles: true }));
    expect(el.state.symbols).toHaveLength(0);
  });

  it('Ctrl+Shift+Z triggers redo', () => {
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
    el.undo();
    el.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 90, ctrlKey: true, shiftKey: true, bubbles: true }));
    expect(el.state.symbols).toHaveLength(1);
  });

  it('keyboard listener is removed on disconnect', () => {
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
    removeEl(el);

    // Re-add to check dispatch doesn't fire statechange from keyboard
    const events: CustomEvent[] = [];
    el.addEventListener('statechange', (e) => events.push(e as CustomEvent));
    el.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 8, bubbles: true }));

    // Symbol should still be there — keyboard handler was removed
    expect(el.state.symbols).toHaveLength(1);
    // Re-append for cleanup
    document.body.appendChild(el);
  });
});

// ── drag ─────────────────────────────────────────────────────────────────────

describe('drag', () => {
  let el: SignEditorElement;
  beforeEach(() => {
    counter = 0;
    el = makeEl();
    el.dispatch(addSymbol('S14c20', 500, 500, idGen));
  });
  afterEach(() => removeEl(el));

  it('startSymbolDrag selects the symbol (no history entry)', () => {
    const id = el.state.symbols[0].id;
    el.startSymbolDrag(id, 0, 0);
    expect(el.state.selection.has(id)).toBe(true);
    // undo should jump back to before addSymbol (replaceState has no history entry)
    el.undo();
    expect(el.state.symbols).toHaveLength(0);
  });

  it('endSymbolDrag commits the delta', () => {
    const id = el.state.symbols[0].id;
    el.startSymbolDrag(id, 100, 100);
    el.moveSymbolDrag(110, 115);
    el.endSymbolDrag();
    expect(el.state.symbols[0].x).toBe(510);
    expect(el.state.symbols[0].y).toBe(515);
  });

  it('cancelSymbolDrag discards the delta', () => {
    const id = el.state.symbols[0].id;
    el.startSymbolDrag(id, 100, 100);
    el.moveSymbolDrag(150, 150);
    el.cancelSymbolDrag();
    expect(el.state.symbols[0].x).toBe(500);
    expect(el.state.symbols[0].y).toBe(500);
  });

  it('moveSymbolDrag is a no-op when no drag is active', () => {
    el.moveSymbolDrag(999, 999);
    expect(el.state.symbols[0].x).toBe(500);
  });

  it('endSymbolDrag is a no-op when no drag is active', () => {
    const before = el.state;
    el.endSymbolDrag();
    expect(el.state).toBe(before);
  });
});
