"use strict";
/**
 * Pure state machine for hierarchical palette navigation.
 *
 * This module knows nothing about ALPHABET or GROUPS — callers pass the
 * current item list so the core remains data-agnostic.
 *
 * focusStack stores the focusedIndex from each parent level so it can be
 * restored when the user presses Back / Escape.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_PALETTE_NAV = void 0;
exports.paletteNavigate = paletteNavigate;
exports.paletteEnterGroup = paletteEnterGroup;
exports.paletteEnterBase = paletteEnterBase;
exports.paletteSetVariantTab = paletteSetVariantTab;
exports.paletteBack = paletteBack;
exports.paletteColumns = paletteColumns;
exports.paletteLevel2FocusedKey = paletteLevel2FocusedKey;
exports.INITIAL_PALETTE_NAV = {
    level: 0,
    selectedGroup: null,
    selectedBase: null,
    variantTab: 0,
    focusedIndex: 0,
    focusStack: [],
};
/** Move focus within the current grid. Up/Down are clamped; Left/Right wrap. */
function paletteNavigate(state, direction, columns, itemCount) {
    if (itemCount === 0 || columns === 0)
        return state;
    let idx = state.focusedIndex;
    switch (direction) {
        case 'left':
            idx = (idx - 1 + itemCount) % itemCount;
            break;
        case 'right':
            idx = (idx + 1) % itemCount;
            break;
        case 'up': {
            const prev = idx - columns;
            idx = prev >= 0 ? prev : idx;
            break;
        }
        case 'down': {
            const next = idx + columns;
            idx = next < itemCount ? next : idx;
            break;
        }
    }
    return { ...state, focusedIndex: idx };
}
/** Drill into level 1 (a group was chosen). */
function paletteEnterGroup(state, groupKey) {
    return {
        ...state,
        level: 1,
        selectedGroup: groupKey,
        focusedIndex: 0,
        focusStack: [...state.focusStack, state.focusedIndex],
    };
}
/** Drill into level 2 (a base symbol was chosen). */
function paletteEnterBase(state, baseKey) {
    return {
        ...state,
        level: 2,
        selectedBase: baseKey.slice(0, 4) + '00',
        variantTab: 0,
        focusedIndex: 0,
        focusStack: [...state.focusStack, state.focusedIndex],
    };
}
/** Switch variant tab at level 2 (rotations 0–7 vs 8–f). */
function paletteSetVariantTab(state, tab) {
    if (state.level !== 2)
        return state;
    return { ...state, variantTab: tab, focusedIndex: 0 };
}
/** Go back one level, restoring the previous focused index. */
function paletteBack(state) {
    var _a;
    const stack = state.focusStack;
    const restoredIndex = stack.length > 0 ? ((_a = stack[stack.length - 1]) !== null && _a !== void 0 ? _a : 0) : 0;
    const newStack = stack.slice(0, -1);
    if (state.level === 2) {
        return {
            ...state,
            level: 1,
            selectedBase: null,
            variantTab: 0,
            focusedIndex: restoredIndex,
            focusStack: newStack,
        };
    }
    if (state.level === 1) {
        return {
            ...state,
            level: 0,
            selectedGroup: null,
            focusedIndex: restoredIndex,
            focusStack: newStack,
        };
    }
    return state;
}
/** Number of grid columns at the current level. */
function paletteColumns(state) {
    return state.level === 2 ? 8 : 4;
}
/**
 * Compute the FSW key for the focused cell at level 2.
 * Returns null when not at level 2 or selectedBase is absent.
 * For levels 0/1 the caller should index into its own items array.
 */
function paletteLevel2FocusedKey(state) {
    if (state.level !== 2 || state.selectedBase === null)
        return null;
    const cols = 8;
    const fill = Math.floor(state.focusedIndex / cols);
    const rot = (state.focusedIndex % cols) + state.variantTab * 8;
    if (fill >= 6)
        return null;
    return state.selectedBase.slice(0, 4) + fill.toString() + rot.toString(16);
}
//# sourceMappingURL=PaletteNavigationState.js.map