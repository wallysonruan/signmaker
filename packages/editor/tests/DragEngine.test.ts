import { startDrag, updateDrag, endDrag, cancelDrag } from '../src/DragEngine';
import { EMPTY_STATE } from '../src/types';
import { addSymbol } from '../src/commands';

let counter = 0;
const idGen = () => `id${++counter}`;
beforeEach(() => { counter = 0; });

function withSymbol(x = 500, y = 500) {
  return addSymbol('S14c20', x, y, idGen)(EMPTY_STATE);
}

// ── startDrag ─────────────────────────────────────────────────────────────────

describe('startDrag()', () => {
  test('selects the dragged symbol', () => {
    const s0 = withSymbol();
    const id = s0.symbols[0].id;
    const { editorState } = startDrag(s0, id);
    expect(editorState.selection.has(id)).toBe(true);
  });

  test('deselects other symbols', () => {
    const s0 = addSymbol('S27106', 510, 510, idGen)(withSymbol());
    const id0 = s0.symbols[0].id;
    const id1 = s0.symbols[1].id;
    const bothSelected = { ...s0, selection: new Set([id0, id1]) };
    const { editorState } = startDrag(bothSelected, id0);
    expect(editorState.selection.has(id0)).toBe(true);
    expect(editorState.selection.has(id1)).toBe(false);
  });

  test('initial drag state has zero deltas', () => {
    const s0 = withSymbol();
    const id = s0.symbols[0].id;
    const { drag } = startDrag(s0, id);
    expect(drag.deltaX).toBe(0);
    expect(drag.deltaY).toBe(0);
  });

  test('drag state records the symbol id', () => {
    const s0 = withSymbol();
    const id = s0.symbols[0].id;
    const { drag } = startDrag(s0, id);
    expect(drag.symbolId).toBe(id);
  });
});

// ── updateDrag ────────────────────────────────────────────────────────────────

describe('updateDrag()', () => {
  test('updates deltaX and deltaY', () => {
    const s0 = withSymbol();
    const id = s0.symbols[0].id;
    const { drag: d0 } = startDrag(s0, id);
    const d1 = updateDrag(d0, 15, -8);
    expect(d1.deltaX).toBe(15);
    expect(d1.deltaY).toBe(-8);
  });

  test('does not modify editor state', () => {
    const s0 = withSymbol();
    const id = s0.symbols[0].id;
    const { editorState, drag: d0 } = startDrag(s0, id);
    updateDrag(d0, 15, -8);
    // editor state is unchanged — updateDrag returns only new drag
    expect(editorState.symbols[0].x).toBe(500);
  });

  test('replaces previous delta (absolute, not cumulative)', () => {
    const s0 = withSymbol();
    const id = s0.symbols[0].id;
    const { drag: d0 } = startDrag(s0, id);
    const d1 = updateDrag(d0, 10, 10);
    const d2 = updateDrag(d1, 25, 5);
    expect(d2.deltaX).toBe(25);
    expect(d2.deltaY).toBe(5);
  });
});

// ── endDrag ───────────────────────────────────────────────────────────────────

describe('endDrag()', () => {
  test('applies delta to symbol position', () => {
    const s0 = withSymbol(500, 500);
    const id = s0.symbols[0].id;
    const { editorState, drag: d0 } = startDrag(s0, id);
    const d1 = updateDrag(d0, 10, -5);
    const result = endDrag(editorState, d1);
    expect(result.symbols[0].x).toBe(510);
    expect(result.symbols[0].y).toBe(495);
  });

  test('zero-delta end drag is a no-op', () => {
    const s0 = withSymbol();
    const id = s0.symbols[0].id;
    const { editorState, drag } = startDrag(s0, id);
    const result = endDrag(editorState, drag);
    expect(result).toBe(editorState);
  });

  test('allows negative resulting coordinates', () => {
    const s0 = withSymbol(5, 5);
    const id = s0.symbols[0].id;
    const { editorState, drag: d0 } = startDrag(s0, id);
    const d1 = updateDrag(d0, -20, -20);
    const result = endDrag(editorState, d1);
    expect(result.symbols[0].x).toBe(-15);
    expect(result.symbols[0].y).toBe(-15);
  });
});

// ── cancelDrag ────────────────────────────────────────────────────────────────

describe('cancelDrag()', () => {
  test('returns the editor state unchanged', () => {
    const s0 = withSymbol();
    const id = s0.symbols[0].id;
    const { editorState, drag: d0 } = startDrag(s0, id);
    updateDrag(d0, 100, 100);
    const result = cancelDrag(editorState);
    expect(result).toBe(editorState);
    expect(result.symbols[0].x).toBe(500);
    expect(result.symbols[0].y).toBe(500);
  });
});
