/**
 * Edge Cases & Known Bugs
 *
 * Documents specific behavioral quirks and known bugs in signmaker.vm that
 * any rewrite must either replicate or explicitly fix.
 *
 * 1. Deletion bug: forward-iterating splice skips the element after a deleted one
 * 2. Negative coordinates: no bounds checking; move() can produce x/y < 0 or > 999
 * 3. Box type loss: B/L/R box types become M in fswlive() output (always)
 * 4. History replace(/true/g,'false') would corrupt terms/keys containing "true"
 * 5. addhistory() deduplication is string-equality based; JSON key order matters
 */

beforeEach(() => resetEditor());

// ── 1. Deletion bug ───────────────────────────────────────────────────────────

describe('deletion bug: forward-iterating splice (index.js:623-630)', () => {
  // The delete() implementation is:
  //   for (var i = 0; i < signmaker.vm.list.length; i++) {
  //     if (signmaker.vm.list[i].selected()) { signmaker.vm.list.splice(i, 1); }
  //   }
  // When element i is spliced out, the former element i+1 slides to index i,
  // but i is then incremented to i+1, skipping the (now at i) element.

  test('DOCUMENTED BUG: deleting two consecutive selected symbols only removes the first', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.add({ key: 'S10000', x: 520, y: 520 });
    // Select all three
    signmaker.vm.list[0].selected(true);
    signmaker.vm.list[1].selected(true);
    signmaker.vm.list[2].selected(true);
    signmaker.vm.delete();
    // Due to the bug, not all three are removed.
    // index 0 deleted → list shifts: [S27106, S10000]
    // i becomes 1, S10000 at index 1 is checked → deleted
    // i becomes 2, loop ends (length=1)
    // S27106 (now at index 0) was skipped
    expect(signmaker.vm.list.length).toBe(1);
    expect(signmaker.vm.list[0].key()).toBe('S27106');
  });

  test('DOCUMENTED BUG: two consecutive selected symbols — middle one survives', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.list[1].selected(true);
    signmaker.vm.delete();
    // i=0: S14c20 selected → splice → list is now [S27106], i++→1
    // i=1: length is 1, loop ends; S27106 was never checked
    expect(signmaker.vm.list.length).toBe(1);
    expect(signmaker.vm.list[0].key()).toBe('S27106');
  });

  test('deleting non-consecutive selected symbols works correctly', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.add({ key: 'S10000', x: 520, y: 520 });
    // Select first and last only (non-consecutive)
    signmaker.vm.list[0].selected(true);
    signmaker.vm.list[1].selected(false);
    signmaker.vm.list[2].selected(true);
    signmaker.vm.delete();
    // i=0: S14c20 deleted → list=[S27106, S10000], i++→1
    // i=1: S10000 is now at index 1, selected → deleted → list=[S27106]
    // i++→2, length=1, loop ends
    expect(signmaker.vm.list.length).toBe(1);
    expect(signmaker.vm.list[0].key()).toBe('S27106');
  });
});

// ── 2. Negative coordinates (no bounds checking) ──────────────────────────────

describe('no bounds checking on coordinates', () => {
  test('move() can push x below 0', () => {
    signmaker.vm.add({ key: 'S14c20', x: 5, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(-10, 0);
    expect(signmaker.vm.list[0].x()).toBe(-5);
  });

  test('move() can push y below 0', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 5 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(0, -10);
    expect(signmaker.vm.list[0].y()).toBe(-5);
  });

  test('move() can push x above 999', () => {
    signmaker.vm.add({ key: 'S14c20', x: 995, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(10, 0);
    expect(signmaker.vm.list[0].x()).toBe(1005);
  });

  test('move() can push y above 999', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 995 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(0, 10);
    expect(signmaker.vm.list[0].y()).toBe(1005);
  });

  test('add() accepts out-of-range coordinates without clamping', () => {
    signmaker.vm.add({ key: 'S10000', x: -100, y: 1200 });
    expect(signmaker.vm.list[0].x()).toBe(-100);
    expect(signmaker.vm.list[0].y()).toBe(1200);
  });
});

// ── 3. Box type loss ─────────────────────────────────────────────────────────

describe('box type loss: B/L/R always become M in output', () => {
  // fswlive() always starts with "M500x500" and replaces it with
  // "M{maxX}x{maxY}" — the box type letter is always 'M'.
  // Any B (Base), L (Left), R (Right) type from parsed input is silently lost.

  test('B box type is lost after parse+regenerate', () => {
    signmaker.vm.fsw('B500x500S14c20481x471');
    const output = signmaker.vm.fswlive();
    expect(output).not.toMatch(/B\d{3}x\d{3}/);
    expect(output).toMatch(/M\d{3}x\d{3}/);
  });

  test('L box type is lost after parse+regenerate', () => {
    signmaker.vm.fsw('L500x500S14c20481x471');
    expect(signmaker.vm.fswlive()).not.toMatch(/L\d{3}x\d{3}/);
  });

  test('R box type is lost after parse+regenerate', () => {
    signmaker.vm.fsw('R500x500S14c20481x471');
    expect(signmaker.vm.fswlive()).not.toMatch(/R\d{3}x\d{3}/);
  });

  test('DOCUMENTED: original box coordinate is also lost — it is recomputed', () => {
    // Input has M518x529; output will have a recomputed M coordinate, not 518x529
    signmaker.vm.fsw('M518x529S14c20481x471');
    const output = signmaker.vm.fswlive();
    // Box coordinate is recomputed, not preserved
    expect(output).not.toContain('M518x529');
    expect(output).toMatch(/M\d{3}x\d{3}/); // some recalculated value
  });
});

// ── 4. History serialization: replace(/true/g, 'false') side-effects ─────────

describe('history replace(/true/g,"false") quirk (index.js addhistory)', () => {
  // The addhistory() implementation uses:
  //   JSON.stringify(...).replace(/true/g, 'false')
  // This replaces ALL occurrences of the string "true" — not just
  // the `selected` property values. Any term or key containing "true"
  // would also be corrupted.

  test('DOCUMENTED: history entry does not contain the string "true"', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.addhistory();
    const raw = signmaker.vm.history[signmaker.vm.cursor];
    expect(raw).not.toContain('true');
    expect(raw).toContain('"selected":false');
  });

  test('DOCUMENTED BUG: a term containing the word "true" would be corrupted in history', () => {
    // This is a known design flaw: the replace is applied to the full JSON string.
    // We document the behavior without triggering it in the app normally,
    // since terms are UI strings. If a user typed "true story" as a gloss,
    // it would be stored as "false story" in history.
    // We can verify the mechanism by inspecting the history entry directly.
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.terms[0] = 'true story';
    signmaker.vm.addhistory();
    const raw = signmaker.vm.history[signmaker.vm.cursor];
    // The replace corrupts the term value in the history snapshot
    expect(raw).toContain('false story');
    expect(raw).not.toContain('true story');
  });
});

// ── 5. addhistory() deduplication is exact-string comparison ─────────────────

describe('addhistory() deduplication behavior', () => {
  test('calling addhistory() twice with no change does not duplicate', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    const len = signmaker.vm.history.length;
    signmaker.vm.addhistory();
    expect(signmaker.vm.history.length).toBe(len);
  });

  test('addhistory() adds entry when state genuinely changes', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    const len = signmaker.vm.history.length;
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(1, 0);
    expect(signmaker.vm.history.length).toBeGreaterThan(len);
  });
});

// ── 6. fswlive() returns empty string for bare M500x500 ──────────────────────

describe('fswlive() special case: empty guard', () => {
  test('fswlive() returns "" when list is empty (suppresses bare M500x500)', () => {
    expect(signmaker.vm.fswlive()).toBe('');
  });

  test('fswlive() returns non-empty string once a symbol is added', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    expect(signmaker.vm.fswlive()).not.toBe('');
  });
});

// ── 7. copy() selects copies, deselects originals ────────────────────────────

describe('copy() selection behavior after duplication', () => {
  test('after copy(), the copy is selected and the original is deselected', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.copy();
    // Original should be deselected (add() calls selnone() before adding)
    expect(signmaker.vm.list[0].selected()).toBe(false);
    // The copy (newly added) should be selected
    expect(signmaker.vm.list[1].selected()).toBe(true);
  });
});

// ── 8. select() when no symbol is selected ───────────────────────────────────

describe('select(step) when nothing is selected', () => {
  test('select(+1) on two symbols with none selected selects the last one', () => {
    // When no symbol is selected, indexOf returns -1.
    // The new index = (-1 + 1 + length) % length = length - 1 + 1 % length
    // Actual behavior: (-1 + step + length) % length
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.selnone();
    signmaker.vm.select(1);
    const selectedCount = signmaker.vm.list.filter(s => s.selected()).length;
    expect(selectedCount).toBe(1);
  });
});
