import { ref, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { startDrag, updateDrag, endDrag, cancelDrag } from '@wallysonruan/signmaker-editor-engine';
import type { EditorState, Command, DragState } from '@wallysonruan/signmaker-editor-engine';

export interface UseSymbolDragReturn {
  isDragging: ComputedRef<boolean>;
  onPointerDown(symbolId: string, clientX: number, clientY: number): void;
  onPointerMove(clientX: number, clientY: number): void;
  onPointerUp(): void;
  onPointerCancel(): void;
}

export function useSymbolDrag(
  getState: () => EditorState,
  replaceState: (s: EditorState) => void,
  dispatch: (c: Command) => void,
  getScale: () => number = () => 1,
): UseSymbolDragReturn {
  const activeDrag = ref<DragState | null>(null);
  const startX = ref<number>(0);
  const startY = ref<number>(0);

  const isDragging = computed<boolean>(() => activeDrag.value !== null);

  function onPointerDown(symbolId: string, clientX: number, clientY: number): void {
    const { editorState: newState, drag } = startDrag(getState(), symbolId);
    activeDrag.value = drag;
    startX.value = clientX;
    startY.value = clientY;
    replaceState(newState);
  }

  function onPointerMove(clientX: number, clientY: number): void {
    if (activeDrag.value === null) return;
    const scale  = getScale();
    const deltaX = (clientX - startX.value) / scale;
    const deltaY = (clientY - startY.value) / scale;
    activeDrag.value = updateDrag(activeDrag.value, deltaX, deltaY);
  }

  function onPointerUp(): void {
    if (activeDrag.value === null) return;
    const drag = activeDrag.value;
    activeDrag.value = null;
    dispatch((state: EditorState) => endDrag(state, drag));
  }

  function onPointerCancel(): void {
    if (activeDrag.value === null) return;
    activeDrag.value = null;
    replaceState(cancelDrag(getState()));
  }

  return {
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
