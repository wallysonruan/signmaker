import { useRef, useState } from 'react';
import type { EditorState, Command, DragState } from '@signwriter/editor';
import { startDrag, updateDrag, endDrag, cancelDrag } from '@signwriter/editor';

// ── Public return type ────────────────────────────────────────────────────────

export interface UseSymbolDragResult {
  isDragging: boolean;
  onPointerDown(symbolId: string, clientX: number, clientY: number): void;
  onPointerMove(clientX: number, clientY: number): void;
  onPointerUp(): void;
  onPointerCancel(): void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSymbolDrag(
  getState: () => EditorState,
  replaceState: (s: EditorState) => void,
  dispatch: (c: Command) => void,
): UseSymbolDragResult {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  function onPointerDown(symbolId: string, clientX: number, clientY: number): void {
    const { editorState: newEditorState, drag } = startDrag(getState(), symbolId);
    replaceState(newEditorState);
    dragRef.current = drag;
    startPosRef.current = { x: clientX, y: clientY };
    setIsDragging(true);
  }

  function onPointerMove(clientX: number, clientY: number): void {
    if (!dragRef.current || !startPosRef.current) return;
    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;
    dragRef.current = updateDrag(dragRef.current, deltaX, deltaY);
  }

  function onPointerUp(): void {
    const drag = dragRef.current;
    dragRef.current = null;
    startPosRef.current = null;
    setIsDragging(false);
    if (drag) {
      dispatch((state: EditorState) => endDrag(state, drag));
    }
  }

  function onPointerCancel(): void {
    dragRef.current = null;
    startPosRef.current = null;
    setIsDragging(false);
    replaceState(cancelDrag(getState()));
  }

  return { isDragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
