import { parseFsw, extractSign } from '../src/parse';
import type { Sign } from '../src/types';

// ── parseFsw() ────────────────────────────────────────────────────────────────

describe('parseFsw()', () => {
  test('returns null for empty string', () => {
    expect(parseFsw('')).toBeNull();
  });

  test('returns null for invalid input', () => {
    expect(parseFsw('hello')).toBeNull();
    expect(parseFsw('S14c20')).toBeNull();  // symbol only, no box
  });

  test('parses minimal sign (no sort, no symbols)', () => {
    const sign = parseFsw('M500x500');
    expect(sign).not.toBeNull();
    expect(sign!.box).toBe('M');
    expect(sign!.box_x).toBe(500);
    expect(sign!.box_y).toBe(500);
    expect(sign!.sort).toEqual([]);
    expect(sign!.symbols).toEqual([]);
  });

  test('parses sign with single symbol', () => {
    const sign = parseFsw('M518x529S14c20481x471');
    expect(sign).not.toBeNull();
    expect(sign!.symbols).toHaveLength(1);
    expect(sign!.symbols[0]).toEqual({ key: 'S14c20', x: 481, y: 471 });
  });

  test('parses coordinates as integers', () => {
    const sign = parseFsw('M518x529S14c20481x471');
    expect(typeof sign!.symbols[0].x).toBe('number');
    expect(typeof sign!.symbols[0].y).toBe('number');
  });

  test('parses sign with multiple symbols in order', () => {
    const sign = parseFsw('M518x529S14c20481x471S27106503x489');
    expect(sign!.symbols).toHaveLength(2);
    expect(sign!.symbols[0].key).toBe('S14c20');
    expect(sign!.symbols[1].key).toBe('S27106');
  });

  test('parses A-prefix sort sequence', () => {
    const sign = parseFsw('AS14c20S27106M518x529S14c20481x471S27106503x489');
    expect(sign!.sort).toEqual(['S14c20', 'S27106']);
  });

  test('sort array is empty when no A-prefix', () => {
    const sign = parseFsw('M500x500S14c20481x471');
    expect(sign!.sort).toEqual([]);
  });

  test('sort prefix may differ from spatial order', () => {
    const sign = parseFsw('AS27106S14c20M518x529S14c20481x471S27106503x489');
    expect(sign!.sort).toEqual(['S27106', 'S14c20']);
    expect(sign!.symbols[0].key).toBe('S14c20');
    expect(sign!.symbols[1].key).toBe('S27106');
  });

  test('parses B box type', () => {
    const sign = parseFsw('B500x500S14c20481x471');
    expect(sign!.box).toBe('B');
  });

  test('parses L box type', () => {
    const sign = parseFsw('L500x500S14c20481x471');
    expect(sign!.box).toBe('L');
  });

  test('parses R box type', () => {
    const sign = parseFsw('R500x500S14c20481x471');
    expect(sign!.box).toBe('R');
  });

  test('parses box coordinates', () => {
    const sign = parseFsw('M518x529S14c20481x471');
    expect(sign!.box_x).toBe(518);
    expect(sign!.box_y).toBe(529);
  });

  test('parses zero-padded coordinates correctly (050 → 50)', () => {
    const sign = parseFsw('M050x050S10000050x050');
    expect(sign!.box_x).toBe(50);
    expect(sign!.symbols[0].x).toBe(50);
    expect(sign!.symbols[0].y).toBe(50);
  });
});

// ── extractSign() ─────────────────────────────────────────────────────────────

describe('extractSign()', () => {
  test('returns the FSW sign from a plain FSW string', () => {
    const input = 'M518x529S14c20481x471S27106503x489';
    expect(extractSign(input)).toBe(input);
  });

  test('extracts FSW sign from surrounding text', () => {
    const input = 'some text M518x529S14c20481x471 more text';
    expect(extractSign(input)).toBe('M518x529S14c20481x471');
  });

  test('returns empty string for empty input', () => {
    expect(extractSign('')).toBe('');
  });

  test('returns empty string when no sign found', () => {
    expect(extractSign('hello world 123')).toBe('');
  });

  test('extracts sign with A-prefix', () => {
    const sign = 'AS14c20M518x529S14c20481x471';
    expect(extractSign(sign)).toBe(sign);
  });
});

// ── Round-trip structural fidelity ────────────────────────────────────────────

describe('parseFsw round-trip', () => {
  function signToFsw(s: Sign): string {
    let out = s.sort.length ? 'A' + s.sort.join('') : '';
    out += s.box + s.box_x.toString().padStart(3, '0') + 'x' + s.box_y.toString().padStart(3, '0');
    for (const sym of s.symbols) {
      out += sym.key + sym.x.toString().padStart(3, '0') + 'x' + sym.y.toString().padStart(3, '0');
    }
    return out;
  }

  test('parse then re-serialize preserves all data', () => {
    const input = 'AS14c20S27106M518x529S14c20481x471S27106503x489';
    const sign = parseFsw(input)!;
    expect(signToFsw(sign)).toBe(input);
  });
});
