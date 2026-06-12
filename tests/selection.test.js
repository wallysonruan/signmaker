/**
 * Selection Tests
 *
 * Documents the selection model in signmaker.vm:
 *   - Only one symbol is "selected" at a time (single selection)
 *   - select(step) cycles through symbols by ±1 index
 *   - selnone() deselects all
 *   - Drag start auto-selects the dragged symbol
 *   - add() deselects all existing symbols and selects the new one
 */

beforeEach(() => resetEditor());

// ── selnone() ─────────────────────────────────────────────────────────────────

describe('selnone()', () => {
  test('selnone() deselects all symbols', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.list[1].selected(true);
    signmaker.vm.selnone();
    expect(signmaker.vm.list[0].selected()).toBe(false);
    expect(signmaker.vm.list[1].selected()).toBe(false);
  });

  test('selnone() is safe on empty list', () => {
    expect(() => signmaker.vm.selnone()).not.toThrow();
  });
});

// ── select(step) ──────────────────────────────────────────────────────────────

describe('select(step)', () => {
  test('select(+1) moves selection to next symbol', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.list[1].selected(false);
    signmaker.vm.select(1);
    expect(signmaker.vm.list[0].selected()).toBe(false);
    expect(signmaker.vm.list[1].selected()).toBe(true);
  });

  test('select(-1) moves selection to previous symbol', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.list[1].selected(true);
    signmaker.vm.select(-1);
    expect(signmaker.vm.list[0].selected()).toBe(true);
    expect(signmaker.vm.list[1].selected()).toBe(false);
  });

  test('select(+1) wraps around from last to first', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.list[1].selected(true);
    signmaker.vm.select(1); // wraps: last→first
    expect(signmaker.vm.list[0].selected()).toBe(true);
    expect(signmaker.vm.list[1].selected()).toBe(false);
  });

  test('select(-1) wraps around from first to last', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.list[1].selected(false);
    signmaker.vm.select(-1); // wraps: first→last
    expect(signmaker.vm.list[1].selected()).toBe(true);
  });

  test('select() is a no-op on empty list', () => {
    expect(() => signmaker.vm.select(1)).not.toThrow();
  });

  test('select() deselects all before selecting the new one (single selection)', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.list[1].selected(true);
    signmaker.vm.select(1);
    const selectedCount = signmaker.vm.list.filter(s => s.selected()).length;
    expect(selectedCount).toBe(1);
  });
});

// ── Single-selection invariant ────────────────────────────────────────────────

describe('single-selection invariant', () => {
  // DOCUMENTED: All operations (rotate/mirror/fill/variation/move/copy/delete)
  // iterate the full list and apply to every symbol where selected() === true.
  // The UI only selects one at a time via Tab/drag, but the model technically
  // supports multiple selected symbols simultaneously.

  test('add() deselects existing symbols before adding new one', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    // After add(), old symbols are deselected
    expect(signmaker.vm.list[0].selected()).toBe(false);
    expect(signmaker.vm.list[1].selected()).toBe(true);
  });

  test('operations apply to ALL selected symbols (multi-select is possible in model)', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    // Manually select both
    signmaker.vm.list[0].selected(true);
    signmaker.vm.list[1].selected(true);
    signmaker.vm.move(10, 0);
    // Both should move
    expect(signmaker.vm.list[0].x()).toBe(510);
    expect(signmaker.vm.list[1].x()).toBe(520);
  });
});

// ── addSeq() — sequence selection ────────────────────────────────────────────

describe('addSeq()', () => {
  test('addSeq() inserts key into sort array at given position', () => {
    signmaker.vm.addSeq('S14c20', 0);
    expect(signmaker.vm.sort[0]).toBe('S14c20');
  });

  test('addSeq() inserts at correct position', () => {
    signmaker.vm.addSeq('S14c20', 0);
    signmaker.vm.addSeq('S27106', 0); // insert before S14c20
    expect(signmaker.vm.sort[0]).toBe('S27106');
    expect(signmaker.vm.sort[1]).toBe('S14c20');
  });
});
