import React, { useRef, useState, useCallback } from 'react';
import { useSymbolDrag } from '../useSymbolDrag';
import { selectNone, addSymbol } from '@signwriter/editor';
import { renderSymbol } from '@signwriter/renderer';
import type { EditorState, EditorSymbol, Command } from '@signwriter/editor';
import { SymbolHandles } from './SymbolHandles';
import styles from './SignEditorCanvas.module.css';

export interface SignEditorCanvasProps {
  state: EditorState;
  dispatch: (command: Command) => void;
  replaceState: (state: EditorState) => void;
}

export function SignEditorCanvas({ state, dispatch, replaceState }: SignEditorCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState<{ symbolId: string; dx: number; dy: number } | null>(null);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null);

  const getState = useCallback(() => state, [state]);

  const drag = useSymbolDrag(getState, replaceState, dispatch);

  const midWidth = canvasRef.current ? canvasRef.current.clientWidth / 2 : 300;
  const midHeight = canvasRef.current ? canvasRef.current.clientHeight / 2 : 250;

  function symbolStyle(sym: EditorSymbol): React.CSSProperties {
    let x = sym.x;
    let y = sym.y;
    if (dragOffset?.symbolId === sym.id) {
      x += dragOffset.dx;
      y += dragOffset.dy;
    }
    return {
      position: 'absolute',
      left: (x - 500 + midWidth) + 'px',
      top: (y - 500 + midHeight) + 'px',
      cursor: drag.isDragging ? 'grabbing' : 'grab',
      zIndex: state.selection.has(sym.id) ? 10 : 1,
    };
  }

  function onSymbolPointerDown(sym: EditorSymbol, e: React.PointerEvent): void {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    e.stopPropagation();
    setDragOrigin({ x: e.clientX, y: e.clientY });
    setDragOffset({ symbolId: sym.id, dx: 0, dy: 0 });
    drag.onPointerDown(sym.id, e.clientX, e.clientY);
  }

  function onCanvasPointerMove(e: React.PointerEvent): void {
    setDragOffset((prev) => {
      if (!prev || !dragOrigin) return prev;
      return { ...prev, dx: e.clientX - dragOrigin.x, dy: e.clientY - dragOrigin.y };
    });
    drag.onPointerMove(e.clientX, e.clientY);
  }

  function onCanvasPointerUp(): void {
    setDragOffset(null);
    setDragOrigin(null);
    drag.onPointerUp();
  }

  function onCanvasPointerCancel(): void {
    setDragOffset(null);
    setDragOrigin(null);
    drag.onPointerCancel();
  }

  function onCanvasClick(): void {
    dispatch((s) => selectNone(s));
  }

  function onDrop(e: React.DragEvent): void {
    e.preventDefault();
    const key = e.dataTransfer.getData('text/plain');
    if (!key || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const fswX = Math.round(e.clientX - rect.left - midWidth + 500);
    const fswY = Math.round(e.clientY - rect.top - midHeight + 500);
    dispatch(addSymbol(key, fswX, fswY, () => crypto.randomUUID()));
  }

  return (
    <div
      ref={canvasRef}
      className={styles.canvas}
      onClick={onCanvasClick}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      onPointerCancel={onCanvasPointerCancel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {state.symbols.map((sym) => (
        <div
          key={sym.id}
          className={styles.symbolWrapper}
          style={symbolStyle(sym)}
          onPointerDown={(e) => onSymbolPointerDown(sym, e)}
          onClick={(e) => e.stopPropagation()}
          dangerouslySetInnerHTML={{ __html: renderSymbol(sym.key) }}
        />
      ))}
      <SymbolHandles
        state={state}
        dispatch={dispatch}
        midWidth={midWidth}
        midHeight={midHeight}
        isDragging={drag.isDragging}
      />
    </div>
  );
}
