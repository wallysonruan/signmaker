import { usePaletteDrag } from '../src/usePaletteDrag';

jest.mock('@signwriter/renderer', () => ({
  renderSymbol: (key: string) => `<svg data-key="${key}"></svg>`,
}));

// JSDOM doesn't implement elementsFromPoint — provide a stub.
if (!document.elementsFromPoint) {
  document.elementsFromPoint = () => [];
}

function makePointerEvent(
  overrides: Partial<{
    pointerId: number;
    pointerType: string;
    button: number;
    clientX: number;
    clientY: number;
  }> = {},
): PointerEvent {
  return {
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    clientX: 0,
    clientY: 0,
    preventDefault: jest.fn(),
    ...overrides,
  } as unknown as PointerEvent;
}

/** Intercept document.addEventListener so we can invoke listeners directly in tests. */
function captureDocumentListeners(): {
  listeners: Record<string, ((e: PointerEvent) => void)[]>;
  restore(): void;
} {
  const listeners: Record<string, ((e: PointerEvent) => void)[]> = {};
  const addSpy = jest
    .spyOn(document, 'addEventListener')
    .mockImplementation((type, listener) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(listener as (e: PointerEvent) => void);
    });
  const removeSpy = jest
    .spyOn(document, 'removeEventListener')
    .mockImplementation((type, listener) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((l) => l !== listener);
      }
    });
  return {
    listeners,
    restore() {
      addSpy.mockRestore();
      removeSpy.mockRestore();
    },
  };
}

describe('usePaletteDrag', () => {
  let onDrop: jest.Mock;

  beforeEach(() => {
    onDrop = jest.fn();
    jest.spyOn(document, 'elementsFromPoint').mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('isDragging starts false', () => {
    const { isDragging } = usePaletteDrag(onDrop);
    expect(isDragging.value).toBe(false);
  });

  test('isDragging stays false after pointerdown without movement', () => {
    const { listeners, restore } = captureDocumentListeners();
    const { isDragging, onButtonPointerDown } = usePaletteDrag(onDrop);

    onButtonPointerDown('S14c20', makePointerEvent({ clientX: 100, clientY: 100 }));
    expect(isDragging.value).toBe(false);

    const smallMove = makePointerEvent({ pointerId: 1, clientX: 104, clientY: 104 });
    listeners['pointermove']?.forEach((fn) => fn(smallMove));
    expect(isDragging.value).toBe(false);

    restore();
  });

  test('isDragging becomes true once movement exceeds threshold', () => {
    const { listeners, restore } = captureDocumentListeners();
    const { isDragging, onButtonPointerDown } = usePaletteDrag(onDrop);

    onButtonPointerDown('S14c20', makePointerEvent({ clientX: 100, clientY: 100 }));
    const farMove = makePointerEvent({ pointerId: 1, clientX: 115, clientY: 115 });
    listeners['pointermove']?.forEach((fn) => fn(farMove));

    expect(isDragging.value).toBe(true);
    restore();
  });

  test('onDrop not called when pointer released over non-canvas element', () => {
    const { listeners, restore } = captureDocumentListeners();
    const { onButtonPointerDown } = usePaletteDrag(onDrop);

    const nonCanvas = document.createElement('div');
    jest.spyOn(document, 'elementsFromPoint').mockReturnValue([nonCanvas]);

    onButtonPointerDown('S14c20', makePointerEvent({ clientX: 100, clientY: 100 }));
    listeners['pointermove']?.forEach((fn) =>
      fn(makePointerEvent({ pointerId: 1, clientX: 120, clientY: 120 })),
    );
    listeners['pointerup']?.forEach((fn) =>
      fn(makePointerEvent({ pointerId: 1, clientX: 120, clientY: 120 })),
    );

    expect(onDrop).not.toHaveBeenCalled();
    restore();
  });

  test('onDrop called with correct args when dropped over [data-canvas]', () => {
    const { listeners, restore } = captureDocumentListeners();
    const { isDragging, onButtonPointerDown } = usePaletteDrag(onDrop);

    onButtonPointerDown('S14c20', makePointerEvent({ clientX: 100, clientY: 100 }));
    listeners['pointermove']?.forEach((fn) =>
      fn(makePointerEvent({ pointerId: 1, clientX: 120, clientY: 120 })),
    );
    expect(isDragging.value).toBe(true);

    const canvasEl = document.createElement('div');
    canvasEl.setAttribute('data-canvas', '');
    jest.spyOn(document, 'elementsFromPoint').mockReturnValue([canvasEl]);

    listeners['pointerup']?.forEach((fn) =>
      fn(makePointerEvent({ pointerId: 1, clientX: 120, clientY: 120 })),
    );

    expect(onDrop).toHaveBeenCalledWith('S14c20', 120, 120);
    expect(isDragging.value).toBe(false);
    restore();
  });

  test('onDrop not called after pointercancel', () => {
    const { listeners, restore } = captureDocumentListeners();
    const { isDragging, onButtonPointerDown } = usePaletteDrag(onDrop);

    onButtonPointerDown('S14c20', makePointerEvent({ clientX: 100, clientY: 100 }));
    listeners['pointermove']?.forEach((fn) =>
      fn(makePointerEvent({ pointerId: 1, clientX: 120, clientY: 120 })),
    );
    expect(isDragging.value).toBe(true);

    listeners['pointercancel']?.forEach((fn) =>
      fn(makePointerEvent({ pointerId: 1, clientX: 120, clientY: 120 })),
    );

    expect(onDrop).not.toHaveBeenCalled();
    expect(isDragging.value).toBe(false);
    restore();
  });

  test('ignores movement from a different pointerId', () => {
    const { listeners, restore } = captureDocumentListeners();
    const { isDragging, onButtonPointerDown } = usePaletteDrag(onDrop);

    onButtonPointerDown('S14c20', makePointerEvent({ pointerId: 1, clientX: 100, clientY: 100 }));
    const otherPointer = makePointerEvent({ pointerId: 2, clientX: 200, clientY: 200 });
    listeners['pointermove']?.forEach((fn) => fn(otherPointer));

    expect(isDragging.value).toBe(false);
    restore();
  });

  test('tap (pointerdown then immediate pointerup without movement) does not call onDrop', () => {
    const { listeners, restore } = captureDocumentListeners();
    const { onButtonPointerDown } = usePaletteDrag(onDrop);

    const canvasEl = document.createElement('div');
    canvasEl.setAttribute('data-canvas', '');
    jest.spyOn(document, 'elementsFromPoint').mockReturnValue([canvasEl]);

    onButtonPointerDown('S14c20', makePointerEvent({ clientX: 100, clientY: 100 }));
    // Release without moving — still in pending state, not active
    listeners['pointerup']?.forEach((fn) =>
      fn(makePointerEvent({ pointerId: 1, clientX: 100, clientY: 100 })),
    );

    expect(onDrop).not.toHaveBeenCalled();
    restore();
  });
});
