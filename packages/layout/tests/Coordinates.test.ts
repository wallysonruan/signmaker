import {
  fswToScreen, screenToFsw, applyDragDelta,
  computeViewport, autoCenter,
} from '../src/Coordinates';
import type { BoundingBox, Viewport } from '../src/types';

const VP_125: Viewport = { midWidth: 125, midHeight: 125 };
const VP_200: Viewport = { midWidth: 200, midHeight: 150 };

// ── fswToScreen() — mirrors coordinate-transform.test.js pure functions ───────

describe('fswToScreen()', () => {
  test('FSW center (500,500) maps to (midWidth, midHeight)', () => {
    const pos = fswToScreen(500, 500, VP_125);
    expect(pos.left).toBe(125);
    expect(pos.top).toBe(125);
  });

  test('symbol at FSW (481,471) maps correctly', () => {
    const pos = fswToScreen(481, 471, VP_125);
    expect(pos.left).toBe(481 - 500 + 125);  // 106
    expect(pos.top).toBe(471 - 500 + 125);   // 96
  });

  test('symbol at FSW (503,489) with different viewport', () => {
    const pos = fswToScreen(503, 489, VP_200);
    expect(pos.left).toBe(503 - 500 + 200);  // 203
    expect(pos.top).toBe(489 - 500 + 150);   // 139
  });

  test('symbol left of center produces negative offset from zero midWidth', () => {
    const pos = fswToScreen(400, 500, { midWidth: 0, midHeight: 0 });
    expect(pos.left).toBe(-100);
  });

  test('mapping is linear', () => {
    const vp = { midWidth: 100, midHeight: 100 };
    const r1 = fswToScreen(550, 500, vp);
    const r2 = fswToScreen(600, 500, vp);
    expect(r2.left - r1.left).toBe(50);
  });
});

// ── screenToFsw() ─────────────────────────────────────────────────────────────

describe('screenToFsw()', () => {
  test('element at signbox origin gives FSW (500-midWidth+1, 500-midHeight)', () => {
    const result = screenToFsw(0, 0, 0, 0, VP_125);
    expect(result.x).toBe(500 - 125 + 1);  // 376
    expect(result.y).toBe(500 - 125);       // 375
  });

  test('moving 100px right shifts FSW x by +100', () => {
    const base  = screenToFsw(0,   0, 0, 0, VP_125);
    const moved = screenToFsw(100, 0, 0, 0, VP_125);
    expect(moved.x - base.x).toBe(100);
  });

  test('moving 100px down shifts FSW y by +100', () => {
    const base  = screenToFsw(0,  0,  0, 0, VP_125);
    const moved = screenToFsw(0, 100, 0, 0, VP_125);
    expect(moved.y - base.y).toBe(100);
  });

  test('element at screen center near FSW (500,500)', () => {
    // element at (125,125), signbox at (0,0)
    const result = screenToFsw(125, 125, 0, 0, VP_125);
    expect(result.x).toBe(500 - 125 + 1 + 125);  // 501 (the documented +1 offset)
    expect(result.y).toBe(500 - 125 + 125);        // 500
  });

  test('signbox offset is subtracted from element position', () => {
    const r1 = screenToFsw(200, 100, 0,  0, VP_125);
    const r2 = screenToFsw(200, 100, 50, 30, VP_125);
    expect(r1.x - r2.x).toBe(50);
    expect(r1.y - r2.y).toBe(30);
  });
});

// ── Round-trip: FSW → screen → FSW has documented +1 x-offset ────────────────

describe('fswToScreen → screenToFsw round-trip', () => {
  test('+1 x-offset documented behavior', () => {
    const vp = { midWidth: 200, midHeight: 200 };
    const fsw = { x: 520, y: 490 };
    const screen = fswToScreen(fsw.x, fsw.y, vp);
    const recovered = screenToFsw(screen.left, screen.top, 0, 0, vp);
    expect(recovered.x).toBe(fsw.x + 1);  // documented +1 quirk
    expect(recovered.y).toBe(fsw.y);
  });
});

// ── applyDragDelta() ──────────────────────────────────────────────────────────

describe('applyDragDelta()', () => {
  test('adds delta directly to FSW coordinate (1:1 mapping)', () => {
    const result = applyDragDelta(481, 471, 10, 5);
    expect(result.x).toBe(491);
    expect(result.y).toBe(476);
  });

  test('negative delta moves symbol left/up', () => {
    const result = applyDragDelta(500, 500, -20, -30);
    expect(result.x).toBe(480);
    expect(result.y).toBe(470);
  });

  test('no bounds checking: coordinates can go negative', () => {
    const result = applyDragDelta(50, 50, -100, -100);
    expect(result.x).toBe(-50);
    expect(result.y).toBe(-50);
  });

  test('no bounds checking: coordinates can exceed 999', () => {
    const result = applyDragDelta(995, 995, 10, 10);
    expect(result.x).toBe(1005);
    expect(result.y).toBe(1005);
  });
});

// ── computeViewport() ─────────────────────────────────────────────────────────

describe('computeViewport()', () => {
  test('midWidth = trunc(clientWidth / 2)', () => {
    expect(computeViewport(800, 600).midWidth).toBe(400);
    expect(computeViewport(801, 600).midWidth).toBe(400);  // truncated
  });

  test('midHeight = trunc(clientHeight / 2)', () => {
    expect(computeViewport(800, 600).midHeight).toBe(300);
    expect(computeViewport(800, 601).midHeight).toBe(300);  // truncated
  });
});

// ── autoCenter() ──────────────────────────────────────────────────────────────

describe('autoCenter()', () => {
  function bbox(minX: number, maxX: number, minY: number, maxY: number): BoundingBox {
    return {
      minX, maxX, minY, maxY,
      width: maxX - minX, height: maxY - minY,
      centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2,
    };
  }

  test('sign within viewport: no adjustment', () => {
    const vp: Viewport = { midWidth: 125, midHeight: 125 };
    // Sign bboxes well within the 385–615 band (510-125 to 490+125)
    const b = bbox(490, 510, 490, 510);
    expect(autoCenter(b, vp)).toEqual(vp);
  });

  test('sign too far right: midWidth decreases to bring sign left', () => {
    const vp: Viewport = { midWidth: 125, midHeight: 125 };
    // Sign centered far right at x=700
    const b = bbox(690, 710, 490, 510);
    const adjusted = autoCenter(b, vp);
    expect(adjusted.midWidth).toBeLessThan(vp.midWidth);
  });

  test('sign too far left: midWidth increases to bring sign right', () => {
    const vp: Viewport = { midWidth: 125, midHeight: 125 };
    // Sign centered far left at x=300
    const b = bbox(290, 310, 490, 510);
    const adjusted = autoCenter(b, vp);
    expect(adjusted.midWidth).toBeGreaterThan(vp.midWidth);
  });

  test('midHeight adjusts when sign overflows vertically', () => {
    const vp: Viewport = { midWidth: 125, midHeight: 125 };
    const b = bbox(490, 510, 690, 710);  // sign far below
    const adjusted = autoCenter(b, vp);
    expect(adjusted.midHeight).toBeLessThan(vp.midHeight);
  });

  test('adjusted midWidth centers sign on viewport', () => {
    const vp: Viewport = { midWidth: 125, midHeight: 125 };
    // Sign at x center 700
    const b = bbox(690, 710, 490, 510);
    const adjusted = autoCenter(b, vp);
    // After adjustment: midWidth = 125 + 500 - 700 = -75
    expect(adjusted.midWidth).toBe(125 + 500 - Math.trunc((690 + 710) / 2));
  });
});
