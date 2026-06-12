"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateFromFsw = stateFromFsw;
exports.stateToFsw = stateToFsw;
exports.stateToNormalizedFsw = stateToNormalizedFsw;
const fsw_1 = require("@signwriter/fsw");
const layout_1 = require("@signwriter/layout");
const types_1 = require("./types");
/**
 * Build an EditorState from a FSW string.
 *
 * Each parsed symbol is assigned a fresh ID via idGen.
 * Returns EMPTY_STATE for empty or invalid FSW.
 */
function stateFromFsw(fsw, idGen) {
    const clean = (0, fsw_1.extractSign)(fsw);
    if (!clean)
        return types_1.EMPTY_STATE;
    const sign = (0, fsw_1.parseFsw)(clean);
    if (!sign)
        return types_1.EMPTY_STATE;
    return {
        ...types_1.EMPTY_STATE,
        symbols: sign.symbols.map((s) => ({ id: idGen(), key: s.key, x: s.x, y: s.y })),
        sort: [...sign.sort],
        selection: new Set(),
    };
}
/**
 * Generate a live FSW string from EditorState.
 *
 * If a SizeProvider is supplied, the box coordinate (M xxx×yyy) is recomputed
 * from the actual bounding box (matching original fswlive() behavior).
 * Without a SizeProvider, the box is set to 500×500 as a placeholder.
 *
 * Returns empty string when the symbol list is empty (matches original behavior).
 */
function stateToFsw(state, sizeProvider) {
    if (state.symbols.length === 0)
        return '';
    const symbols = state.symbols.map((s) => ({ key: s.key, x: s.x, y: s.y }));
    let sign = {
        sort: [...state.sort],
        box: 'M',
        box_x: 500,
        box_y: 500,
        symbols,
    };
    if (sizeProvider) {
        sign = (0, layout_1.recomputeBoxCoord)(sign, sizeProvider);
    }
    return (0, fsw_1.generateFsw)(sign);
}
/**
 * Generate a normalized FSW string from EditorState.
 *
 * Requires a SizeProvider to compute bounding box for centering.
 * Returns empty string for an empty state.
 */
function stateToNormalizedFsw(state, sizeProvider) {
    if (state.symbols.length === 0)
        return '';
    const symbols = state.symbols.map((s) => ({ key: s.key, x: s.x, y: s.y }));
    const sign = { sort: [...state.sort], box: 'M', box_x: 500, box_y: 500, symbols };
    const normalized = (0, layout_1.normalizeFsw)(sign, sizeProvider);
    return (0, fsw_1.generateFsw)(normalized);
}
//# sourceMappingURL=FSWBridge.js.map