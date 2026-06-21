import { createGestureController } from '../src/createGestureController';

function makeEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.setPointerCapture = jest.fn();
  return el;
}

function ptr(
  type: string,
  opts: { pointerId?: number; button?: number; clientX?: number; clientY?: number } = {},
): PointerEvent {
  return Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
    pointerId: opts.pointerId ?? 1,
    button:    opts.button    ?? 0,
    clientX:   opts.clientX   ?? 0,
    clientY:   opts.clientY   ?? 0,
  }) as unknown as PointerEvent;
}

describe('createGestureController()', () => {
  test('attach returns a detach function', () => {
    const el = makeEl();
    const gc = createGestureController({ onZoom: jest.fn(), onPan: jest.fn() });
    const detach = gc.attach(el);
    expect(typeof detach).toBe('function');
    detach();
  });

  // ─── Wheel ────────────────────────────────────────────────────────────────────

  test('Ctrl+Wheel fires onZoom', () => {
    const onZoom = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom, onPan: jest.fn() }).attach(el);

    el.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true, cancelable: true, ctrlKey: true,
      deltaY: 100, deltaMode: 0,
    }));

    expect(onZoom).toHaveBeenCalledTimes(1);
    const [factor] = onZoom.mock.calls[0] as [number, number, number];
    expect(factor).toBeLessThan(1); // positive deltaY = zoom out
  });

  test('plain Wheel fires onPan', () => {
    const onPan = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan }).attach(el);

    el.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true, cancelable: true,
      deltaX: 10, deltaY: 20, deltaMode: 0,
    }));

    expect(onPan).toHaveBeenCalledWith(-10, -20);
  });

  test('Wheel prevents default', () => {
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn() }).attach(el);

    const ev = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 5, deltaMode: 0 });
    el.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  // ─── Background pan ───────────────────────────────────────────────────────────

  test('background drag fires onPan', () => {
    const onPan = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan }).attach(el);

    el.dispatchEvent(ptr('pointerdown', { clientX: 100, clientY: 100 }));
    el.dispatchEvent(ptr('pointermove', { clientX: 110, clientY: 120 }));

    expect(onPan).toHaveBeenCalledWith(10, 20);
  });

  test('subsequent pan moves accumulate correctly', () => {
    const onPan = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan }).attach(el);

    el.dispatchEvent(ptr('pointerdown', { clientX: 100, clientY: 100 }));
    el.dispatchEvent(ptr('pointermove', { clientX: 110, clientY: 110 }));
    el.dispatchEvent(ptr('pointermove', { clientX: 115, clientY: 112 }));

    expect(onPan).toHaveBeenNthCalledWith(1, 10, 10);
    expect(onPan).toHaveBeenNthCalledWith(2, 5, 2);
  });

  test('pan ends on pointerup', () => {
    const onPan = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan }).attach(el);

    el.dispatchEvent(ptr('pointerdown', { clientX: 0, clientY: 0 }));
    el.dispatchEvent(ptr('pointerup',   { clientX: 0, clientY: 0 }));
    el.dispatchEvent(ptr('pointermove', { clientX: 50, clientY: 50 }));

    expect(onPan).not.toHaveBeenCalled();
  });

  // ─── Background click ─────────────────────────────────────────────────────────

  test('background click fires onBackgroundClick', () => {
    const onBackgroundClick = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onBackgroundClick }).attach(el);

    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onBackgroundClick).toHaveBeenCalledTimes(1);
  });

  test('click is suppressed after pan', () => {
    const onBackgroundClick = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onBackgroundClick }).attach(el);

    // Move more than 4px to set panMoved.
    el.dispatchEvent(ptr('pointerdown', { clientX: 0, clientY: 0 }));
    el.dispatchEvent(ptr('pointermove', { clientX: 10, clientY: 0 }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onBackgroundClick).not.toHaveBeenCalled();
  });

  // ─── Space key ────────────────────────────────────────────────────────────────

  test('space keydown fires onSpaceDown and prevents default', () => {
    const onSpaceDown = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onSpaceDown }).attach(el);

    const ev = new KeyboardEvent('keydown', { bubbles: true, key: ' ', cancelable: true });
    el.dispatchEvent(ev);

    expect(onSpaceDown).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(true);
  });

  test('space keydown with repeat is ignored', () => {
    const onSpaceDown = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onSpaceDown }).attach(el);

    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ', repeat: true }));
    expect(onSpaceDown).not.toHaveBeenCalled();
  });

  test('space keyup fires onSpaceUp', () => {
    const onSpaceUp = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onSpaceUp }).attach(el);

    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
    expect(onSpaceUp).toHaveBeenCalledTimes(1);
  });

  // ─── Symbol drag ──────────────────────────────────────────────────────────────

  test('pointerdown on [data-symbol-id] fires onSymbolPointerDown', () => {
    const onSymbolPointerDown = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onSymbolPointerDown }).attach(el);

    const sym = document.createElement('div');
    sym.setAttribute('data-symbol-id', 'sym-1');
    el.appendChild(sym);

    sym.dispatchEvent(ptr('pointerdown', { clientX: 50, clientY: 60 }));
    expect(onSymbolPointerDown).toHaveBeenCalledWith('sym-1', 50, 60);
  });

  test('pointermove fires onSymbolPointerMove while symbol drag is active', () => {
    const onSymbolPointerMove = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onSymbolPointerMove }).attach(el);

    const sym = document.createElement('div');
    sym.setAttribute('data-symbol-id', 'sym-1');
    el.appendChild(sym);

    sym.dispatchEvent(ptr('pointerdown', { clientX: 50, clientY: 60 }));
    el.dispatchEvent(ptr('pointermove',  { clientX: 55, clientY: 65 }));

    expect(onSymbolPointerMove).toHaveBeenCalledWith(55, 65);
  });

  test('pointerup fires onSymbolPointerUp', () => {
    const onSymbolPointerUp = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onSymbolPointerUp }).attach(el);

    const sym = document.createElement('div');
    sym.setAttribute('data-symbol-id', 'sym-1');
    el.appendChild(sym);

    sym.dispatchEvent(ptr('pointerdown', { clientX: 50, clientY: 60 }));
    el.dispatchEvent(ptr('pointerup',    { clientX: 55, clientY: 65 }));

    expect(onSymbolPointerUp).toHaveBeenCalledTimes(1);
  });

  test('pointercancel fires onSymbolPointerCancel', () => {
    const onSymbolPointerCancel = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onSymbolPointerCancel }).attach(el);

    const sym = document.createElement('div');
    sym.setAttribute('data-symbol-id', 'sym-1');
    el.appendChild(sym);

    sym.dispatchEvent(ptr('pointerdown',   { clientX: 50, clientY: 60 }));
    el.dispatchEvent(ptr('pointercancel',  { clientX: 50, clientY: 60 }));

    expect(onSymbolPointerCancel).toHaveBeenCalledTimes(1);
  });

  test('background pan does not fire onSymbolPointerMove', () => {
    const onSymbolPointerMove = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onSymbolPointerMove }).attach(el);

    // Pointerdown on the element itself (no data-symbol-id) → pan, not symbol drag.
    el.dispatchEvent(ptr('pointerdown', { clientX: 0, clientY: 0 }));
    el.dispatchEvent(ptr('pointermove', { clientX: 10, clientY: 10 }));

    expect(onSymbolPointerMove).not.toHaveBeenCalled();
  });

  // ─── Pinch zoom ───────────────────────────────────────────────────────────────

  test('two-finger pinch fires onZoom', () => {
    const onZoom = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom, onPan: jest.fn() }).attach(el);

    // First finger down at (0, 0)
    el.dispatchEvent(ptr('pointerdown', { pointerId: 1, clientX: 0,  clientY: 0  }));
    // Second finger down at (100, 0) — pinch dist = 100
    el.dispatchEvent(ptr('pointerdown', { pointerId: 2, clientX: 100, clientY: 0 }));
    // Second finger moves to (150, 0) — dist = 150, factor = 150/100 = 1.5
    el.dispatchEvent(ptr('pointermove', { pointerId: 2, clientX: 150, clientY: 0 }));

    expect(onZoom).toHaveBeenCalledTimes(1);
    const [factor] = onZoom.mock.calls[0] as [number, number, number];
    expect(factor).toBeCloseTo(1.5, 5);
  });

  test('entering pinch cancels active symbol drag', () => {
    const onSymbolPointerCancel = jest.fn();
    const el = makeEl();
    createGestureController({ onZoom: jest.fn(), onPan: jest.fn(), onSymbolPointerCancel }).attach(el);

    const sym = document.createElement('div');
    sym.setAttribute('data-symbol-id', 'sym-1');
    el.appendChild(sym);

    sym.dispatchEvent(ptr('pointerdown', { pointerId: 1, clientX: 50, clientY: 60 }));
    // Second pointer arrives — enters pinch mode, symbol drag should be cancelled.
    el.dispatchEvent(ptr('pointerdown', { pointerId: 2, clientX: 100, clientY: 60 }));

    expect(onSymbolPointerCancel).toHaveBeenCalledTimes(1);
  });

  // ─── Detach ───────────────────────────────────────────────────────────────────

  test('detach removes all listeners', () => {
    const onPan = jest.fn();
    const onBackgroundClick = jest.fn();
    const onSpaceDown = jest.fn();
    const el = makeEl();
    const detach = createGestureController({
      onZoom: jest.fn(), onPan, onBackgroundClick, onSpaceDown,
    }).attach(el);

    detach();

    el.dispatchEvent(ptr('pointerdown', { clientX: 0, clientY: 0 }));
    el.dispatchEvent(ptr('pointermove', { clientX: 20, clientY: 20 }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));

    expect(onPan).not.toHaveBeenCalled();
    expect(onBackgroundClick).not.toHaveBeenCalled();
    expect(onSpaceDown).not.toHaveBeenCalled();
  });
});
