import {
  createHistory, apply, canUndo, canRedo, undo, redo,
} from '../src/CommandHistory';
import { EMPTY_STATE } from '../src/types';
import { addSymbol } from '../src/commands';
import type { EditorState } from '../src/types';

let counter = 0;
const idGen = () => `id${++counter}`;
beforeEach(() => { counter = 0; });

// ── createHistory ─────────────────────────────────────────────────────────────

describe('createHistory()', () => {
  test('creates history with provided state as present', () => {
    const h = createHistory(EMPTY_STATE);
    expect(h.present).toBe(EMPTY_STATE);
  });

  test('past and future are empty', () => {
    const h = createHistory(EMPTY_STATE);
    expect(h.past).toHaveLength(0);
    expect(h.future).toHaveLength(0);
  });
});

// ── apply ─────────────────────────────────────────────────────────────────────

describe('apply()', () => {
  test('applies command and updates present', () => {
    const h0 = createHistory(EMPTY_STATE);
    const h1 = apply(h0, addSymbol('S14c20', 500, 500, idGen));
    expect(h1.present.symbols).toHaveLength(1);
  });

  test('pushes old present onto past', () => {
    const h0 = createHistory(EMPTY_STATE);
    const h1 = apply(h0, addSymbol('S14c20', 500, 500, idGen));
    expect(h1.past).toHaveLength(1);
    expect(h1.past[0]).toBe(EMPTY_STATE);
  });

  test('clears future on new command', () => {
    const h0 = createHistory(EMPTY_STATE);
    const h1 = apply(h0, addSymbol('S14c20', 500, 500, idGen));
    const h2 = undo(h1);
    expect(h2.future).toHaveLength(1);
    const h3 = apply(h2, addSymbol('S27106', 510, 510, idGen));
    expect(h3.future).toHaveLength(0);
  });

  test('no-op command (returns same state) does not push to past', () => {
    const h0 = createHistory(EMPTY_STATE);
    const noOp = (s: EditorState) => s;
    const h1 = apply(h0, noOp);
    expect(h1.past).toHaveLength(0);
    expect(h1).toBe(h0);
  });
});

// ── canUndo / canRedo ─────────────────────────────────────────────────────────

describe('canUndo()', () => {
  test('false on fresh history', () => {
    expect(canUndo(createHistory(EMPTY_STATE))).toBe(false);
  });

  test('true after applying a command', () => {
    const h = apply(createHistory(EMPTY_STATE), addSymbol('S14c20', 500, 500, idGen));
    expect(canUndo(h)).toBe(true);
  });
});

describe('canRedo()', () => {
  test('false on fresh history', () => {
    expect(canRedo(createHistory(EMPTY_STATE))).toBe(false);
  });

  test('true after undo', () => {
    const h0 = apply(createHistory(EMPTY_STATE), addSymbol('S14c20', 500, 500, idGen));
    const h1 = undo(h0);
    expect(canRedo(h1)).toBe(true);
  });
});

// ── undo ──────────────────────────────────────────────────────────────────────

describe('undo()', () => {
  test('restores previous state', () => {
    const h0 = createHistory(EMPTY_STATE);
    const h1 = apply(h0, addSymbol('S14c20', 500, 500, idGen));
    const h2 = undo(h1);
    expect(h2.present.symbols).toHaveLength(0);
  });

  test('moved present to future', () => {
    const h0 = createHistory(EMPTY_STATE);
    const h1 = apply(h0, addSymbol('S14c20', 500, 500, idGen));
    const symbolState = h1.present;
    const h2 = undo(h1);
    expect(h2.future[0]).toBe(symbolState);
  });

  test('is a no-op if past is empty', () => {
    const h = createHistory(EMPTY_STATE);
    expect(undo(h)).toBe(h);
  });

  test('multiple undos walk back the full history', () => {
    let h = createHistory(EMPTY_STATE);
    h = apply(h, addSymbol('S14c20', 500, 500, idGen));
    h = apply(h, addSymbol('S27106', 510, 510, idGen));
    h = undo(h);
    expect(h.present.symbols).toHaveLength(1);
    h = undo(h);
    expect(h.present.symbols).toHaveLength(0);
  });
});

// ── redo ──────────────────────────────────────────────────────────────────────

describe('redo()', () => {
  test('restores undone state', () => {
    const h0 = createHistory(EMPTY_STATE);
    const h1 = apply(h0, addSymbol('S14c20', 500, 500, idGen));
    const h2 = undo(h1);
    const h3 = redo(h2);
    expect(h3.present.symbols).toHaveLength(1);
  });

  test('is a no-op if future is empty', () => {
    const h = createHistory(EMPTY_STATE);
    expect(redo(h)).toBe(h);
  });

  test('undo+redo round-trips back to same state object', () => {
    const h0 = createHistory(EMPTY_STATE);
    const h1 = apply(h0, addSymbol('S14c20', 500, 500, idGen));
    const target = h1.present;
    const h2 = undo(h1);
    const h3 = redo(h2);
    expect(h3.present).toBe(target);
  });

  test('multiple redos walk forward', () => {
    let h = createHistory(EMPTY_STATE);
    h = apply(h, addSymbol('S14c20', 500, 500, idGen));
    h = apply(h, addSymbol('S27106', 510, 510, idGen));
    h = undo(h);
    h = undo(h);
    h = redo(h);
    expect(h.present.symbols).toHaveLength(1);
    h = redo(h);
    expect(h.present.symbols).toHaveLength(2);
  });
});

// ── integration ───────────────────────────────────────────────────────────────

describe('history integration', () => {
  test('undo+new command clears redo stack', () => {
    let h = createHistory(EMPTY_STATE);
    h = apply(h, addSymbol('S14c20', 500, 500, idGen));
    h = undo(h);
    h = apply(h, addSymbol('S27106', 510, 510, idGen));
    expect(h.future).toHaveLength(0);
    expect(canRedo(h)).toBe(false);
  });
});
