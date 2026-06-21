import { createPaletteDragState } from '../src/createPaletteDragState';

function makePointerEvent(type: string, overrides: Partial<PointerEvent> = {}): PointerEvent {
  return Object.assign(new Event(type), {
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    clientX: 0,
    clientY: 0,
    preventDefault: jest.fn(),
    ...overrides,
  }) as unknown as PointerEvent;
}

describe('createPaletteDragState()', () => {
  test('isDragging() starts false', () => {
    const ctrl = createPaletteDragState({ onDrop: jest.fn() });
    expect(ctrl.isDragging()).toBe(false);
  });

  test('isDragging() is true once threshold is crossed', () => {
    const ctrl = createPaletteDragState({ onDrop: jest.fn() });
    ctrl.onButtonPointerDown('S10000', makePointerEvent('pointerdown', { clientX: 0, clientY: 0 }));

    document.dispatchEvent(makePointerEvent('pointermove', { clientX: 15, clientY: 0 }));
    expect(ctrl.isDragging()).toBe(true);
    ctrl.dispose();
  });

  test('isDragging() stays false below threshold', () => {
    const ctrl = createPaletteDragState({ onDrop: jest.fn() });
    ctrl.onButtonPointerDown('S10000', makePointerEvent('pointerdown', { clientX: 0, clientY: 0 }));

    document.dispatchEvent(makePointerEvent('pointermove', { clientX: 5, clientY: 0 }));
    expect(ctrl.isDragging()).toBe(false);
    ctrl.dispose();
  });

  test('onDragStart is called when threshold is crossed', () => {
    const onDragStart = jest.fn();
    const ctrl = createPaletteDragState({ onDragStart, onDrop: jest.fn() });
    ctrl.onButtonPointerDown('S10000', makePointerEvent('pointerdown', { clientX: 100, clientY: 100 }));

    document.dispatchEvent(makePointerEvent('pointermove', { clientX: 115, clientY: 100 }));
    expect(onDragStart).toHaveBeenCalledWith('S10000', 115, 100);
    ctrl.dispose();
  });

  test('onDragMove is called on subsequent moves', () => {
    const onDragMove = jest.fn();
    const ctrl = createPaletteDragState({ onDragMove, onDrop: jest.fn() });
    ctrl.onButtonPointerDown('S10000', makePointerEvent('pointerdown', { clientX: 0, clientY: 0 }));

    document.dispatchEvent(makePointerEvent('pointermove', { clientX: 15, clientY: 0 }));
    document.dispatchEvent(makePointerEvent('pointermove', { clientX: 20, clientY: 5 }));
    expect(onDragMove).toHaveBeenCalledWith(20, 5);
    ctrl.dispose();
  });

  test('onDrop is called when released over drop zone', () => {
    const onDrop = jest.fn();
    const ctrl = createPaletteDragState({ onDrop }, () => true);
    ctrl.onButtonPointerDown('S10000', makePointerEvent('pointerdown', { clientX: 0, clientY: 0 }));

    document.dispatchEvent(makePointerEvent('pointermove', { clientX: 15, clientY: 0 }));
    document.dispatchEvent(makePointerEvent('pointerup',   { clientX: 15, clientY: 0 }));

    expect(onDrop).toHaveBeenCalledWith('S10000', 15, 0);
    expect(ctrl.isDragging()).toBe(false);
  });

  test('onMiss is called when released outside drop zone', () => {
    const onDrop = jest.fn();
    const onMiss = jest.fn();
    const ctrl = createPaletteDragState({ onDrop, onMiss }, () => false);
    ctrl.onButtonPointerDown('S10000', makePointerEvent('pointerdown', { clientX: 0, clientY: 0 }));

    document.dispatchEvent(makePointerEvent('pointermove', { clientX: 15, clientY: 0 }));
    document.dispatchEvent(makePointerEvent('pointerup',   { clientX: 15, clientY: 0 }));

    expect(onDrop).not.toHaveBeenCalled();
    expect(onMiss).toHaveBeenCalled();
  });

  test('onCancel is called on pointercancel', () => {
    const onCancel = jest.fn();
    const ctrl = createPaletteDragState({ onDrop: jest.fn(), onCancel });
    ctrl.onButtonPointerDown('S10000', makePointerEvent('pointerdown', { clientX: 0, clientY: 0 }));

    document.dispatchEvent(makePointerEvent('pointermove',   { clientX: 15, clientY: 0 }));
    document.dispatchEvent(makePointerEvent('pointercancel', { clientX: 15, clientY: 0 }));

    expect(onCancel).toHaveBeenCalled();
    expect(ctrl.isDragging()).toBe(false);
  });

  test('onCancel is NOT called when cancelling before threshold', () => {
    const onCancel = jest.fn();
    const ctrl = createPaletteDragState({ onDrop: jest.fn(), onCancel });
    ctrl.onButtonPointerDown('S10000', makePointerEvent('pointerdown', { clientX: 0, clientY: 0 }));

    document.dispatchEvent(makePointerEvent('pointercancel', { clientX: 0, clientY: 0 }));

    expect(onCancel).not.toHaveBeenCalled();
  });

  test('right-click (button !== 0) is ignored', () => {
    const ctrl = createPaletteDragState({ onDrop: jest.fn() });
    ctrl.onButtonPointerDown(
      'S10000',
      makePointerEvent('pointerdown', { button: 2, pointerType: 'mouse' }),
    );
    document.dispatchEvent(makePointerEvent('pointermove', { clientX: 20, clientY: 0 }));
    expect(ctrl.isDragging()).toBe(false);
  });

  test('dispose() resets state and removes listeners', () => {
    const onDrop = jest.fn();
    const ctrl = createPaletteDragState({ onDrop }, () => true);
    ctrl.onButtonPointerDown('S10000', makePointerEvent('pointerdown', { clientX: 0, clientY: 0 }));
    document.dispatchEvent(makePointerEvent('pointermove', { clientX: 15, clientY: 0 }));

    ctrl.dispose();
    expect(ctrl.isDragging()).toBe(false);

    // After dispose, pointerup should not call onDrop.
    document.dispatchEvent(makePointerEvent('pointerup', { clientX: 15, clientY: 0 }));
    expect(onDrop).not.toHaveBeenCalled();
  });
});
