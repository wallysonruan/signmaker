import { normalizeFsw, recomputeBoxCoord } from '../src/Layout';
import type { Sign } from '@signwriter/fsw';
import type { SizeProvider } from '../src/types';

const FIXED_30: SizeProvider = { getSize: () => ({ width: 30, height: 30 }) };
const NULL_PROVIDER: SizeProvider = { getSize: () => null };

function sign(symbols: Array<{key: string; x: number; y: number}>, sort: string[] = []): Sign {
  return { sort, box: 'M', box_x: 500, box_y: 500, symbols };
}

// ── normalizeFsw() ────────────────────────────────────────────────────────────

describe('normalizeFsw()', () => {
  test('returns original sign unchanged when symbol list is empty', () => {
    const s = sign([]);
    expect(normalizeFsw(s, FIXED_30)).toBe(s);  // same reference
  });

  test('returns original sign unchanged when size provider returns null', () => {
    const s = sign([{ key: 'S14c20', x: 481, y: 471 }]);
    expect(normalizeFsw(s, NULL_PROVIDER)).toBe(s);
  });

  test('single centered symbol: no coordinate change', () => {
    // Symbol at (485, 485) with 30×30 has center (500, 500) — no shift needed
    const s = sign([{ key: 'S14c20', x: 485, y: 485 }]);
    const normalized = normalizeFsw(s, FIXED_30);
    expect(normalized.symbols[0].x).toBe(485);
    expect(normalized.symbols[0].y).toBe(485);
  });

  test('after normalization, bounding box center is at (500, 500)', () => {
    // Symbol at (481, 471) has bbox center at ((481+511)/2, (471+501)/2) = (496, 486)
    // shift = (500-496, 500-486) = (4, 14)
    const s = sign([{ key: 'S14c20', x: 481, y: 471 }]);
    const normalized = normalizeFsw(s, FIXED_30);
    const sym = normalized.symbols[0];
    // new center = ((sym.x + sym.x+30) / 2 = sym.x + 15
    expect(sym.x + 15).toBe(500);
    expect(sym.y + 15).toBe(500);
  });

  test('normalization shifts symbol by (500 - center) in each axis', () => {
    const s = sign([{ key: 'S14c20', x: 481, y: 471 }]);
    const normalized = normalizeFsw(s, FIXED_30);
    // centerX before = (481 + 511) / 2 = 496; shift = 4
    expect(normalized.symbols[0].x).toBe(481 + 4);   // 485
    // centerY before = (471 + 501) / 2 = 486; shift = 14
    expect(normalized.symbols[0].y).toBe(471 + 14);  // 485
  });

  test('two symbols are both shifted by the same amount', () => {
    const s = sign([
      { key: 'S14c20', x: 400, y: 400 },
      { key: 'S27106', x: 600, y: 600 },
    ]);
    const normalized = normalizeFsw(s, FIXED_30);
    const dx = normalized.symbols[0].x - 400;
    const dy = normalized.symbols[0].y - 400;
    expect(normalized.symbols[1].x).toBe(600 + dx);
    expect(normalized.symbols[1].y).toBe(600 + dy);
  });

  test('box_x and box_y reflect normalized max extents', () => {
    const s = sign([{ key: 'S14c20', x: 481, y: 471 }]);
    const normalized = normalizeFsw(s, FIXED_30);
    // After shift: symbol at (485, 485), extent maxX = 485+30 = 515
    expect(normalized.box_x).toBe(515);
    expect(normalized.box_y).toBe(515);
  });

  test('box type is always M after normalization', () => {
    const s: Sign = { sort: [], box: 'B', box_x: 500, box_y: 500,
      symbols: [{ key: 'S14c20', x: 400, y: 400 }] };
    expect(normalizeFsw(s, FIXED_30).box).toBe('M');
  });

  test('sort prefix is preserved unchanged', () => {
    const s = sign([{ key: 'S14c20', x: 481, y: 471 }], ['S14c20']);
    const normalized = normalizeFsw(s, FIXED_30);
    expect(normalized.sort).toEqual(['S14c20']);
  });

  test('symbol count is preserved', () => {
    const s = sign([
      { key: 'S14c20', x: 400, y: 400 },
      { key: 'S27106', x: 600, y: 600 },
    ]);
    expect(normalizeFsw(s, FIXED_30).symbols).toHaveLength(2);
  });
});

// ── recomputeBoxCoord() ───────────────────────────────────────────────────────

describe('recomputeBoxCoord()', () => {
  test('returns sign unchanged when symbol list is empty', () => {
    const s = sign([]);
    expect(recomputeBoxCoord(s, FIXED_30)).toBe(s);
  });

  test('sets box_x/box_y to maxX/maxY of bounding box', () => {
    const s = sign([{ key: 'S14c20', x: 481, y: 471 }]);
    const updated = recomputeBoxCoord(s, FIXED_30);
    expect(updated.box_x).toBe(511);  // 481 + 30
    expect(updated.box_y).toBe(501);  // 471 + 30
  });

  test('box type is set to M', () => {
    const s: Sign = { sort: [], box: 'B', box_x: 0, box_y: 0,
      symbols: [{ key: 'S14c20', x: 481, y: 471 }] };
    expect(recomputeBoxCoord(s, FIXED_30).box).toBe('M');
  });

  test('symbol coordinates are not changed', () => {
    const s = sign([{ key: 'S14c20', x: 481, y: 471 }]);
    const updated = recomputeBoxCoord(s, FIXED_30);
    expect(updated.symbols[0]).toEqual({ key: 'S14c20', x: 481, y: 471 });
  });

  test('max coord reflects rightmost+widest and bottommost+tallest symbol', () => {
    const s = sign([
      { key: 'S14c20', x: 400, y: 400 },
      { key: 'S27106', x: 600, y: 600 },
    ]);
    const updated = recomputeBoxCoord(s, FIXED_30);
    expect(updated.box_x).toBe(630);  // max(400+30, 600+30) = 630
    expect(updated.box_y).toBe(630);
  });
});
