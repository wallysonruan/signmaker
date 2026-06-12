import type { Command, EditorSymbol, IdGenerator } from '../types';
import { rotate, mirror, fill, variation } from '@signwriter/fsw';

// ── Add ───────────────────────────────────────────────────────────────────────

/**
 * Add a new symbol to the sign.
 *
 * Matches original add() behavior:
 * - Deselects all existing symbols
 * - Appends the new symbol at the end of the list (front z-order)
 * - Selects the new symbol
 */
export function addSymbol(
  key: string,
  x: number,
  y: number,
  idGen: IdGenerator,
): Command {
  return (state) => {
    const id = idGen();
    const newSym: EditorSymbol = { id, key, x, y };
    return {
      ...state,
      symbols:   [...state.symbols, newSym],
      selection: new Set([id]),
    };
  };
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Remove all selected symbols.
 *
 * Fixes the original deletion bug: the original forward-iterating splice
 * skipped the element immediately after a deleted one. This implementation
 * uses filter() and is correct regardless of selection pattern.
 */
export function deleteSelected(): Command {
  return (state) => ({
    ...state,
    symbols:   state.symbols.filter((s) => !state.selection.has(s.id)),
    selection: new Set<string>(),
  });
}

// ── Clear ─────────────────────────────────────────────────────────────────────

/** Remove all symbols and sort keys. */
export function clearAll(): Command {
  return (state) => ({
    ...state,
    symbols:   [],
    sort:      [],
    selection: new Set<string>(),
  });
}

// ── Move ──────────────────────────────────────────────────────────────────────

/**
 * Translate all selected symbols by (dx, dy).
 * No bounds checking — coordinates can go negative or above 999.
 */
export function moveSelected(dx: number, dy: number): Command {
  return (state) => ({
    ...state,
    symbols: state.symbols.map((s) =>
      state.selection.has(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s
    ),
  });
}

// ── Copy ─────────────────────────────────────────────────────────────────────

/**
 * Duplicate all selected symbols at (+offsetX, +offsetY) from their current position.
 * Copies are selected; originals are deselected. Default offset matches original: +10, +10.
 */
export function copySelected(
  idGen: IdGenerator,
  offsetX = 10,
  offsetY = 10,
): Command {
  return (state) => {
    const copies: EditorSymbol[] = [];
    const newIds: string[] = [];
    for (const s of state.symbols) {
      if (state.selection.has(s.id)) {
        const id = idGen();
        copies.push({ id, key: s.key, x: s.x + offsetX, y: s.y + offsetY });
        newIds.push(id);
      }
    }
    return {
      ...state,
      symbols:   [...state.symbols, ...copies],
      selection: new Set(newIds),
    };
  };
}

// ── Z-order ───────────────────────────────────────────────────────────────────

/**
 * Move all selected symbols to the end of the list (bring to front).
 * Preserves relative order among selected and among unselected symbols.
 */
export function bringToFront(): Command {
  return (state) => {
    const unselected = state.symbols.filter((s) => !state.selection.has(s.id));
    const selected   = state.symbols.filter((s) =>  state.selection.has(s.id));
    return { ...state, symbols: [...unselected, ...selected] };
  };
}

// ── Symbol key transforms ────────────────────────────────────────────────────

/** Rotate all selected symbols by step (±1). */
export function rotateSelected(step: number): Command {
  return (state) => ({
    ...state,
    symbols: state.symbols.map((s) =>
      state.selection.has(s.id) ? { ...s, key: rotate(s.key, step) } : s
    ),
  });
}

/** Toggle mirror for all selected symbols. */
export function mirrorSelected(): Command {
  return (state) => ({
    ...state,
    symbols: state.symbols.map((s) =>
      state.selection.has(s.id) ? { ...s, key: mirror(s.key) } : s
    ),
  });
}

/** Cycle fill variant for all selected symbols by step (±1). */
export function fillSelected(step: number): Command {
  return (state) => ({
    ...state,
    symbols: state.symbols.map((s) =>
      state.selection.has(s.id) ? { ...s, key: fill(s.key, step) } : s
    ),
  });
}

/** Cycle base symbol (variation) for all selected symbols by step (±1). */
export function variationSelected(step: number): Command {
  return (state) => ({
    ...state,
    symbols: state.symbols.map((s) =>
      state.selection.has(s.id) ? { ...s, key: variation(s.key, step) } : s
    ),
  });
}

// ── Sort sequence ─────────────────────────────────────────────────────────────

/** Insert a key into the sort sequence at the given position. */
export function addSortKey(key: string, position: number): Command {
  return (state) => {
    const sort = [...state.sort];
    sort.splice(position, 0, key);
    return { ...state, sort };
  };
}

// ── Metadata ──────────────────────────────────────────────────────────────────

/** Replace the terms (gloss fields) array. */
export function setTerms(terms: readonly string[]): Command {
  return (state) => ({ ...state, terms: [...terms] });
}

/** Set the active dictionary entry string. */
export function setEntry(entry: string): Command {
  return (state) => ({ ...state, entry });
}
