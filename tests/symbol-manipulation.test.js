/**
 * Symbol Manipulation Tests
 *
 * Covers all symbol key transformation operations:
 *   signmaker.vm.rotate(step)    — changes rotation nibble via ssw.rotate
 *   signmaker.vm.mirror()        — toggles mirror bit via ssw.mirror
 *   signmaker.vm.fill(step)      — cycles fill nibble via ssw.fill
 *   signmaker.vm.variation(step) — cycles base symbol via ssw.scroll
 *
 * Symbol key format: S [plane] [base-hex-2] [fill 0-5] [rotation 0-f]
 * e.g. "S14c20": plane=1, base=4c, fill=2, rotation=0
 */

beforeEach(() => resetEditor());

// ── Helper ────────────────────────────────────────────────────────────────────

function addSelected(key, x, y) {
  signmaker.vm.add({ key, x: x || 500, y: y || 500 });
  signmaker.vm.list[signmaker.vm.list.length - 1].selected(true);
}

// ── Rotate ────────────────────────────────────────────────────────────────────

describe('rotate()', () => {
  test('rotate(+1) changes symbol key', () => {
    addSelected('S14c20');
    const before = signmaker.vm.list[0].key();
    signmaker.vm.rotate(1);
    expect(signmaker.vm.list[0].key()).not.toBe(before);
  });

  test('rotate(-1) changes symbol key', () => {
    addSelected('S14c20');
    const before = signmaker.vm.list[0].key();
    signmaker.vm.rotate(-1);
    expect(signmaker.vm.list[0].key()).not.toBe(before);
  });

  test('rotate is idempotent in a cycle: rotating all 16 steps returns to original', () => {
    addSelected('S14c20');
    const original = signmaker.vm.list[0].key();
    // 16 rotation positions (nibble 0-f); after 16 steps we should be back
    for (let i = 0; i < 16; i++) {
      signmaker.vm.rotate(1);
    }
    expect(signmaker.vm.list[0].key()).toBe(original);
  });

  test('rotate only affects selected symbols', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.list[1].selected(true);
    const key0Before = signmaker.vm.list[0].key();
    signmaker.vm.rotate(1);
    expect(signmaker.vm.list[0].key()).toBe(key0Before); // unchanged
    expect(signmaker.vm.list[1].key()).not.toBe('S27106'); // changed
  });

  test('rotate preserves symbol position (x, y unchanged)', () => {
    addSelected('S14c20');
    signmaker.vm.rotate(1);
    expect(signmaker.vm.list[0].x()).toBe(500);
    expect(signmaker.vm.list[0].y()).toBe(500);
  });
});

// ── Mirror ────────────────────────────────────────────────────────────────────

describe('mirror()', () => {
  test('mirror() changes symbol key', () => {
    addSelected('S14c20');
    const before = signmaker.vm.list[0].key();
    signmaker.vm.mirror();
    expect(signmaker.vm.list[0].key()).not.toBe(before);
  });

  test('mirror() is its own inverse: applying twice returns to original', () => {
    addSelected('S14c20');
    const original = signmaker.vm.list[0].key();
    signmaker.vm.mirror();
    signmaker.vm.mirror();
    expect(signmaker.vm.list[0].key()).toBe(original);
  });

  test('mirror only affects selected symbols', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.list[1].selected(true);
    const key0 = signmaker.vm.list[0].key();
    signmaker.vm.mirror();
    expect(signmaker.vm.list[0].key()).toBe(key0);
  });
});

// ── Fill ──────────────────────────────────────────────────────────────────────

describe('fill()', () => {
  test('fill(+1) changes symbol key', () => {
    addSelected('S14c20');
    const before = signmaker.vm.list[0].key();
    signmaker.vm.fill(1);
    expect(signmaker.vm.list[0].key()).not.toBe(before);
  });

  test('fill(-1) changes symbol key', () => {
    addSelected('S14c20');
    const before = signmaker.vm.list[0].key();
    signmaker.vm.fill(-1);
    expect(signmaker.vm.list[0].key()).not.toBe(before);
  });

  test('fill cycles through 6 values (0-5): 6 steps returns to original', () => {
    addSelected('S14c20');
    const original = signmaker.vm.list[0].key();
    for (let i = 0; i < 6; i++) {
      signmaker.vm.fill(1);
    }
    expect(signmaker.vm.list[0].key()).toBe(original);
  });

  test('fill only affects selected symbols', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.list[1].selected(true);
    const key0 = signmaker.vm.list[0].key();
    signmaker.vm.fill(1);
    expect(signmaker.vm.list[0].key()).toBe(key0);
  });
});

// ── Variation (scroll) ────────────────────────────────────────────────────────

describe('variation()', () => {
  test('variation(+1) changes symbol key', () => {
    addSelected('S14c20');
    const before = signmaker.vm.list[0].key();
    signmaker.vm.variation(1);
    expect(signmaker.vm.list[0].key()).not.toBe(before);
  });

  test('variation(-1) changes symbol key', () => {
    addSelected('S14c20');
    const before = signmaker.vm.list[0].key();
    signmaker.vm.variation(-1);
    expect(signmaker.vm.list[0].key()).not.toBe(before);
  });

  test('variation only affects selected symbols', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.list[1].selected(true);
    const key0 = signmaker.vm.list[0].key();
    signmaker.vm.variation(1);
    expect(signmaker.vm.list[0].key()).toBe(key0);
  });
});

// ── Copy ──────────────────────────────────────────────────────────────────────

describe('copy()', () => {
  test('copy() duplicates selected symbol with +10,+10 offset', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.copy();
    expect(signmaker.vm.list.length).toBe(2);
    // Original should still be there
    expect(signmaker.vm.list[0].key()).toBe('S14c20');
    expect(signmaker.vm.list[0].x()).toBe(500);
    // Copy has +10, +10 offset
    expect(signmaker.vm.list[1].key()).toBe('S14c20');
    expect(signmaker.vm.list[1].x()).toBe(510);
    expect(signmaker.vm.list[1].y()).toBe(510);
  });

  test('copy() does not affect unselected symbols', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.list[1].selected(false);
    signmaker.vm.copy();
    expect(signmaker.vm.list.length).toBe(2);
  });
});

// ── Over (z-order / bring to front) ──────────────────────────────────────────

describe('over() — bring to front', () => {
  test('over() moves selected symbol to end of list (front z-order)', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.list[1].selected(false);
    signmaker.vm.over();
    // S14c20 should now be at the end
    expect(signmaker.vm.list[signmaker.vm.list.length - 1].key()).toBe('S14c20');
  });

  test('over() preserves symbol count', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.over();
    expect(signmaker.vm.list.length).toBe(2);
  });
});

// ── Clear ─────────────────────────────────────────────────────────────────────

describe('clear()', () => {
  test('clear() removes all symbols and sort entries', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.sort = ['S14c20', 'S27106'];
    signmaker.vm.clear();
    expect(signmaker.vm.list.length).toBe(0);
    expect(signmaker.vm.sort.length).toBe(0);
  });

  test('clear() results in empty fswlive()', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.clear();
    expect(signmaker.vm.fswlive()).toBe('');
  });
});

// ── Delete ────────────────────────────────────────────────────────────────────

describe('delete()', () => {
  test('delete() removes selected symbol', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.delete();
    expect(signmaker.vm.list.length).toBe(0);
  });

  test('delete() does not remove unselected symbols', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.delete();
    expect(signmaker.vm.list.length).toBe(1);
  });

  test('delete() removes only the selected symbol from a multi-symbol list', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.list[1].selected(true);
    signmaker.vm.delete();
    expect(signmaker.vm.list.length).toBe(1);
    expect(signmaker.vm.list[0].key()).toBe('S14c20');
  });
});

// ── Add ───────────────────────────────────────────────────────────────────────

describe('add()', () => {
  test('add() inserts a new symbol with given key and coordinates', () => {
    signmaker.vm.add({ key: 'S14c20', x: 481, y: 471 });
    expect(signmaker.vm.list.length).toBe(1);
    expect(signmaker.vm.list[0].key()).toBe('S14c20');
    expect(signmaker.vm.list[0].x()).toBe(481);
    expect(signmaker.vm.list[0].y()).toBe(471);
  });

  test('add() marks new symbol as selected', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    expect(signmaker.vm.list[0].selected()).toBe(true);
  });

  test('add() deselects all existing symbols before adding', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    expect(signmaker.vm.list[0].selected()).toBe(false);
    expect(signmaker.vm.list[1].selected()).toBe(true);
  });
});
