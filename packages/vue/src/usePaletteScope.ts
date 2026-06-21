import {
  createPaletteScope,
  type PaletteScope,
  type PaletteNavigationState,
} from '@signwriter/editor';
import { ALPHABET, GROUPS } from './data/alphabet';

/**
 * Vue wrapper around the framework-agnostic createPaletteScope. Supplies the
 * ALPHABET/GROUPS data providers so the palette component can delegate all
 * keyboard/navigation logic to the scope and stay a thin view adapter.
 *
 * Returns the full PaletteScope (scope + nav accessors + navigate/expand/back +
 * focusedKey + onNavChanged).
 */
export function usePaletteScope(
  onAddSymbol: (key: string) => void,
  initialNav?: PaletteNavigationState,
): PaletteScope {
  return createPaletteScope({
    onAddSymbol,
    initialNav,
    itemsAt: (s) => {
      if (s.level === 'groups') return GROUPS;
      if (s.level === 'bases' && s.selectedGroup !== null) return ALPHABET[s.selectedGroup] ?? [];
      return [];
    },
    columnsAt:   (s) => (s.level === 'variants' ? 8 : 4),
    itemCountAt: (s) => {
      if (s.level === 'variants') return 48; // 6 fills × 8 rotations
      if (s.level === 'groups') return GROUPS.length;
      if (s.level === 'bases' && s.selectedGroup !== null) return (ALPHABET[s.selectedGroup] ?? []).length;
      return 0;
    },
  });
}
