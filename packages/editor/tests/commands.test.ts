import {
  addSymbol, deleteSelected, clearAll,
  moveSelected, copySelected, bringToFront,
  rotateSelected, mirrorSelected, fillSelected, variationSelected,
  addSortKey, setTerms, setEntry,
} from '../src/commands';
import { EMPTY_STATE } from '../src/types';
import type { EditorState } from '../src/types';

let counter = 0;
const idGen = () => `id${++counter}`;
beforeEach(() => { counter = 0; });

function withSymbol(key: string, x = 500, y = 500): EditorState {
  return addSymbol(key, x, y, idGen)(EMPTY_STATE);
}

function withTwo(): EditorState {
  return addSymbol('S27106', 510, 510, idGen)(withSymbol('S14c20', 500, 500));
}

// ── addSymbol ─────────────────────────────────────────────────────────────────

describe('addSymbol()', () => {
  test('appends a new symbol', () => {
    const s = addSymbol('S14c20', 481, 471, idGen)(EMPTY_STATE);
    expect(s.symbols).toHaveLength(1);
    expect(s.symbols[0].key).toBe('S14c20');
    expect(s.symbols[0].x).toBe(481);
    expect(s.symbols[0].y).toBe(471);
  });

  test('assigns a unique ID from idGen', () => {
    const s = addSymbol('S14c20', 500, 500, idGen)(EMPTY_STATE);
    expect(typeof s.symbols[0].id).toBe('string');
    expect(s.symbols[0].id.length).toBeGreaterThan(0);
  });

  test('deselects all existing symbols before adding', () => {
    const s0 = withSymbol('S14c20');
    expect(s0.selection.has(s0.symbols[0].id)).toBe(true);
    const s1 = addSymbol('S27106', 510, 510, idGen)(s0);
    expect(s1.selection.has(s0.symbols[0].id)).toBe(false);
    expect(s1.selection.has(s1.symbols[1].id)).toBe(true);
  });

  test('new symbol is selected', () => {
    const s = withSymbol('S14c20');
    expect(s.selection.has(s.symbols[0].id)).toBe(true);
  });
});

// ── deleteSelected ────────────────────────────────────────────────────────────

describe('deleteSelected()', () => {
  test('removes selected symbol', () => {
    const s0 = withSymbol('S14c20');
    const s1 = deleteSelected()(s0);
    expect(s1.symbols).toHaveLength(0);
  });

  test('does not remove unselected symbols', () => {
    const s0 = withSymbol('S14c20');
    const noSel = { ...s0, selection: new Set<string>() };
    expect(deleteSelected()(noSel).symbols).toHaveLength(1);
  });

  test('removes only selected symbol from two-symbol list', () => {
    const s0 = withTwo();
    const id0 = s0.symbols[0].id;
    const id1 = s0.symbols[1].id;
    const selFirst = { ...s0, selection: new Set([id0]) };
    const result = deleteSelected()(selFirst);
    expect(result.symbols).toHaveLength(1);
    expect(result.symbols[0].id).toBe(id1);
  });

  test('BUG FIX: deletes both consecutive selected symbols correctly', () => {
    // Original signmaker had a bug where consecutive selected symbols left
    // one survivor. The new filter-based implementation is correct.
    const s0 = withTwo();
    const selBoth = { ...s0, selection: new Set(s0.symbols.map(s => s.id)) };
    expect(deleteSelected()(selBoth).symbols).toHaveLength(0);
  });

  test('clears selection after delete', () => {
    const s0 = withSymbol('S14c20');
    expect(deleteSelected()(s0).selection.size).toBe(0);
  });
});

// ── clearAll ──────────────────────────────────────────────────────────────────

describe('clearAll()', () => {
  test('removes all symbols', () => {
    const s0 = withTwo();
    expect(clearAll()(s0).symbols).toHaveLength(0);
  });

  test('clears sort array', () => {
    const s0 = { ...EMPTY_STATE, sort: ['S14c20', 'S27106'] };
    expect(clearAll()(s0).sort).toHaveLength(0);
  });

  test('clears selection', () => {
    const s0 = withSymbol('S14c20');
    expect(clearAll()(s0).selection.size).toBe(0);
  });
});

// ── moveSelected ──────────────────────────────────────────────────────────────

describe('moveSelected()', () => {
  test('moves selected symbol by delta', () => {
    const s0 = withSymbol('S14c20', 500, 500);
    const id = s0.symbols[0].id;
    const s1 = moveSelected(10, -5)({ ...s0, selection: new Set([id]) });
    expect(s1.symbols[0].x).toBe(510);
    expect(s1.symbols[0].y).toBe(495);
  });

  test('does not move unselected symbols', () => {
    const s0 = withTwo();
    const id0 = s0.symbols[0].id;
    const selFirst = { ...s0, selection: new Set([id0]) };
    const result = moveSelected(10, 10)(selFirst);
    expect(result.symbols[1].x).toBe(510);  // unchanged
  });

  test('allows negative coordinates (no bounds checking)', () => {
    const s0 = withSymbol('S14c20', 5, 5);
    const id = s0.symbols[0].id;
    const result = moveSelected(-10, -10)({ ...s0, selection: new Set([id]) });
    expect(result.symbols[0].x).toBe(-5);
    expect(result.symbols[0].y).toBe(-5);
  });

  test('applies to ALL selected symbols (multi-select works)', () => {
    const s0 = withTwo();
    const bothSelected = { ...s0, selection: new Set(s0.symbols.map(s => s.id)) };
    const result = moveSelected(10, 0)(bothSelected);
    expect(result.symbols[0].x).toBe(510);
    expect(result.symbols[1].x).toBe(520);
  });
});

// ── copySelected ──────────────────────────────────────────────────────────────

describe('copySelected()', () => {
  test('duplicates selected symbol at +10,+10', () => {
    const s0 = withSymbol('S14c20', 500, 500);
    const id = s0.symbols[0].id;
    const s1 = copySelected(idGen)({ ...s0, selection: new Set([id]) });
    expect(s1.symbols).toHaveLength(2);
    expect(s1.symbols[1].key).toBe('S14c20');
    expect(s1.symbols[1].x).toBe(510);
    expect(s1.symbols[1].y).toBe(510);
  });

  test('copy is selected; original is deselected', () => {
    const s0 = withSymbol('S14c20', 500, 500);
    const id0 = s0.symbols[0].id;
    const s1 = copySelected(idGen)({ ...s0, selection: new Set([id0]) });
    expect(s1.selection.has(id0)).toBe(false);
    expect(s1.selection.has(s1.symbols[1].id)).toBe(true);
  });

  test('does not copy unselected symbols', () => {
    const s0 = withTwo();
    const noSel = { ...s0, selection: new Set<string>() };
    expect(copySelected(idGen)(noSel).symbols).toHaveLength(2);
  });

  test('custom offset is applied', () => {
    const s0 = withSymbol('S14c20', 500, 500);
    const id = s0.symbols[0].id;
    const s1 = copySelected(idGen, 20, 30)({ ...s0, selection: new Set([id]) });
    expect(s1.symbols[1].x).toBe(520);
    expect(s1.symbols[1].y).toBe(530);
  });
});

// ── bringToFront ──────────────────────────────────────────────────────────────

describe('bringToFront()', () => {
  test('moves selected symbol to end of list', () => {
    const s0 = withTwo();
    const id0 = s0.symbols[0].id;
    const result = bringToFront()({ ...s0, selection: new Set([id0]) });
    expect(result.symbols[result.symbols.length - 1].id).toBe(id0);
  });

  test('preserves total symbol count', () => {
    const s0 = withTwo();
    const id0 = s0.symbols[0].id;
    const result = bringToFront()({ ...s0, selection: new Set([id0]) });
    expect(result.symbols).toHaveLength(2);
  });
});

// ── rotateSelected / mirrorSelected / fillSelected / variationSelected ────────

describe('rotateSelected()', () => {
  test('changes key of selected symbol', () => {
    const s0 = withSymbol('S14c20');
    const id = s0.symbols[0].id;
    const result = rotateSelected(1)({ ...s0, selection: new Set([id]) });
    expect(result.symbols[0].key).not.toBe('S14c20');
  });

  test('does not change unselected symbols', () => {
    const s0 = withTwo();
    const id1 = s0.symbols[1].id;
    const result = rotateSelected(1)({ ...s0, selection: new Set([id1]) });
    expect(result.symbols[0].key).toBe('S14c20');
  });

  test('16 rotations cycles back to original', () => {
    const s0 = withSymbol('S14c20');
    const id = s0.symbols[0].id;
    let state: EditorState = { ...s0, selection: new Set([id]) };
    for (let i = 0; i < 16; i++) state = rotateSelected(1)(state);
    expect(state.symbols[0].key).toBe('S14c20');
  });
});

describe('mirrorSelected()', () => {
  test('changes key of selected symbol', () => {
    const s0 = withSymbol('S14c20');
    const id = s0.symbols[0].id;
    const result = mirrorSelected()({ ...s0, selection: new Set([id]) });
    expect(result.symbols[0].key).not.toBe('S14c20');
  });

  test('is its own inverse', () => {
    const s0 = withSymbol('S14c20');
    const id = s0.symbols[0].id;
    const sel = { ...s0, selection: new Set([id]) };
    expect(mirrorSelected()(mirrorSelected()(sel)).symbols[0].key).toBe('S14c20');
  });
});

describe('fillSelected()', () => {
  test('6 fill steps cycle back to original', () => {
    const s0 = withSymbol('S14c20');
    const id = s0.symbols[0].id;
    let state: EditorState = { ...s0, selection: new Set([id]) };
    for (let i = 0; i < 6; i++) state = fillSelected(1)(state);
    expect(state.symbols[0].key).toBe('S14c20');
  });
});

describe('variationSelected()', () => {
  test('changes key of selected symbol', () => {
    const s0 = withSymbol('S14c20');
    const id = s0.symbols[0].id;
    const result = variationSelected(1)({ ...s0, selection: new Set([id]) });
    expect(result.symbols[0].key).not.toBe('S14c20');
  });
});

// ── addSortKey ────────────────────────────────────────────────────────────────

describe('addSortKey()', () => {
  test('inserts key at given position', () => {
    const s0 = addSortKey('S14c20', 0)(EMPTY_STATE);
    expect(s0.sort[0]).toBe('S14c20');
  });

  test('inserts before existing key when position is 0', () => {
    const s0 = addSortKey('S14c20', 0)(EMPTY_STATE);
    const s1 = addSortKey('S27106', 0)(s0);
    expect(s1.sort[0]).toBe('S27106');
    expect(s1.sort[1]).toBe('S14c20');
  });
});

// ── setTerms / setEntry ───────────────────────────────────────────────────────

describe('setTerms()', () => {
  test('replaces all terms', () => {
    const terms = ['hello', 'world', '', '', '', '', '', ''];
    const result = setTerms(terms)(EMPTY_STATE);
    expect(result.terms[0]).toBe('hello');
    expect(result.terms[1]).toBe('world');
  });
});

describe('setEntry()', () => {
  test('sets entry string', () => {
    const result = setEntry('some-entry')(EMPTY_STATE);
    expect(result.entry).toBe('some-entry');
  });
});
