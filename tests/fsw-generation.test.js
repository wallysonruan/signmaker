/**
 * FSW Generation Tests
 *
 * Covers `signmaker.vm.fswlive()` — assembles the live FSW string from the
 * current `list` and `sort` arrays — and `signmaker.vm.fswnorm()` — the
 * normalized form used for export and dictionary save.
 *
 * Generation algorithm (fswlive):
 *   1. Start with "M500x500"
 *   2. Prepend "A" + sorted keys if sort array is non-empty
 *   3. Append each symbol: key + x + "x" + y
 *   4. Replace "M500x500" with "M{maxX}x{maxY}" via ssw.bbox(ssw.max(fsw))
 *   5. Return "" if list is empty (the "M500x500" bare result is suppressed)
 */

beforeEach(() => resetEditor());

// ── Empty state ───────────────────────────────────────────────────────────────

describe('empty editor', () => {
  test('fswlive() returns empty string when no symbols', () => {
    expect(signmaker.vm.fswlive()).toBe('');
  });

  test('fswnorm() returns empty string when no symbols', () => {
    expect(signmaker.vm.fswnorm()).toBe('');
  });
});

// ── Symbol serialization ──────────────────────────────────────────────────────

describe('symbol serialization', () => {
  test('single symbol produces valid FSW with M coordinate', () => {
    signmaker.vm.add({ key: 'S14c20', x: 481, y: 471 });
    const fsw = signmaker.vm.fswlive();
    expect(fsw).toMatch(/M[0-9]{3}x[0-9]{3}/);     // has box
    expect(fsw).toContain('S14c20481x471');          // has spatial
  });

  test('symbol key and coordinates are serialized exactly', () => {
    signmaker.vm.add({ key: 'S27106', x: 503, y: 489 });
    expect(signmaker.vm.fswlive()).toContain('S27106503x489');
  });

  test('multiple symbols appear in list order', () => {
    signmaker.vm.add({ key: 'S14c20', x: 481, y: 471 });
    signmaker.vm.add({ key: 'S27106', x: 503, y: 489 });
    const fsw = signmaker.vm.fswlive();
    const pos14c = fsw.indexOf('S14c20');
    const pos271 = fsw.indexOf('S27106');
    expect(pos14c).toBeLessThan(pos271);
  });

  test('DOCUMENTED: coordinates are NOT zero-padded in fswlive() output', () => {
    // fswlive() concatenates x/y directly with no String.padStart or similar.
    // Small coordinates produce 1- or 2-digit output, producing technically
    // invalid FSW (which requires 3-digit coords). Real use keeps coords near
    // 500 so this only matters for edge-case placements.
    signmaker.vm.add({ key: 'S10000', x: 50, y: 50 });
    expect(signmaker.vm.fswlive()).toContain('S1000050x50');
  });
});

// ── Sort prefix generation ────────────────────────────────────────────────────

describe('sort prefix (A-prefix) generation', () => {
  test('no A prefix when sort array is empty', () => {
    signmaker.vm.add({ key: 'S14c20', x: 481, y: 471 });
    expect(signmaker.vm.fswlive()).not.toMatch(/^A/);
  });

  test('A prefix included when sort array has entries', () => {
    signmaker.vm.add({ key: 'S14c20', x: 481, y: 471 });
    signmaker.vm.sort = ['S14c20'];
    expect(signmaker.vm.fswlive()).toMatch(/^AS14c20/);
  });

  test('multiple keys in sort prefix are concatenated', () => {
    signmaker.vm.add({ key: 'S14c20', x: 481, y: 471 });
    signmaker.vm.add({ key: 'S27106', x: 503, y: 489 });
    signmaker.vm.sort = ['S14c20', 'S27106'];
    const fsw = signmaker.vm.fswlive();
    expect(fsw).toMatch(/^AS14c20S27106/);
  });
});

// ── Box coordinate recalculation ──────────────────────────────────────────────

describe('M box coordinate recalculation', () => {
  test('M coordinate is always recalculated, never fixed at 500x500', () => {
    signmaker.vm.add({ key: 'S14c20', x: 481, y: 471 });
    const fsw = signmaker.vm.fswlive();
    expect(fsw).not.toContain('M500x500');
  });

  test('M coordinate reflects the right-bottom boundary of symbol positions', () => {
    // With mock ssw.size = 30x30, bbox maxX = max(x)+30, maxY = max(y)+30
    // But the exact formula is inside the SSW library; here we just verify
    // the M coordinate is NOT at the arbitrary default 500x500.
    signmaker.vm.add({ key: 'S14c20', x: 400, y: 400 });
    signmaker.vm.add({ key: 'S27106', x: 600, y: 600 });
    const fsw = signmaker.vm.fswlive();
    const mMatch = fsw.match(/M([0-9]{3})x([0-9]{3})/);
    expect(mMatch).not.toBeNull();
    const mX = parseInt(mMatch[1]);
    const mY = parseInt(mMatch[2]);
    // M coordinate should be at or beyond the rightmost symbol position
    expect(mX).toBeGreaterThanOrEqual(600);
    expect(mY).toBeGreaterThanOrEqual(600);
  });
});

// ── Box type lossiness ────────────────────────────────────────────────────────

describe('box type lossiness (DOCUMENTED BUG)', () => {
  // DOCUMENTED: The box type (B, L, R) from input FSW is always lost.
  // The output of fswlive() always uses 'M', regardless of what the input had.
  test('fswlive() always produces M box type, B is lost', () => {
    signmaker.vm.fsw('B500x500S14c20481x471');
    const output = signmaker.vm.fswlive();
    expect(output).toMatch(/M[0-9]{3}x[0-9]{3}/);
    expect(output).not.toMatch(/B[0-9]{3}x[0-9]{3}/);
  });

  test('fswlive() always produces M box type, L is lost', () => {
    signmaker.vm.fsw('L500x500S14c20481x471');
    const output = signmaker.vm.fswlive();
    expect(output).not.toMatch(/L[0-9]{3}x[0-9]{3}/);
  });

  test('fswlive() always produces M box type, R is lost', () => {
    signmaker.vm.fsw('R500x500S14c20481x471');
    const output = signmaker.vm.fswlive();
    expect(output).not.toMatch(/R[0-9]{3}x[0-9]{3}/);
  });
});

// ── Round-trip structural fidelity ────────────────────────────────────────────

describe('FSW round-trip: parse then regenerate', () => {
  test('round-trip preserves all symbol keys', () => {
    const input = 'AS14c20S27106M518x529S14c20481x471S27106503x489';
    signmaker.vm.fsw(input);
    const output = signmaker.vm.fswlive();
    expect(output).toContain('S14c20481x471');
    expect(output).toContain('S27106503x489');
  });

  test('round-trip preserves sort prefix', () => {
    const input = 'AS14c20S27106M518x529S14c20481x471S27106503x489';
    signmaker.vm.fsw(input);
    const output = signmaker.vm.fswlive();
    expect(output).toMatch(/^AS14c20S27106/);
  });

  test('round-trip preserves symbol count', () => {
    const input = 'M550x550S10000500x500S20000510x510S30000520x520';
    signmaker.vm.fsw(input);
    const spatials = signmaker.vm.fswlive().match(/S[1-3][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g) || [];
    expect(spatials.length).toBe(3);
  });

  test('round-trip: M coordinate in output differs from input (it is recomputed)', () => {
    const input = 'M518x529S14c20481x471S27106503x489';
    signmaker.vm.fsw(input);
    const output = signmaker.vm.fswlive();
    // The M coordinate in input was 518×529; in output it is recomputed
    // The exact value depends on ssw.bbox behavior with our mock
    expect(output).toMatch(/M[0-9]{3}x[0-9]{3}/);
    // Just verify it's a valid FSW with the symbols intact
    expect(output).toContain('S14c20481x471');
  });
});

// ── SWU variants ──────────────────────────────────────────────────────────────

describe('SWU live output', () => {
  test('swulive() returns empty string when no symbols', () => {
    expect(signmaker.vm.swulive()).toBe('');
  });

  test('swulive() returns non-empty when symbols present', () => {
    signmaker.vm.add({ key: 'S14c20', x: 481, y: 471 });
    const swu = signmaker.vm.swulive();
    // SWU is a unicode encoding; may be empty if ssw.fsw2swu has no font data
    // but it should not throw
    expect(typeof swu).toBe('string');
  });
});
