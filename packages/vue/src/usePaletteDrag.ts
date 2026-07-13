import { ref, computed, onUnmounted, getCurrentInstance } from 'vue';
import type { ComputedRef } from 'vue';
import { renderSymbol } from '@wallysonruan/signmaker-renderer';
import { createPaletteDragState } from '@wallysonruan/signmaker-interactions';

export interface UsePaletteDragReturn {
  isDragging: ComputedRef<boolean>;
  onButtonPointerDown(key: string, e: PointerEvent): void;
}

export function usePaletteDrag(
  onDrop: (key: string, clientX: number, clientY: number) => void,
): UsePaletteDragReturn {
  const isDraggingRef = ref(false);
  let ghost: HTMLElement | null = null;

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

  const controller = createPaletteDragState({
    onDragStart(key, clientX, clientY) {
      isDraggingRef.value = true;
      ghost = createGhost(key, clientX, clientY);
    },
    onDragMove(clientX, clientY) {
      if (ghost) {
        ghost.style.left = clientX + 'px';
        ghost.style.top  = clientY + 'px';
      }
    },
    onDrop(key, clientX, clientY) {
      isDraggingRef.value = false;
      removeGhost();
      onDrop(key, clientX, clientY);
    },
    onMiss() {
      isDraggingRef.value = false;
      removeGhost();
    },
    onCancel() {
      isDraggingRef.value = false;
      removeGhost();
    },
  });

  if (getCurrentInstance()) {
    onUnmounted(() => {
      controller.dispose();
      removeGhost();
    });
  }

  return {
    isDragging: computed(() => isDraggingRef.value),
    onButtonPointerDown: (key, e) => controller.onButtonPointerDown(key, e),
  };
}
