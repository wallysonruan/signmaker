import { generateFsw, generateFswM } from '../src/generate';
import type { Sign } from '../src/types';

const EMPTY_SIGN: Sign = {
  sort: [], box: 'M', box_x: 500, box_y: 500, symbols: [],
};

// ── generateFsw() ─────────────────────────────────────────────────────────────

describe('generateFsw()', () => {
  test('generates minimal sign (no sort, no symbols)', () => {
    expect(generateFsw(EMPTY_SIGN)).toBe('M500x500');
  });

  test('generates sign with one symbol', () => {
    const sign: Sign = {
      sort: [], box: 'M', box_x: 518, box_y: 529,
      symbols: [{ key: 'S14c20', x: 481, y: 471 }],
    };
    expect(generateFsw(sign)).toBe('M518x529S14c20481x471');
  });

  test('generates sign with multiple symbols in order', () => {
    const sign: Sign = {
      sort: [], box: 'M', box_x: 518, box_y: 529,
      symbols: [
        { key: 'S14c20', x: 481, y: 471 },
        { key: 'S27106', x: 503, y: 489 },
      ],
    };
    const fsw = generateFsw(sign);
    expect(fsw.indexOf('S14c20')).toBeLessThan(fsw.indexOf('S27106'));
  });

  test('generates sort prefix when sort is non-empty', () => {
    const sign: Sign = {
      sort: ['S14c20', 'S27106'], box: 'M', box_x: 518, box_y: 529,
      symbols: [],
    };
    expect(generateFsw(sign)).toMatch(/^AS14c20S27106/);
  });

  test('coordinates are zero-padded to 3 digits', () => {
    const sign: Sign = {
      sort: [], box: 'M', box_x: 50, box_y: 50,
      symbols: [{ key: 'S10000', x: 50, y: 50 }],
    };
    expect(generateFsw(sign)).toBe('M050x050S10000050x050');
  });

  test('preserves B box type', () => {
    const sign: Sign = { ...EMPTY_SIGN, box: 'B' };
    expect(generateFsw(sign)).toMatch(/^B/);
  });

  test('preserves L box type', () => {
    const sign: Sign = { ...EMPTY_SIGN, box: 'L' };
    expect(generateFsw(sign)).toMatch(/^L/);
  });

  test('preserves R box type', () => {
    const sign: Sign = { ...EMPTY_SIGN, box: 'R' };
    expect(generateFsw(sign)).toMatch(/^R/);
  });

  test('box x and y are zero-padded to 3 digits', () => {
    const sign: Sign = { ...EMPTY_SIGN, box_x: 5, box_y: 99 };
    expect(generateFsw(sign)).toContain('M005x099');
  });

  test('full round-trip: same as input when re-generated from parsed sign', () => {
    const input = 'AS14c20S27106M518x529S14c20481x471S27106503x489';
    // Parse manually to reconstruct sign
    const sort = ['S14c20', 'S27106'];
    const symbols = [
      { key: 'S14c20', x: 481, y: 471 },
      { key: 'S27106', x: 503, y: 489 },
    ];
    const sign: Sign = { sort, box: 'M', box_x: 518, box_y: 529, symbols };
    expect(generateFsw(sign)).toBe(input);
  });
});

// ── generateFswM() ────────────────────────────────────────────────────────────

describe('generateFswM()', () => {
  test('always produces M box type regardless of input', () => {
    const partial = { sort: [], box_x: 0, box_y: 0, symbols: [] };
    expect(generateFswM(partial, 518, 529)).toMatch(/^M518x529/);
  });

  test('uses provided box_x and box_y', () => {
    const partial = { sort: [], box_x: 0, box_y: 0, symbols: [] };
    expect(generateFswM(partial, 600, 700)).toContain('M600x700');
  });
});
