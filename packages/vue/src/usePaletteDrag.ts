import { ref, computed, onUnmounted, getCurrentInstance } from 'vue';
import type { ComputedRef } from 'vue';
import { renderSymbol } from '@signwriter/renderer';

export interface UsePaletteDragReturn {
  isDragging: ComputedRef<boolean>;
  onButtonPointerDown(key: string, e: PointerEvent): void;
}

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

const DRAG_THRESHOLD = 10;

export function usePaletteDrag(
  onDrop: (key: string, clientX: number, clientY: number) => void,
): UsePaletteDragReturn {
  const pending = ref<PendingDrag | null>(null);
  const active  = ref<ActiveDrag  | null>(null);
  let ghost: HTMLElement | null = null;

  const isDragging = computed(() => active.value !== null);

  function createGhost(key: string, x: number, y: number): HTMLElement {
    const el = document.createElement('div');
    el.innerHTML = renderSymbol(key);
    el.style.cssText = [
      'position:fixed',
      `left:${x}px`,
      `top:${y}px`,
      'transform:translate(-50%,-50%)',
      'pointer-events:none',
      'z-index:9999',
      'opacity:0.85',
      'width:48px',
      'height:48px',
      'background:white',
      'border:2px solid #3b82f6',
      'border-radius:4px',
      'padding:4px',
      'box-shadow:0 4px 12px rgba(0,0,0,.15)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'overflow:hidden',
    ].join(';');
    const svg = el.querySelector('svg');
    if (svg) {
      svg.style.cssText = 'max-width:100%;max-height:100%;display:block';
    }
    document.body.appendChild(el);
    return el;
  }

  function removeGhost(): void {
    ghost?.remove();
    ghost = null;
  }

  function cleanup(): void {
    pending.value = null;
    active.value  = null;
    removeGhost();
    document.removeEventListener('pointermove',   onPointerMove);
    document.removeEventListener('pointerup',     onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
  }

  function onButtonPointerDown(key: string, e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pending.value = { key, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId };
    document.addEventListener('pointermove',   onPointerMove,   { passive: false } as AddEventListenerOptions);
    document.addEventListener('pointerup',     onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
  }

  function onPointerMove(e: PointerEvent): void {
    if (active.value !== null) {
      if (e.pointerId !== active.value.pointerId) return;
      e.preventDefault();
      if (ghost) {
        ghost.style.left = e.clientX + 'px';
        ghost.style.top  = e.clientY + 'px';
      }
      return;
    }

    if (pending.value === null || e.pointerId !== pending.value.pointerId) return;
    const dx = e.clientX - pending.value.startX;
    const dy = e.clientY - pending.value.startY;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      const key = pending.value.key;
      pending.value = null;
      active.value  = { key, pointerId: e.pointerId };
      ghost = createGhost(key, e.clientX, e.clientY);
      e.preventDefault();
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (active.value !== null && e.pointerId === active.value.pointerId) {
      const key = active.value.key;
      cleanup();
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const onCanvas = elements.some((el) => el.hasAttribute('data-canvas'));
      if (onCanvas) {
        onDrop(key, e.clientX, e.clientY);
      }
      return;
    }
    if (pending.value !== null && e.pointerId === pending.value.pointerId) {
      cleanup();
    }
  }

  function onPointerCancel(e: PointerEvent): void {
    if (
      (active.value !== null  && e.pointerId === active.value.pointerId) ||
      (pending.value !== null && e.pointerId === pending.value.pointerId)
    ) {
      cleanup();
    }
  }

  if (getCurrentInstance()) onUnmounted(cleanup);

  return { isDragging, onButtonPointerDown };
}
