import { ref, computed } from 'vue';
import {
  INITIAL_PALETTE_NAV,
  paletteNavigate,
  paletteEnterGroup,
  paletteEnterBase,
  paletteBack,
  paletteLevel2FocusedKey,
  paletteColumns,
  type PaletteNavigationState,
} from '@signwriter/editor';
import type { ComputedRef } from 'vue';
import { ALPHABET, GROUPS } from './data/alphabet';

export interface UsePaletteNavigationReturn {
  navState:   ComputedRef<PaletteNavigationState>;
  navigate(direction: 'up' | 'down' | 'left' | 'right'): void;
  expand():   void;
  back():     void;
  focusedKey: ComputedRef<string | null>;
}

/**
 * Standalone composable for palette navigation.
 * Use when the Palette is used without a ScopeManager.
 * For the combined Palette+Canvas model, prefer useScopeManager.
 */
export function usePaletteNavigation(): UsePaletteNavigationReturn {
  const nav = ref<PaletteNavigationState>(INITIAL_PALETTE_NAV);

  const currentItems = computed<readonly string[]>(() => {
    const s = nav.value;
    if (s.level === 'groups') return GROUPS;
    if (s.level === 'bases' && s.selectedGroup !== null) return ALPHABET[s.selectedGroup] ?? [];
    return [];
  });

  const cols      = computed(() => paletteColumns(nav.value));
  const itemCount = computed(() => nav.value.level === 'variants' ? 48 : currentItems.value.length);

  function navigate(direction: 'up' | 'down' | 'left' | 'right'): void {
    nav.value = paletteNavigate(nav.value, direction, cols.value, itemCount.value);
  }

  const focusedKey = computed<string | null>(() => {
    const s = nav.value;
    if (s.level === 'variants') return paletteLevel2FocusedKey(s);
    return currentItems.value[s.focusedIndex] ?? null;
  });

  function expand(): void {
    const s   = nav.value;
    const key = focusedKey.value;
    if (key === null) return;
    if (s.level === 'groups') nav.value = paletteEnterGroup(s, key);
    else if (s.level === 'bases') nav.value = paletteEnterBase(s, key);
  }

  function back(): void {
    nav.value = paletteBack(nav.value);
  }

  return {
    navState:   computed(() => nav.value),
    navigate,
    expand,
    back,
    focusedKey,
  };
}
