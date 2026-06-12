/**
 * History / Undo / Redo Tests
 *
 * Documents `signmaker.vm.addhistory()`, `signmaker.vm.undo()`, and
 * `signmaker.vm.redo()`.
 *
 * History is an array of JSON strings.  Each entry serializes
 * {list, sort, terms, entry} with all `selected` properties replaced by
 * `false` (the `.replace(/true/g,'false')` normalization).
 *
 * The cursor tracks the current position in the history array.
 */

beforeEach(() => resetEditor());

// ── Initial state ─────────────────────────────────────────────────────────────

describe('initial history state', () => {
  test('starts at cursor 0', () => {
    expect(signmaker.vm.cursor).toBe(0);
  });

  test('history has one entry at startup (empty state snapshot)', () => {
    expect(signmaker.vm.history.length).toBe(1);
  });

  test('undo() is a no-op when cursor is already at 0', () => {
    signmaker.vm.undo();
    expect(signmaker.vm.cursor).toBe(0);
  });

  test('redo() is a no-op when there is nothing to redo', () => {
    signmaker.vm.redo();
    expect(signmaker.vm.cursor).toBe(0);
  });
});

// ── addhistory() ──────────────────────────────────────────────────────────────

describe('addhistory()', () => {
  test('addhistory() appends a new entry when state changed', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    expect(signmaker.vm.history.length).toBe(2);
    expect(signmaker.vm.cursor).toBe(1);
  });

  test('addhistory() does not duplicate if state is unchanged', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    const lengthBefore = signmaker.vm.history.length;
    signmaker.vm.addhistory();
    expect(signmaker.vm.history.length).toBe(lengthBefore);
  });

  test('history grows with each distinct state change', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(1, 0);
    // add + move should create at least 2 history entries beyond initial
    expect(signmaker.vm.cursor).toBeGreaterThanOrEqual(2);
  });
});

// ── undo() ────────────────────────────────────────────────────────────────────

describe('undo()', () => {
  test('undo() after add() removes the symbol', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    expect(signmaker.vm.list.length).toBe(1);
    signmaker.vm.undo();
    expect(signmaker.vm.list.length).toBe(0);
  });

  test('undo() decrements cursor by 1', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    const cursorBefore = signmaker.vm.cursor;
    signmaker.vm.undo();
    expect(signmaker.vm.cursor).toBe(cursorBefore - 1);
  });

  test('undo() restores symbol positions', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(10, 10);
    signmaker.vm.undo();
    expect(signmaker.vm.list[0].x()).toBe(500);
    expect(signmaker.vm.list[0].y()).toBe(500);
  });

  test('undo() restores sort array', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.addSeq('S14c20', 0);
    expect(signmaker.vm.sort.length).toBe(1);
    signmaker.vm.undo();
    expect(signmaker.vm.sort.length).toBe(0);
  });

  test('multiple undos traverse history backwards', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    expect(signmaker.vm.list.length).toBe(2);
    signmaker.vm.undo();
    expect(signmaker.vm.list.length).toBe(1);
    signmaker.vm.undo();
    expect(signmaker.vm.list.length).toBe(0);
  });

  test('undo() cannot go below initial state', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.undo(); // back to initial
    signmaker.vm.undo(); // should be no-op
    signmaker.vm.undo(); // should be no-op
    expect(signmaker.vm.cursor).toBe(0);
    expect(signmaker.vm.list.length).toBe(0);
  });

  test('undo() restores all symbols are deselected', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.undo();
    // History serializes selected=false; after restore all should be false
    const anySelected = signmaker.vm.list.some(s => s.selected());
    expect(anySelected).toBe(false);
  });
});

// ── redo() ────────────────────────────────────────────────────────────────────

describe('redo()', () => {
  test('redo() after undo() restores the undone state', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.undo();
    expect(signmaker.vm.list.length).toBe(0);
    signmaker.vm.redo();
    expect(signmaker.vm.list.length).toBe(1);
    expect(signmaker.vm.list[0].key()).toBe('S14c20');
  });

  test('redo() increments cursor', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.undo();
    const cursorBeforeRedo = signmaker.vm.cursor;
    signmaker.vm.redo();
    expect(signmaker.vm.cursor).toBe(cursorBeforeRedo + 1);
  });

  test('redo() cannot go beyond last history entry', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.redo(); // already at latest
    signmaker.vm.redo();
    expect(signmaker.vm.cursor).toBe(1); // still at 1
  });

  test('new operation after undo truncates redo history', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.undo();
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    // Redo should be unavailable (no future history)
    const cursorAtNew = signmaker.vm.cursor;
    signmaker.vm.redo();
    expect(signmaker.vm.cursor).toBe(cursorAtNew); // no change
  });
});

// ── History serialization ─────────────────────────────────────────────────────

describe('history serialization', () => {
  test('history entries are valid JSON strings', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    expect(() => JSON.parse(signmaker.vm.history[1])).not.toThrow();
  });

  test('history entry contains list, sort, terms, entry fields', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    const entry = JSON.parse(signmaker.vm.history[1]);
    expect(entry).toHaveProperty('list');
    expect(entry).toHaveProperty('sort');
    expect(entry).toHaveProperty('terms');
    expect(entry).toHaveProperty('entry');
  });

  test('history normalizes selected to false via string replace', () => {
    // The history serialization uses .replace(/true/g, 'false') to normalize
    // all selected properties to false. This is documented as a design quirk.
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.addhistory();
    const raw = signmaker.vm.history[signmaker.vm.cursor];
    // The raw string should not contain '"selected":true'
    expect(raw).not.toContain('"selected":true');
    expect(raw).toContain('"selected":false');
  });
});
