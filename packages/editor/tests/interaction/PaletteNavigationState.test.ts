import {
  INITIAL_PALETTE_NAV,
  paletteNavigate,
  paletteEnterGroup,
  paletteEnterBase,
  paletteSetVariantTab,
  paletteBack,
  paletteLevel2FocusedKey,
} from '../../src/interaction/PaletteNavigationState';

describe('paletteNavigate', () => {
  const nav = INITIAL_PALETTE_NAV; // level 0, focusedIndex 0

  test('moves right within row', () => {
    expect(paletteNavigate(nav, 'right', 4, 31).focusedIndex).toBe(1);
  });

  test('wraps left from index 0 to last', () => {
    expect(paletteNavigate(nav, 'left', 4, 31).focusedIndex).toBe(30);
  });

  test('wraps right from last to 0', () => {
    const last = { ...nav, focusedIndex: 30 };
    expect(paletteNavigate(last, 'right', 4, 31).focusedIndex).toBe(0);
  });

  test('moves down by column count', () => {
    expect(paletteNavigate(nav, 'down', 4, 31).focusedIndex).toBe(4);
  });

  test('clamps down at last row', () => {
    const bottomRow = { ...nav, focusedIndex: 28 };
    expect(paletteNavigate(bottomRow, 'down', 4, 31).focusedIndex).toBe(28);
  });

  test('clamps up at first row', () => {
    expect(paletteNavigate(nav, 'up', 4, 31).focusedIndex).toBe(0);
  });

  test('moves up to previous row', () => {
    const row2 = { ...nav, focusedIndex: 5 };
    expect(paletteNavigate(row2, 'up', 4, 31).focusedIndex).toBe(1);
  });

  test('no-op on empty list', () => {
    expect(paletteNavigate(nav, 'right', 4, 0).focusedIndex).toBe(0);
  });

  test('variant grid: 8 columns', () => {
    expect(paletteNavigate(nav, 'right', 8, 48).focusedIndex).toBe(1);
    expect(paletteNavigate({ ...nav, focusedIndex: 0 }, 'down', 8, 48).focusedIndex).toBe(8);
  });
});

describe('paletteEnterGroup', () => {
  test('transitions to level 1 and pushes index to stack', () => {
    const state = { ...INITIAL_PALETTE_NAV, focusedIndex: 3 };
    const next  = paletteEnterGroup(state, 'S10000');
    expect(next.level).toBe(1);
    expect(next.selectedGroup).toBe('S10000');
    expect(next.focusedIndex).toBe(0);
    expect(next.focusStack).toEqual([3]);
  });
});

describe('paletteEnterBase', () => {
  test('transitions to level 2 and normalises base key', () => {
    const state = { ...INITIAL_PALETTE_NAV, level: 1 as const, selectedGroup: 'S10000', focusedIndex: 2, focusStack: [3] };
    const next  = paletteEnterBase(state, 'S10020');
    expect(next.level).toBe(2);
    expect(next.selectedBase).toBe('S10000');
    expect(next.variantTab).toBe(0);
    expect(next.focusedIndex).toBe(0);
    expect(next.focusStack).toEqual([3, 2]);
  });
});

describe('paletteSetVariantTab', () => {
  test('switches tab and resets focusedIndex', () => {
    const state = { ...INITIAL_PALETTE_NAV, level: 2 as const, selectedBase: 'S10000', focusedIndex: 5, focusStack: [] };
    const next  = paletteSetVariantTab(state, 1);
    expect(next.variantTab).toBe(1);
    expect(next.focusedIndex).toBe(0);
  });

  test('no-op at level 0', () => {
    const next = paletteSetVariantTab(INITIAL_PALETTE_NAV, 1);
    expect(next.variantTab).toBe(0);
  });
});

describe('paletteBack', () => {
  test('goes from level 2 to level 1 and restores focusedIndex', () => {
    const state = { ...INITIAL_PALETTE_NAV, level: 2 as const, selectedGroup: 'S10000', selectedBase: 'S10000', focusedIndex: 10, focusStack: [3, 2] };
    const next  = paletteBack(state);
    expect(next.level).toBe(1);
    expect(next.selectedBase).toBeNull();
    expect(next.focusedIndex).toBe(2);
    expect(next.focusStack).toEqual([3]);
  });

  test('goes from level 1 to level 0 and restores focusedIndex', () => {
    const state = { ...INITIAL_PALETTE_NAV, level: 1 as const, selectedGroup: 'S10000', focusedIndex: 5, focusStack: [3] };
    const next  = paletteBack(state);
    expect(next.level).toBe(0);
    expect(next.selectedGroup).toBeNull();
    expect(next.focusedIndex).toBe(3);
    expect(next.focusStack).toEqual([]);
  });

  test('no-op at level 0', () => {
    const state = paletteBack(INITIAL_PALETTE_NAV);
    expect(state.level).toBe(0);
  });
});

describe('paletteLevel2FocusedKey', () => {
  const base = { ...INITIAL_PALETTE_NAV, level: 2 as const, selectedBase: 'S10000' };

  test('first cell (fill 0, rot 0) on tab 0', () => {
    expect(paletteLevel2FocusedKey({ ...base, focusedIndex: 0, variantTab: 0 })).toBe('S10000');
  });

  test('second cell (fill 0, rot 1) on tab 0', () => {
    expect(paletteLevel2FocusedKey({ ...base, focusedIndex: 1, variantTab: 0 })).toBe('S10001');
  });

  test('first cell of row 1 (fill 1, rot 0) on tab 0', () => {
    expect(paletteLevel2FocusedKey({ ...base, focusedIndex: 8, variantTab: 0 })).toBe('S10010');
  });

  test('first cell on tab 1 applies rotation offset 8', () => {
    expect(paletteLevel2FocusedKey({ ...base, focusedIndex: 0, variantTab: 1 })).toBe('S10008');
  });

  test('returns null when not at level 2', () => {
    expect(paletteLevel2FocusedKey(INITIAL_PALETTE_NAV)).toBeNull();
  });
});
