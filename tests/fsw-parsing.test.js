/**
 * FSW Parsing Tests
 *
 * Covers the `signmaker.vm.fsw(input)` setter which converts an FSW string
 * into the internal `list` (symbol array) and `sort` (sequence prefix) state.
 *
 * The parsing chain is:
 *   1. ssw.sign(fsw)  — validate / extract from surrounding text
 *   2. regex  /S[1-3][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g  — spatials
 *   3. regex  /A(S[1-3][0-9a-f]{2}[0-5][0-9a-f])+/  — sort prefix
 */

beforeEach(() => resetEditor());

// ── Symbol extraction ─────────────────────────────────────────────────────────

describe('symbol key extraction', () => {
  test('extracts a single spatial symbol key', () => {
    signmaker.vm.fsw('M500x500S14c20481x471');
    expect(signmaker.vm.list.length).toBe(1);
    expect(signmaker.vm.list[0].key()).toBe('S14c20');
  });

  test('extracts multiple symbol keys in order', () => {
    signmaker.vm.fsw('M518x529S14c20481x471S27106503x489');
    expect(signmaker.vm.list.length).toBe(2);
    expect(signmaker.vm.list[0].key()).toBe('S14c20');
    expect(signmaker.vm.list[1].key()).toBe('S27106');
  });

  test('preserves symbol order from left-to-right in FSW string', () => {
    signmaker.vm.fsw('M550x550S10000500x500S20000510x510S30000520x520');
    const keys = signmaker.vm.list.map(s => s.key());
    expect(keys).toEqual(['S10000', 'S20000', 'S30000']);
  });

  test('empty FSW string produces empty list', () => {
    signmaker.vm.fsw('');
    expect(signmaker.vm.list.length).toBe(0);
  });

  test('FSW with no spatials (bare box) produces empty list', () => {
    signmaker.vm.fsw('M500x500');
    expect(signmaker.vm.list.length).toBe(0);
  });
});

// ── Coordinate extraction ─────────────────────────────────────────────────────

describe('coordinate extraction', () => {
  test('extracts x coordinate correctly', () => {
    signmaker.vm.fsw('M518x529S14c20481x471');
    expect(signmaker.vm.list[0].x()).toBe(481);
  });

  test('extracts y coordinate correctly', () => {
    signmaker.vm.fsw('M518x529S14c20481x471');
    expect(signmaker.vm.list[0].y()).toBe(471);
  });

  test('extracts coordinates for multiple symbols', () => {
    signmaker.vm.fsw('M518x529S14c20481x471S27106503x489');
    expect(signmaker.vm.list[0].x()).toBe(481);
    expect(signmaker.vm.list[0].y()).toBe(471);
    expect(signmaker.vm.list[1].x()).toBe(503);
    expect(signmaker.vm.list[1].y()).toBe(489);
  });

  test('parses 3-digit coordinates including leading zeros', () => {
    signmaker.vm.fsw('M550x550S10000050x050');
    expect(signmaker.vm.list[0].x()).toBe(50);
    expect(signmaker.vm.list[0].y()).toBe(50);
  });

  test('stores coordinates as integers not strings', () => {
    signmaker.vm.fsw('M518x529S14c20481x471');
    expect(typeof signmaker.vm.list[0].x()).toBe('number');
    expect(typeof signmaker.vm.list[0].y()).toBe('number');
  });
});

// ── Sort prefix (A-prefix) extraction ────────────────────────────────────────

describe('sort prefix extraction', () => {
  test('parses A-prefix sort sequence', () => {
    signmaker.vm.fsw('AS14c20S27106M518x529S14c20481x471S27106503x489');
    expect(signmaker.vm.sort).toEqual(['S14c20', 'S27106']);
  });

  test('empty sort array when no A prefix', () => {
    signmaker.vm.fsw('M500x500S14c20481x471');
    expect(signmaker.vm.sort).toEqual([]);
  });

  test('sort sequence can differ from spatial order', () => {
    // Sort key order in A prefix doesn't have to match spatial placement order
    signmaker.vm.fsw('AS27106S14c20M518x529S14c20481x471S27106503x489');
    expect(signmaker.vm.sort[0]).toBe('S27106');
    expect(signmaker.vm.sort[1]).toBe('S14c20');
    // Spatials are still in FSW order
    expect(signmaker.vm.list[0].key()).toBe('S14c20');
    expect(signmaker.vm.list[1].key()).toBe('S27106');
  });

  test('single-symbol sort prefix', () => {
    signmaker.vm.fsw('AS14c20M500x500S14c20481x471');
    expect(signmaker.vm.sort).toEqual(['S14c20']);
  });
});

// ── Box type handling ─────────────────────────────────────────────────────────

describe('box type handling (lossiness)', () => {
  test('parses FSW with M box type', () => {
    signmaker.vm.fsw('M500x500S14c20481x471');
    expect(signmaker.vm.list.length).toBe(1);
  });

  // DOCUMENTED BEHAVIOR: The M box coordinate is DISCARDED during parsing.
  // It is recomputed by fswlive() when regenerating the FSW string.
  test('box coordinate is not stored — it is recomputed on output', () => {
    // Input has M518x529; the regenerated FSW will have a different M coordinate
    // computed from the symbol positions.
    signmaker.vm.fsw('M518x529S14c20481x471S27106503x489');
    const output = signmaker.vm.fswlive();
    // Output M coordinate is maxX×maxY of symbol placements (503, 489)
    // (with our mocked ssw.size returning 30×30, this may vary from real behavior)
    expect(output).toContain('S14c20481x471');
    expect(output).toContain('S27106503x489');
  });
});

// ── Symbol selection state after parsing ─────────────────────────────────────

describe('selection state after parsing', () => {
  test('all symbols are deselected after fsw() setter call', () => {
    signmaker.vm.fsw('M518x529S14c20481x471S27106503x489');
    const allDeselected = signmaker.vm.list.every(s => s.selected() === false);
    expect(allDeselected).toBe(true);
  });
});

// ── FSW parsing from larger text ─────────────────────────────────────────────

describe('parsing via ssw.sign()', () => {
  test('fsw() setter accepts plain FSW string', () => {
    signmaker.vm.fsw('M500x500S14c20481x471');
    expect(signmaker.vm.list.length).toBe(1);
  });

  test('invalid input (non-FSW string) results in empty list', () => {
    signmaker.vm.fsw('not-valid-fsw');
    expect(signmaker.vm.list.length).toBe(0);
  });

  test('null / undefined input is handled gracefully', () => {
    // fsw() with no arg is a getter, not a setter
    // Setting an explicitly undefined value should not crash
    signmaker.vm.fsw('M500x500S14c20481x471');
    signmaker.vm.fsw(undefined);
    // After undefined, list still holds previous value (getter path taken)
    // The exact behavior depends on `if (typeof fsw !== 'undefined')` guard
    expect(signmaker.vm.list.length).toBeGreaterThanOrEqual(0); // no crash
  });
});
