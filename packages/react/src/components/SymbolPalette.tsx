import React, { useState } from 'react';
import { renderSymbol } from '@signwriter/renderer';
import { ALPHABET, GROUPS } from '../data/alphabet';
import styles from './SymbolPalette.module.css';

export interface SymbolPaletteProps {
  onAddSymbol: (key: string) => void;
}

export function SymbolPalette({ onAddSymbol }: SymbolPaletteProps): React.JSX.Element {
  const [level, setLevel] = useState<0 | 1 | 2>(0);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [variantTab, setVariantTab] = useState<0 | 1>(0);

  function variantKey(baseKey: string, fillDigit: number, rotation: number): string {
    return baseKey.slice(0, 4) + fillDigit.toString() + rotation.toString(16);
  }

  function onDragStart(e: React.DragEvent, key: string): void {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'copy';
  }

  function selectGroup(groupKey: string): void {
    setSelectedGroup(groupKey);
    setLevel(1);
  }

  function selectBase(baseKey: string): void {
    setSelectedBase(baseKey.slice(0, 4) + '00');
    setVariantTab(0);
    setLevel(2);
  }

  if (level === 0) {
    return (
      <aside className={styles.palette}>
        <div className={styles.paletteSection}>
          <div className={styles.paletteTitle}>Symbol Groups</div>
          <div className={styles.groupGrid}>
            {GROUPS.map((groupKey) => (
              <button
                key={groupKey}
                className={styles.groupBtn}
                title={groupKey}
                draggable
                onDragStart={(e) => onDragStart(e, groupKey)}
                onClick={() => selectGroup(groupKey)}
              >
                <span
                  className={styles.symbolCell}
                  dangerouslySetInnerHTML={{ __html: renderSymbol(groupKey) }}
                />
              </button>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (level === 1 && selectedGroup !== null) {
    return (
      <aside className={styles.palette}>
        <div className={styles.paletteSection}>
          <div className={styles.paletteNav}>
            <button className={styles.backBtn} onClick={() => setLevel(0)}>← Groups</button>
            <span className={styles.paletteTitle}>{selectedGroup}</span>
          </div>
          <div className={styles.symbolGrid}>
            {ALPHABET[selectedGroup].map((baseKey) => (
              <button
                key={baseKey}
                className={styles.symbolBtn}
                title={baseKey}
                draggable
                onDragStart={(e) => onDragStart(e, baseKey)}
                onClick={() => selectBase(baseKey)}
              >
                <span
                  className={styles.symbolCell}
                  dangerouslySetInnerHTML={{ __html: renderSymbol(baseKey) }}
                />
              </button>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (level === 2 && selectedBase !== null) {
    const fills = [0, 1, 2, 3, 4, 5];
    const rots = [0, 1, 2, 3, 4, 5, 6, 7];
    return (
      <aside className={styles.palette}>
        <div className={styles.paletteSection}>
          <div className={styles.paletteNav}>
            <button className={styles.backBtn} onClick={() => setLevel(1)}>← Base</button>
            <span className={styles.paletteTitle}>{selectedBase}</span>
          </div>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tabBtn}${variantTab === 0 ? ' ' + styles.active : ''}`}
              onClick={() => setVariantTab(0)}
            >0–7</button>
            <button
              className={`${styles.tabBtn}${variantTab === 1 ? ' ' + styles.active : ''}`}
              onClick={() => setVariantTab(1)}
            >8–f</button>
          </div>
          <div className={styles.variantGrid}>
            {fills.map((fillIdx) =>
              rots.map((rotIdx) => {
                const key = variantKey(selectedBase, fillIdx, variantTab * 8 + rotIdx);
                return (
                  <button
                    key={key}
                    className={styles.symbolBtn}
                    title={key}
                    draggable
                    onDragStart={(e) => onDragStart(e, key)}
                    onClick={() => onAddSymbol(key)}
                  >
                    <span
                      className={styles.symbolCell}
                      dangerouslySetInnerHTML={{ __html: renderSymbol(key) }}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </aside>
    );
  }

  return <aside className={styles.palette} />;
}
