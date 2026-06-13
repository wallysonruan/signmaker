import React, { useMemo } from 'react';
import { getSelected, rotateSelected, mirrorSelected, copySelected } from '@signwriter/editor';
import { getSymbolSize } from '@signwriter/renderer';
import type { EditorState, Command } from '@signwriter/editor';
import styles from './SymbolHandles.module.css';

export interface SymbolHandlesProps {
  state: EditorState;
  dispatch: (command: Command) => void;
  midWidth: number;
  midHeight: number;
  isDragging: boolean;
}

export function SymbolHandles({ state, dispatch, midWidth, midHeight, isDragging }: SymbolHandlesProps): React.JSX.Element | null {
  const selected = useMemo(() => {
    if (isDragging) return null;
    const sel = getSelected(state);
    return sel.length === 1 ? sel[0] : null;
  }, [state, isDragging]);

  const box = useMemo(() => {
    if (!selected) return null;
    const size = getSymbolSize(selected.key) ?? { width: 40, height: 40 };
    return {
      left: selected.x - 500 + midWidth,
      top: selected.y - 500 + midHeight,
      width: size.width,
      height: size.height,
    };
  }, [selected, midWidth, midHeight]);

  if (!box) return null;

  const rootStyle: React.CSSProperties = {
    position: 'absolute',
    left: box.left + 'px',
    top: box.top + 'px',
    width: box.width + 'px',
    height: box.height + 'px',
    zIndex: 20,
    pointerEvents: 'none',
  };

  return (
    <div
      className={styles.handlesRoot}
      style={rootStyle}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className={styles.handlesBox}>
        <span className={`${styles.handle} ${styles.handleTl}`} />
        <span className={`${styles.handle} ${styles.handleTr}`} />
        <span className={`${styles.handle} ${styles.handleBl}`} />
        <span className={`${styles.handle} ${styles.handleBr}`} />
      </div>
      <div className={`${styles.handlesToolbar} ${styles.handlesToolbarTop}`}>
        <button className={styles.handleBtn} title="Rotate counter-clockwise" onClick={() => dispatch(rotateSelected(-1))}>↺</button>
        <button className={styles.handleBtn} title="Rotate clockwise" onClick={() => dispatch(rotateSelected(1))}>↻</button>
      </div>
      <div className={`${styles.handlesToolbar} ${styles.handlesToolbarBottom}`}>
        <button className={styles.handleBtn} title="Flip horizontal" onClick={() => dispatch(mirrorSelected())}>⟺</button>
        <button className={styles.handleBtn} title="Flip vertical" onClick={() => dispatch((s) => mirrorSelected()(rotateSelected(4)(s)))}>↕</button>
        <button className={`${styles.handleBtn} ${styles.handleBtnCopy}`} title="Copy symbol" onClick={() => dispatch(copySelected(() => crypto.randomUUID()))}>⊕</button>
      </div>
    </div>
  );
}
