/**
 * Pure state machine for hierarchical palette navigation.
 *
 * This module knows nothing about ALPHABET or GROUPS — callers pass the
 * current item list so the core remains data-agnostic.
 *
 * focusStack stores the focusedIndex from each parent level so it can be
 * restored when the user presses Back / Escape.
 */
/** The three drill-down levels of the symbol palette. */
export type PaletteLevel = 'groups' | 'bases' | 'variants';
/** Which rotation-range tab is visible at the variants level. */
export type VariantTab = 'first' | 'second';
export interface PaletteNavigationState {
    readonly level: PaletteLevel;
    readonly selectedGroup: string | null;
    readonly selectedBase: string | null;
    readonly variantTab: VariantTab;
    readonly focusedIndex: number;
    readonly focusStack: readonly number[];
}
export declare const INITIAL_PALETTE_NAV: PaletteNavigationState;
/** Move focus within the current grid. Up/Down are clamped; Left/Right wrap. */
export declare function paletteNavigate(state: PaletteNavigationState, direction: 'up' | 'down' | 'left' | 'right', columns: number, itemCount: number): PaletteNavigationState;
/** Drill into the bases level (a group was chosen). */
export declare function paletteEnterGroup(state: PaletteNavigationState, groupKey: string): PaletteNavigationState;
/** Drill into the variants level (a base symbol was chosen). */
export declare function paletteEnterBase(state: PaletteNavigationState, baseKey: string): PaletteNavigationState;
/** Switch variant tab at the variants level (rotations 0–7 vs 8–f). */
export declare function paletteSetVariantTab(state: PaletteNavigationState, tab: VariantTab): PaletteNavigationState;
/** Go back one level, restoring the previous focused index. */
export declare function paletteBack(state: PaletteNavigationState): PaletteNavigationState;
/** Number of grid columns at the current level. */
export declare function paletteColumns(state: PaletteNavigationState): number;
/**
 * Compute the FSW key for the focused cell at the variants level.
 * Returns null when not at the variants level or selectedBase is absent.
 * For groups/bases levels the caller should index into its own items array.
 */
export declare function paletteLevel2FocusedKey(state: PaletteNavigationState): string | null;
//# sourceMappingURL=PaletteNavigationState.d.ts.map