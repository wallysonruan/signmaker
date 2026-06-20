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
  readonly level:         PaletteLevel;
  readonly selectedGroup: string | null;
  readonly selectedBase:  string | null;
  readonly variantTab:    VariantTab;
  readonly focusedIndex:  number;
  readonly focusStack:    readonly number[];
}

export const INITIAL_PALETTE_NAV: PaletteNavigationState = {
  level:         'groups',
  selectedGroup: null,
  selectedBase:  null,
  variantTab:    'first',
  focusedIndex:  0,
  focusStack:    [],
};

/** Move focus within the current grid. Up/Down are clamped; Left/Right wrap. */
export function paletteNavigate(
  state:     PaletteNavigationState,
  direction: 'up' | 'down' | 'left' | 'right',
  columns:   number,
  itemCount: number,
): PaletteNavigationState {
  if (itemCount === 0 || columns === 0) return state;

  let idx = state.focusedIndex;
  switch (direction) {
    case 'left':  idx = (idx - 1 + itemCount) % itemCount; break;
    case 'right': idx = (idx + 1) % itemCount;             break;
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

/** Drill into the bases level (a group was chosen). */
export function paletteEnterGroup(
  state:    PaletteNavigationState,
  groupKey: string,
): PaletteNavigationState {
  return {
    ...state,
    level:         'bases',
    selectedGroup: groupKey,
    focusedIndex:  0,
    focusStack:    [...state.focusStack, state.focusedIndex],
  };
}

/** Drill into the variants level (a base symbol was chosen). */
export function paletteEnterBase(
  state:   PaletteNavigationState,
  baseKey: string,
): PaletteNavigationState {
  return {
    ...state,
    level:        'variants',
    selectedBase: baseKey.slice(0, 4) + '00',
    variantTab:   'first',
    focusedIndex: 0,
    focusStack:   [...state.focusStack, state.focusedIndex],
  };
}

/** Switch variant tab at the variants level (rotations 0–7 vs 8–f). */
export function paletteSetVariantTab(
  state: PaletteNavigationState,
  tab:   VariantTab,
): PaletteNavigationState {
  if (state.level !== 'variants') return state;
  return { ...state, variantTab: tab, focusedIndex: 0 };
}

/** Go back one level, restoring the previous focused index. */
export function paletteBack(state: PaletteNavigationState): PaletteNavigationState {
  const stack = state.focusStack;
  const restoredIndex = stack.length > 0 ? (stack[stack.length - 1] ?? 0) : 0;
  const newStack = stack.slice(0, -1);

  if (state.level === 'variants') {
    return {
      ...state,
      level:        'bases',
      selectedBase: null,
      variantTab:   'first',
      focusedIndex: restoredIndex,
      focusStack:   newStack,
    };
  }
  if (state.level === 'bases') {
    return {
      ...state,
      level:         'groups',
      selectedGroup: null,
      focusedIndex:  restoredIndex,
      focusStack:    newStack,
    };
  }
  return state;
}

/** Number of grid columns at the current level. */
export function paletteColumns(state: PaletteNavigationState): number {
  return state.level === 'variants' ? 8 : 4;
}

/**
 * Compute the FSW key for the focused cell at the variants level.
 * Returns null when not at the variants level or selectedBase is absent.
 * For groups/bases levels the caller should index into its own items array.
 */
export function paletteLevel2FocusedKey(state: PaletteNavigationState): string | null {
  if (state.level !== 'variants' || state.selectedBase === null) return null;
  const cols = 8;
  const fill = Math.floor(state.focusedIndex / cols);
  const rot  = (state.focusedIndex % cols) + (state.variantTab === 'second' ? 8 : 0);
  if (fill >= 6) return null;
  return state.selectedBase.slice(0, 4) + fill.toString() + rot.toString(16);
}
