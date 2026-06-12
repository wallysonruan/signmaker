"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSymbol = addSymbol;
exports.deleteSelected = deleteSelected;
exports.clearAll = clearAll;
exports.moveSelected = moveSelected;
exports.copySelected = copySelected;
exports.bringToFront = bringToFront;
exports.rotateSelected = rotateSelected;
exports.mirrorSelected = mirrorSelected;
exports.fillSelected = fillSelected;
exports.variationSelected = variationSelected;
exports.addSortKey = addSortKey;
exports.setTerms = setTerms;
exports.setEntry = setEntry;
const fsw_1 = require("@signwriter/fsw");
// ── Add ───────────────────────────────────────────────────────────────────────
/**
 * Add a new symbol to the sign.
 *
 * Matches original add() behavior:
 * - Deselects all existing symbols
 * - Appends the new symbol at the end of the list (front z-order)
 * - Selects the new symbol
 */
function addSymbol(key, x, y, idGen) {
    return (state) => {
        const id = idGen();
        const newSym = { id, key, x, y };
        return {
            ...state,
            symbols: [...state.symbols, newSym],
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
function deleteSelected() {
    return (state) => ({
        ...state,
        symbols: state.symbols.filter((s) => !state.selection.has(s.id)),
        selection: new Set(),
    });
}
// ── Clear ─────────────────────────────────────────────────────────────────────
/** Remove all symbols and sort keys. */
function clearAll() {
    return (state) => ({
        ...state,
        symbols: [],
        sort: [],
        selection: new Set(),
    });
}
// ── Move ──────────────────────────────────────────────────────────────────────
/**
 * Translate all selected symbols by (dx, dy).
 * No bounds checking — coordinates can go negative or above 999.
 */
function moveSelected(dx, dy) {
    return (state) => ({
        ...state,
        symbols: state.symbols.map((s) => state.selection.has(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s),
    });
}
// ── Copy ─────────────────────────────────────────────────────────────────────
/**
 * Duplicate all selected symbols at (+offsetX, +offsetY) from their current position.
 * Copies are selected; originals are deselected. Default offset matches original: +10, +10.
 */
function copySelected(idGen, offsetX = 10, offsetY = 10) {
    return (state) => {
        const copies = [];
        const newIds = [];
        for (const s of state.symbols) {
            if (state.selection.has(s.id)) {
                const id = idGen();
                copies.push({ id, key: s.key, x: s.x + offsetX, y: s.y + offsetY });
                newIds.push(id);
            }
        }
        return {
            ...state,
            symbols: [...state.symbols, ...copies],
            selection: new Set(newIds),
        };
    };
}
// ── Z-order ───────────────────────────────────────────────────────────────────
/**
 * Move all selected symbols to the end of the list (bring to front).
 * Preserves relative order among selected and among unselected symbols.
 */
function bringToFront() {
    return (state) => {
        const unselected = state.symbols.filter((s) => !state.selection.has(s.id));
        const selected = state.symbols.filter((s) => state.selection.has(s.id));
        return { ...state, symbols: [...unselected, ...selected] };
    };
}
// ── Symbol key transforms ────────────────────────────────────────────────────
/** Rotate all selected symbols by step (±1). */
function rotateSelected(step) {
    return (state) => ({
        ...state,
        symbols: state.symbols.map((s) => state.selection.has(s.id) ? { ...s, key: (0, fsw_1.rotate)(s.key, step) } : s),
    });
}
/** Toggle mirror for all selected symbols. */
function mirrorSelected() {
    return (state) => ({
        ...state,
        symbols: state.symbols.map((s) => state.selection.has(s.id) ? { ...s, key: (0, fsw_1.mirror)(s.key) } : s),
    });
}
/** Cycle fill variant for all selected symbols by step (±1). */
function fillSelected(step) {
    return (state) => ({
        ...state,
        symbols: state.symbols.map((s) => state.selection.has(s.id) ? { ...s, key: (0, fsw_1.fill)(s.key, step) } : s),
    });
}
/** Cycle base symbol (variation) for all selected symbols by step (±1). */
function variationSelected(step) {
    return (state) => ({
        ...state,
        symbols: state.symbols.map((s) => state.selection.has(s.id) ? { ...s, key: (0, fsw_1.variation)(s.key, step) } : s),
    });
}
// ── Sort sequence ─────────────────────────────────────────────────────────────
/** Insert a key into the sort sequence at the given position. */
function addSortKey(key, position) {
    return (state) => {
        const sort = [...state.sort];
        sort.splice(position, 0, key);
        return { ...state, sort };
    };
}
// ── Metadata ──────────────────────────────────────────────────────────────────
/** Replace the terms (gloss fields) array. */
function setTerms(terms) {
    return (state) => ({ ...state, terms: [...terms] });
}
/** Set the active dictionary entry string. */
function setEntry(entry) {
    return (state) => ({ ...state, entry });
}
//# sourceMappingURL=symbols.js.map