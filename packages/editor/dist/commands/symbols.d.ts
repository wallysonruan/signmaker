import type { Command, IdGenerator } from '../types';
/**
 * Add a new symbol to the sign.
 *
 * Matches original add() behavior:
 * - Deselects all existing symbols
 * - Appends the new symbol at the end of the list (front z-order)
 * - Selects the new symbol
 */
export declare function addSymbol(key: string, x: number, y: number, idGen: IdGenerator): Command;
/**
 * Remove all selected symbols.
 *
 * Fixes the original deletion bug: the original forward-iterating splice
 * skipped the element immediately after a deleted one. This implementation
 * uses filter() and is correct regardless of selection pattern.
 */
export declare function deleteSelected(): Command;
/** Remove all symbols and sort keys. */
export declare function clearAll(): Command;
/**
 * Translate all selected symbols by (dx, dy).
 * No bounds checking — coordinates can go negative or above 999.
 */
export declare function moveSelected(dx: number, dy: number): Command;
/**
 * Duplicate all selected symbols at (+offsetX, +offsetY) from their current position.
 * Copies are selected; originals are deselected. Default offset matches original: +10, +10.
 */
export declare function copySelected(idGen: IdGenerator, offsetX?: number, offsetY?: number): Command;
/**
 * Move all selected symbols to the end of the list (bring to front).
 * Preserves relative order among selected and among unselected symbols.
 */
export declare function bringToFront(): Command;
/** Rotate all selected symbols by step (±1). */
export declare function rotateSelected(step: number): Command;
/** Toggle mirror for all selected symbols. */
export declare function mirrorSelected(): Command;
/** Cycle fill variant for all selected symbols by step (±1). */
export declare function fillSelected(step: number): Command;
/** Cycle base symbol (variation) for all selected symbols by step (±1). */
export declare function variationSelected(step: number): Command;
/** Insert a key into the sort sequence at the given position. */
export declare function addSortKey(key: string, position: number): Command;
/** Replace the terms (gloss fields) array. */
export declare function setTerms(terms: readonly string[]): Command;
/** Set the active dictionary entry string. */
export declare function setEntry(entry: string): Command;
//# sourceMappingURL=symbols.d.ts.map