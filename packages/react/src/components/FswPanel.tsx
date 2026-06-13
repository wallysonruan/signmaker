import React, { useState } from 'react';
import styles from './FswPanel.module.css';

export interface FswPanelProps {
  fsw: string;
  onLoadFsw: (fsw: string) => void;
}

export function FswPanel({ fsw, onLoadFsw }: FswPanelProps): React.JSX.Element {
  const [inputValue, setInputValue] = useState('');

  function loadFsw(): void {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onLoadFsw(trimmed);
      setInputValue('');
    }
  }

  return (
    <footer className={styles.fswPanel}>
      <span className={styles.fswLabel}>FSW:</span>
      <span className={styles.fswCurrent} title={fsw}>{fsw || '(empty)'}</span>
      <div className={styles.fswInputGroup}>
        <input
          className={styles.fswInput}
          type="text"
          placeholder="Paste FSW to load a sign…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') loadFsw(); }}
        />
        <button className={styles.fswLoadBtn} onClick={loadFsw}>Load</button>
      </div>
    </footer>
  );
}
