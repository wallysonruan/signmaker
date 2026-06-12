import { computeBoundingBox, computeBoxCoord } from '../src/BoundingBox';
import type { SizeProvider } from '../src/types';

/** Fixed 30×30 size mock — mirrors the Phase 1 test stub. */
const FIXED_30: SizeProvider = { getSize: () => ({ width: 30, height: 30 }) };

/** Always returns null — simulates missing font data. */
const NULL_PROVIDER: SizeProvider = { getSize: () => null };

// ── computeBoundingBox() ──────────────────────────────────────────────────────

describe('computeBoundingBox()', () => {
  test('returns null for empty symbol list', () => {
    expect(computeBoundingBox([], FIXED_30)).toBeNull();
  });

  test('returns null when size provider returns null for all keys', () => {
    expect(computeBoundingBox([{ key: 'S14c20', x: 500, y: 500 }], NULL_PROVIDER)).toBeNull();
  });

  test('single symbol: extents = (x, x+w) × (y, y+h)', () => {
    const bbox = computeBoundingBox([{ key: 'S14c20', x: 481, y: 471 }], FIXED_30);
    expect(bbox).not.toBeNull();
    expect(bbox!.minX).toBe(481);
    expect(bbox!.maxX).toBe(511);  // 481 + 30
    expect(bbox!.minY).toBe(471);
    expect(bbox!.maxY).toBe(501);  // 471 + 30
  });

  test('single symbol: width and height are correct', () => {
    const bbox = computeBoundingBox([{ key: 'S14c20', x: 481, y: 471 }], FIXED_30);
    expect(bbox!.width).toBe(30);
    expect(bbox!.height).toBe(30);
  });

  test('single symbol: center is midpoint of extents', () => {
    const bbox = computeBoundingBox([{ key: 'S14c20', x: 481, y: 471 }], FIXED_30);
    expect(bbox!.centerX).toBe((481 + 511) / 2);  // 496
    expect(bbox!.centerY).toBe((471 + 501) / 2);  // 486
  });

  test('two symbols: spans both extents', () => {
    const symbols = [
      { key: 'S14c20', x: 400, y: 400 },
      { key: 'S27106', x: 600, y: 600 },
    ];
    const bbox = computeBoundingBox(symbols, FIXED_30);
    expect(bbox!.minX).toBe(400);
    expect(bbox!.maxX).toBe(630);  // 600 + 30
    expect(bbox!.minY).toBe(400);
    expect(bbox!.maxY).toBe(630);
  });

  test('two symbols: center is midpoint of full extents', () => {
    const symbols = [
      { key: 'S14c20', x: 400, y: 400 },
      { key: 'S27106', x: 600, y: 600 },
    ];
    const bbox = computeBoundingBox(symbols, FIXED_30);
    expect(bbox!.centerX).toBe((400 + 630) / 2);  // 515
    expect(bbox!.centerY).toBe((400 + 630) / 2);
  });

  test('center symbol at (485, 485) with 30×30 has center at (500, 500)', () => {
    const bbox = computeBoundingBox([{ key: 'S14c20', x: 485, y: 485 }], FIXED_30);
    expect(bbox!.centerX).toBe(500);
    expect(bbox!.centerY).toBe(500);
  });

  test('provider returns different sizes per key', () => {
    const provider: SizeProvider = {
      getSize: (key) => key === 'S14c20' ? { width: 20, height: 20 } : { width: 40, height: 40 },
    };
    const symbols = [
      { key: 'S14c20', x: 480, y: 480 },  // right=500
      { key: 'S27106', x: 490, y: 490 },  // right=530
    ];
    const bbox = computeBoundingBox(symbols, provider);
    expect(bbox!.maxX).toBe(530);
    expect(bbox!.maxY).toBe(530);
  });
});

// ── computeBoxCoord() ─────────────────────────────────────────────────────────

describe('computeBoxCoord()', () => {
  test('returns null for empty symbol list', () => {
    expect(computeBoxCoord([], FIXED_30)).toBeNull();
  });

  test('returns maxX and maxY of bounding box', () => {
    const result = computeBoxCoord([{ key: 'S14c20', x: 481, y: 471 }], FIXED_30);
    expect(result).not.toBeNull();
    expect(result!.box_x).toBe(511);  // 481 + 30
    expect(result!.box_y).toBe(501);  // 471 + 30
  });

  test('matches fswlive() bbox recalculation logic from Phase 1', () => {
    // Phase 1 test: M coordinate >= rightmost symbol position
    const symbols = [
      { key: 'S14c20', x: 400, y: 400 },
      { key: 'S27106', x: 600, y: 600 },
    ];
    const result = computeBoxCoord(symbols, FIXED_30);
    expect(result!.box_x).toBeGreaterThanOrEqual(600);
    expect(result!.box_y).toBeGreaterThanOrEqual(600);
  });
});
