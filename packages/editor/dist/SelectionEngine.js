"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSelected = getSelected;
exports.selectNone = selectNone;
exports.selectById = selectById;
exports.cycleSelection = cycleSelection;
/** Return all selected symbols in list order. */
function getSelected(state) {
    return state.symbols.filter((s) => state.selection.has(s.id));
}
/** Deselect all symbols. */
function selectNone(state) {
    if (state.selection.size === 0)
        return state;
    return { ...state, selection: new Set() };
}
/** Select a single symbol by ID, deselecting all others. */
function selectById(state, id) {
    if (state.selection.size === 1 && state.selection.has(id))
        return state;
    return { ...state, selection: new Set([id]) };
}
/**
 * Cycle selection by step positions through the symbol list (wraps around).
 *
 * Matches original select(step) behavior (index.js:687-701):
 *   - If nothing is selected, treats current index as -1 before stepping
 *   - Deselects all, then selects the single symbol at the new index
 *   - No-op on empty list
 *
 * With nothing selected and step=+1, index becomes (-1+1+len)%len = 0 (first).
 */
function cycleSelection(state, step) {
    const { symbols } = state;
    if (symbols.length === 0)
        return state;
    // Find the index of the first selected symbol (-1 if none)
    const currentIdx = symbols.findIndex((s) => state.selection.has(s.id));
    const newIdx = ((currentIdx + step) % symbols.length + symbols.length) % symbols.length;
    return { ...state, selection: new Set([symbols[newIdx].id]) };
}
//# sourceMappingURL=SelectionEngine.js.map