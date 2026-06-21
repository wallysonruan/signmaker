const DRAG_THRESHOLD = 10;

export interface PaletteDragCallbacks {
  /** Called once when the drag threshold is crossed and the drag becomes active. */
  onDragStart?(key: string, clientX: number, clientY: number): void;
  /** Called on every pointer move while the drag is active. */
  onDragMove?(clientX: number, clientY: number): void;
  /** Called when the pointer is released over a valid drop zone. */
  onDrop(key: string, clientX: number, clientY: number): void;
  /** Called when the pointer is released outside any drop zone. */
  onMiss?(): void;
  /** Called when the drag is cancelled (e.g. pointercancel). */
  onCancel?(): void;
}

export interface PaletteDragController {
  /** Whether a drag is currently active (threshold crossed, not yet released). */
  isDragging(): boolean;
  /** Call this from pointerdown on the draggable button. */
  onButtonPointerDown(key: string, e: PointerEvent): void;
  /** Release global event listeners and reset state. */
  dispose(): void;
}

function defaultIsOverDropZone(clientX: number, clientY: number): boolean {
  return document
    .elementsFromPoint(clientX, clientY)
    .some((el) => el.hasAttribute('data-canvas'));
}

/**
 * Framework-agnostic palette drag state machine.
 *
 * Manages the idle → pending → active → (drop | miss | cancel) lifecycle.
 * The caller is responsible for ghost element creation, lifecycle cleanup
 * (e.g. onUnmounted), and reactive isDragging wrappers.
 *
 * @param callbacks  Lifecycle hooks called at each state transition.
 * @param isOverDropZone  Override drop zone detection. Default: checks data-canvas attribute.
 */
export function createPaletteDragState(
  callbacks: PaletteDragCallbacks,
  isOverDropZone: (clientX: number, clientY: number) => boolean = defaultIsOverDropZone,
): PaletteDragController {
  interface PendingDrag {
    key: string;
    startX: number;
    startY: number;
    pointerId: number;
  }

  interface ActiveDrag {
    key: string;
    pointerId: number;
  }

  let pending: PendingDrag | null = null;
  let active:  ActiveDrag  | null = null;

  function removeListeners(): void {
    document.removeEventListener('pointermove',   onPointerMove);
    document.removeEventListener('pointerup',     onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
  }

  function reset(): void {
    pending = null;
    active  = null;
    removeListeners();
  }

  function onPointerMove(e: PointerEvent): void {
    if (active !== null) {
      if (e.pointerId !== active.pointerId) return;
      e.preventDefault();
      callbacks.onDragMove?.(e.clientX, e.clientY);
      return;
    }

    if (pending === null || e.pointerId !== pending.pointerId) return;
    const dx = e.clientX - pending.startX;
    const dy = e.clientY - pending.startY;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      const { key, pointerId } = pending;
      pending = null;
      active  = { key, pointerId };
      callbacks.onDragStart?.(key, e.clientX, e.clientY);
      e.preventDefault();
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (active !== null && e.pointerId === active.pointerId) {
      const { key } = active;
      const { clientX, clientY } = e;
      reset();
      if (isOverDropZone(clientX, clientY)) {
        callbacks.onDrop(key, clientX, clientY);
      } else {
        callbacks.onMiss?.();
      }
      return;
    }
    if (pending !== null && e.pointerId === pending.pointerId) {
      reset();
    }
  }

  function onPointerCancel(e: PointerEvent): void {
    const wasActive = active !== null && e.pointerId === active.pointerId;
    const wasPending = pending !== null && e.pointerId === pending.pointerId;
    if (wasActive || wasPending) {
      reset();
      if (wasActive) callbacks.onCancel?.();
    }
  }

  function onButtonPointerDown(key: string, e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pending = { key, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId };
    document.addEventListener('pointermove',   onPointerMove,   { passive: false } as AddEventListenerOptions);
    document.addEventListener('pointerup',     onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
  }

  return {
    isDragging:          () => active !== null,
    onButtonPointerDown,
    dispose:             reset,
  };
}
