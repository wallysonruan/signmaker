import {
  getSelected, selectNone, selectById, cycleSelection,
} from '../src/SelectionEngine';
import { EMPTY_STATE } from '../src/types';
import { addSymbol } from '../src/commands';
import type { EditorState } from '../src/types';

let counter = 0;
const idGen = () => `id${++counter}`;
beforeEach(() => { counter = 0; });

function withSymbol(key: string): EditorState {
  return addSymbol(key, 500, 500, idGen)(EMPTY_STATE);
}

function withTwo(): EditorState {
  return addSymbol('S27106', 510, 510, idGen)(withSymbol('S14c20'));
}

// ── getSelected ───────────────────────────────────────────────────────────────

describe('getSelected()', () => {
  test('returns selected symbols', () => {
    const s = withSymbol('S14c20');
    const selected = getSelected(s);
    expect(selected).toHaveLength(1);
    expect(selected[0].key).toBe('S14c20');
  });

  test('returns empty array when nothing selected', () => {
    const s = { ...withSymbol('S14c20'), selection: new Set<string>() };
    expect(getSelected(s)).toHaveLength(0);
  });

  test('returns multiple selected symbols', () => {
    const s0 = withTwo();
    const both = { ...s0, selection: new Set(s0.symbols.map(sym => sym.id)) };
    expect(getSelected(both)).toHaveLength(2);
  });
});

// ── selectNone ────────────────────────────────────────────────────────────────

describe('selectNone()', () => {
  test('clears selection', () => {
    const s0 = withSymbol('S14c20');
    expect(selectNone(s0).selection.size).toBe(0);
  });

  test('does not modify symbols array', () => {
    const s0 = withSymbol('S14c20');
    const s1 = selectNone(s0);
    expect(s1.symbols).toHaveLength(1);
    expect(s1.symbols[0]).toBe(s0.symbols[0]);
  });
});

// ── selectById ────────────────────────────────────────────────────────────────

describe('selectById()', () => {
  test('selects the given symbol', () => {
    const s0 = withTwo();
    const id = s0.symbols[0].id;
    const noSel = selectNone(s0);
    const result = selectById(noSel, id);
    expect(result.selection.has(id)).toBe(true);
  });

  test('replaces existing selection with new id', () => {
    const s0 = withTwo();
    const id0 = s0.symbols[0].id;
    const id1 = s0.symbols[1].id;
    const oneSelected = { ...s0, selection: new Set([id0]) };
    const result = selectById(oneSelected, id1);
    expect(result.selection.has(id0)).toBe(false);
    expect(result.selection.has(id1)).toBe(true);
  });

  test('no-op if id not in symbols', () => {
    const s0 = withSymbol('S14c20');
    const result = selectById(s0, 'nonexistent');
    expect(result.selection.size).toBe(s0.selection.size);
  });
});

// ── cycleSelection ────────────────────────────────────────────────────────────

describe('cycleSelection()', () => {
  test('selects first symbol when none selected (step +1)', () => {
    const s0 = withTwo();
    const noSel = selectNone(s0);
    const result = cycleSelection(noSel, 1);
    expect(result.selection.has(s0.symbols[0].id)).toBe(true);
  });

  test('selects first symbol when none selected (step -1)', () => {
    // With currentIdx=-1 and step=-1: ((-1+-1)%len+len)%len = (0+2)%2 = 0 (first symbol)
    const s0 = withTwo();
    const noSel = selectNone(s0);
    const result = cycleSelection(noSel, -1);
    expect(result.selection.has(s0.symbols[0].id)).toBe(true);
  });

  test('advances selection to next symbol (step +1)', () => {
    const s0 = withTwo();
    const id0 = s0.symbols[0].id;
    const id1 = s0.symbols[1].id;
    const selFirst = { ...s0, selection: new Set([id0]) };
    const result = cycleSelection(selFirst, 1);
    expect(result.selection.has(id1)).toBe(true);
    expect(result.selection.has(id0)).toBe(false);
  });

  test('wraps forward past last symbol', () => {
    const s0 = withTwo();
    const lastId = s0.symbols[s0.symbols.length - 1].id;
    const firstId = s0.symbols[0].id;
    const selLast = { ...s0, selection: new Set([lastId]) };
    const result = cycleSelection(selLast, 1);
    expect(result.selection.has(firstId)).toBe(true);
  });

  test('wraps backward past first symbol', () => {
    const s0 = withTwo();
    const firstId = s0.symbols[0].id;
    const lastId  = s0.symbols[s0.symbols.length - 1].id;
    const selFirst = { ...s0, selection: new Set([firstId]) };
    const result = cycleSelection(selFirst, -1);
    expect(result.selection.has(lastId)).toBe(true);
  });

  test('no-op on empty symbol list', () => {
    expect(cycleSelection(EMPTY_STATE, 1)).toBe(EMPTY_STATE);
  });

  test('selection is exactly one symbol after cycling', () => {
    const s0 = withTwo();
    const result = cycleSelection(s0, 1);
    expect(result.selection.size).toBe(1);
  });
});
