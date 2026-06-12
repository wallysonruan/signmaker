import { symbolInfo, rotate, mirror, fill, variation } from '../src/symbol';

// ── symbolInfo() ──────────────────────────────────────────────────────────────

describe('symbolInfo()', () => {
  test('parses "S14c20" correctly', () => {
    const info = symbolInfo('S14c20');
    expect(info).not.toBeNull();
    expect(info!.plane).toBe(1);
    expect(info!.base).toBe('14c');
    expect(info!.fill).toBe(2);
    expect(info!.rotation).toBe(0);
    expect(info!.mirrored).toBe(false);
  });

  test('mirrored is true when rotation >= 8', () => {
    const info = symbolInfo('S14c28');
    expect(info!.mirrored).toBe(true);
    expect(info!.rotation).toBe(8);
  });

  test('returns null for invalid key', () => {
    expect(symbolInfo('')).toBeNull();
    expect(symbolInfo('S14c')).toBeNull();
    expect(symbolInfo('hello!')).toBeNull();
  });
});

// ── rotate() ─────────────────────────────────────────────────────────────────

describe('rotate()', () => {
  test('rotate(+1) increments rotation nibble', () => {
    expect(rotate('S14c20', 1)).toBe('S14c21');
    expect(rotate('S14c21', 1)).toBe('S14c22');
  });

  test('rotate(-1) decrements rotation nibble', () => {
    expect(rotate('S14c21', -1)).toBe('S14c20');
  });

  test('rotate wraps from 0xf to 0x0 when +1', () => {
    expect(rotate('S14c2f', 1)).toBe('S14c20');
  });

  test('rotate wraps from 0x0 to 0xf when -1', () => {
    expect(rotate('S14c20', -1)).toBe('S14c2f');
  });

  test('16 steps of rotate(+1) returns to original', () => {
    let key = 'S14c20';
    for (let i = 0; i < 16; i++) key = rotate(key, 1);
    expect(key).toBe('S14c20');
  });

  test('rotate preserves all other key parts', () => {
    const result = rotate('S27106', 1);
    expect(result.slice(0, 5)).toBe('S2710');
  });

  test('rotate works with hex rotation nibble', () => {
    expect(rotate('S14c2a', 1)).toBe('S14c2b');
    expect(rotate('S14c2e', 2)).toBe('S14c20');
  });
});

// ── mirror() ─────────────────────────────────────────────────────────────────

describe('mirror()', () => {
  test('mirror flips non-mirrored symbol to mirrored (adds 8)', () => {
    expect(mirror('S14c20')).toBe('S14c28');
    expect(mirror('S14c21')).toBe('S14c29');
  });

  test('mirror flips mirrored symbol to non-mirrored (subtracts 8)', () => {
    expect(mirror('S14c28')).toBe('S14c20');
    expect(mirror('S14c2f')).toBe('S14c27');
  });

  test('mirror is its own inverse: applying twice returns to original', () => {
    expect(mirror(mirror('S14c20'))).toBe('S14c20');
    expect(mirror(mirror('S14c2b'))).toBe('S14c2b');
  });

  test('mirror preserves all other key parts', () => {
    const result = mirror('S27106');
    expect(result.slice(0, 5)).toBe('S2710');
  });
});

// ── fill() ────────────────────────────────────────────────────────────────────

describe('fill()', () => {
  test('fill(+1) increments fill digit', () => {
    expect(fill('S14c20', 1)).toBe('S14c30');
    expect(fill('S14c30', 1)).toBe('S14c40');
  });

  test('fill(-1) decrements fill digit', () => {
    expect(fill('S14c30', -1)).toBe('S14c20');
  });

  test('fill wraps from 5 to 0 when +1', () => {
    expect(fill('S14c50', 1)).toBe('S14c00');
  });

  test('fill wraps from 0 to 5 when -1', () => {
    expect(fill('S14c00', -1)).toBe('S14c50');
  });

  test('6 steps of fill(+1) returns to original', () => {
    let key = 'S14c20';
    for (let i = 0; i < 6; i++) key = fill(key, 1);
    expect(key).toBe('S14c20');
  });

  test('fill preserves plane, base, rotation', () => {
    const result = fill('S27106', 1);
    expect(result.slice(0, 4)).toBe('S271');
    expect(result[5]).toBe('6');
  });
});

// ── variation() ───────────────────────────────────────────────────────────────

describe('variation()', () => {
  test('variation(+1) changes the symbol key', () => {
    const original = 'S14c20';
    expect(variation(original, 1)).not.toBe(original);
  });

  test('variation(-1) changes the symbol key', () => {
    const original = 'S14c20';
    expect(variation(original, -1)).not.toBe(original);
  });

  test('variation(+1) then variation(-1) returns to original', () => {
    const original = 'S14c20';
    const stepped = variation(original, 1);
    expect(variation(stepped, -1)).toBe(original);
  });

  test('variation preserves fill and rotation', () => {
    const original = 'S14c23';  // fill=2, rotation=3
    const stepped = variation(original, 1);
    expect(stepped[4]).toBe('2');  // fill preserved
    expect(stepped[5]).toBe('3');  // rotation preserved
  });

  test('variation wraps at upper boundary (0x37f + 1 → 0x100)', () => {
    const atMax = 'S37f20';  // base = 37f (max)
    const wrapped = variation(atMax, 1);
    expect(wrapped.slice(1, 4)).toBe('100');  // wraps to min
  });

  test('variation wraps at lower boundary (0x100 - 1 → 0x37f)', () => {
    const atMin = 'S10020';  // base = 100 (min)
    const wrapped = variation(atMin, -1);
    expect(wrapped.slice(1, 4)).toBe('37f');  // wraps to max
  });
});
