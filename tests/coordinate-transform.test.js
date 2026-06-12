/**
 * Coordinate Transform Tests
 *
 * Documents the two-way mapping between FSW coordinate space (1000×1000,
 * center at 500,500) and screen pixel space.
 *
 * From signmaker.view() (index.js:811-812):
 *   screen_left = fsw_x - 500 + midWidth
 *   screen_top  = fsw_y - 500 + midHeight
 *
 * From palDragEnd() (index.js:1381):
 *   fsw_x = 500 - midWidth  + 1 + element_offset_left - signbox_offset_left
 *   fsw_y = 500 - midHeight     + element_offset_top  - signbox_offset_top
 *
 * From sbDragEnd() (index.js:721-722):
 *   new_fsw_x = old_fsw_x + drag_delta_x   (1:1 pixel-to-coordinate mapping)
 *   new_fsw_y = old_fsw_y + drag_delta_y
 *
 * NOTE: midWidth and midHeight are recalculated from DOM clientWidth/clientHeight
 * on every render. They are (clientWidth * 0.90 / 2) and (clientHeight * 0.5 / 2).
 */

// Pure coordinate transform functions extracted directly from index.js formulas.
// These are tested as pure math, independent of the DOM.

function fswToScreen(fswX, fswY, midWidth, midHeight) {
  return {
    left: fswX - 500 + midWidth,
    top:  fswY - 500 + midHeight,
  };
}

function screenToFsw(elementLeft, elementTop, signboxLeft, signboxTop, midWidth, midHeight) {
  return {
    x: 500 - midWidth  + 1 + elementLeft - signboxLeft,
    y: 500 - midHeight     + elementTop  - signboxTop,
  };
}

function applyDragDelta(fswX, fswY, dragDeltaX, dragDeltaY) {
  return {
    x: fswX + dragDeltaX,
    y: fswY + dragDeltaY,
  };
}

// ── FSW → Screen ──────────────────────────────────────────────────────────────

describe('FSW → screen coordinate conversion', () => {
  test('center (500,500) maps to screen center (midWidth, midHeight)', () => {
    const result = fswToScreen(500, 500, 125, 125);
    expect(result.left).toBe(125);
    expect(result.top).toBe(125);
  });

  test('symbol at FSW (481,471) with midWidth=125 maps to screen (-19+125, -29+125)', () => {
    const result = fswToScreen(481, 471, 125, 125);
    expect(result.left).toBe(481 - 500 + 125); // 106
    expect(result.top).toBe(471 - 500 + 125);  // 96
  });

  test('symbol at FSW (503,489) maps correctly', () => {
    const result = fswToScreen(503, 489, 200, 150);
    expect(result.left).toBe(503 - 500 + 200); // 203
    expect(result.top).toBe(489 - 500 + 150);  // 139
  });

  test('symbol left of center (x < 500) produces negative screen offset from mid', () => {
    const result = fswToScreen(400, 500, 0, 0);
    expect(result.left).toBe(-100); // to the left of midWidth=0
  });

  test('symbol above center (y < 500) produces negative screen offset from mid', () => {
    const result = fswToScreen(500, 400, 0, 0);
    expect(result.top).toBe(-100);
  });

  test('mapping is linear: doubling distance from center doubles screen offset', () => {
    const mid = 100;
    const r1 = fswToScreen(550, 500, mid, mid);  // 50 above center
    const r2 = fswToScreen(600, 500, mid, mid);  // 100 above center
    expect(r1.left).toBe(mid + 50);
    expect(r2.left).toBe(mid + 100);
  });
});

// ── Screen → FSW ──────────────────────────────────────────────────────────────

describe('screen → FSW coordinate conversion (palette drag drop)', () => {
  test('dropping at signbox origin gives FSW (500-midWidth+1, 500-midHeight)', () => {
    // element and signbox at same position
    const result = screenToFsw(0, 0, 0, 0, 125, 125);
    expect(result.x).toBe(500 - 125 + 1);  // 376
    expect(result.y).toBe(500 - 125);       // 375
  });

  test('dropping 100px right of signbox origin shifts FSW x by +100', () => {
    const base = screenToFsw(0,   0, 0, 0, 125, 125);
    const moved = screenToFsw(100, 0, 0, 0, 125, 125);
    expect(moved.x - base.x).toBe(100);
  });

  test('dropping 100px below signbox origin shifts FSW y by +100', () => {
    const base  = screenToFsw(0,  0,  0, 0, 125, 125);
    const moved = screenToFsw(0, 100, 0, 0, 125, 125);
    expect(moved.y - base.y).toBe(100);
  });

  test('dropping at screen center produces FSW coord near (500,500)', () => {
    // midWidth = midHeight = 125; signbox and element both at screen center
    // element at (125,125), signbox at (0,0)
    const result = screenToFsw(125, 125, 0, 0, 125, 125);
    expect(result.x).toBe(500 - 125 + 1 + 125); // 501
    expect(result.y).toBe(500 - 125 + 125);      // 500
  });
});

// ── Round-trip: FSW → screen → FSW ───────────────────────────────────────────

describe('coordinate round-trip fidelity', () => {
  // Note: the screen→FSW formula has a +1 offset (from index.js:1381 `+1`),
  // so the round-trip is not perfectly lossless. This is documented behavior.
  test('round-trip has a +1 x-offset due to palette drag formula', () => {
    const mid = 200;
    const fsw = { x: 520, y: 490 };
    const screen = fswToScreen(fsw.x, fsw.y, mid, mid);
    // Simulate: element at (screen.left + signboxLeft), signbox at origin
    const recovered = screenToFsw(screen.left, screen.top, 0, 0, mid, mid);
    // The +1 in screenToFsw means x is off by +1
    expect(recovered.x).toBe(fsw.x + 1);
    expect(recovered.y).toBe(fsw.y);
  });
});

// ── Drag delta update (1:1 mapping) ──────────────────────────────────────────

describe('drag delta coordinate update', () => {
  test('drag delta is added directly to FSW coordinate (1:1 pixel mapping)', () => {
    const result = applyDragDelta(481, 471, 10, 5);
    expect(result.x).toBe(491);
    expect(result.y).toBe(476);
  });

  test('negative drag delta moves symbol left/up', () => {
    const result = applyDragDelta(500, 500, -20, -30);
    expect(result.x).toBe(480);
    expect(result.y).toBe(470);
  });

  test('large drag delta can push coordinates beyond 0-999 range (no clamping)', () => {
    // DOCUMENTED: There is no bounds checking on coordinates.
    // Dragging a symbol far left can produce x < 0.
    const result = applyDragDelta(50, 50, -100, -100);
    expect(result.x).toBe(-50);   // negative coordinate — valid in model, invalid in FSW
    expect(result.y).toBe(-50);
  });
});

// ── Auto-centering viewport algorithm ────────────────────────────────────────

describe('auto-centering viewport (midWidth/midHeight adjustment)', () => {
  // The algorithm in signmaker.view() (index.js:763-771):
  //   if (bbox[0] < 510 - midWidth || bbox[1] > 490 + midWidth)
  //     midWidth = midWidth + 500 - (bbox[0] + bbox[1]) / 2

  test('midWidth shifts when sign center differs from viewport center', () => {
    const midWidth = 125;
    // Simulate sign centered at x=700 (far right)
    const bboxMinX = 690;
    const bboxMaxX = 710;
    const newMidWidth = midWidth + 500 - Math.floor((bboxMinX + bboxMaxX) / 2);
    // midWidth should decrease to bring sign into view
    expect(newMidWidth).toBeLessThan(midWidth);
  });

  test('midWidth does not change when sign is within viewport', () => {
    const midWidth = 125;
    const bboxMinX = 490;
    const bboxMaxX = 510;
    const withinLeft  = bboxMinX >= (510 - midWidth);  // 490 >= 385
    const withinRight = bboxMaxX <= (490 + midWidth);   // 510 <= 615
    // No adjustment needed
    expect(withinLeft && withinRight).toBe(true);
  });
});

// ── Signmaker.vm integration: move() applies coordinate deltas ────────────────

describe('signmaker.vm.move() applies delta to FSW coordinates', () => {
  beforeEach(() => resetEditor());

  test('move(1,0) increments x by 1', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(1, 0);
    expect(signmaker.vm.list[0].x()).toBe(501);
    expect(signmaker.vm.list[0].y()).toBe(500);
  });

  test('move(0,-10) decrements y by 10 (shift+up arrow)', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(0, -10);
    expect(signmaker.vm.list[0].y()).toBe(490);
  });

  test('move() only affects selected symbols', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    signmaker.vm.add({ key: 'S27106', x: 510, y: 510 });
    signmaker.vm.list[0].selected(false);
    signmaker.vm.list[1].selected(true);
    signmaker.vm.move(10, 10);
    expect(signmaker.vm.list[0].x()).toBe(500); // unchanged
    expect(signmaker.vm.list[1].x()).toBe(520); // moved
  });

  test('move() can push coordinates negative (no bounds check)', () => {
    // DOCUMENTED: no clamping exists
    signmaker.vm.add({ key: 'S10000', x: 5, y: 5 });
    signmaker.vm.list[0].selected(true);
    signmaker.vm.move(-10, -10);
    expect(signmaker.vm.list[0].x()).toBe(-5);
    expect(signmaker.vm.list[0].y()).toBe(-5);
  });
});
