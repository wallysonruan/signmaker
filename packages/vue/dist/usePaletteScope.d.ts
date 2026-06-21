import { PaletteScope, PaletteNavigationState } from '@signwriter/editor';
/**
 * Vue wrapper around the framework-agnostic createPaletteScope. Supplies the
 * ALPHABET/GROUPS data providers so the palette component can delegate all
 * keyboard/navigation logic to the scope and stay a thin view adapter.
 *
 * Returns the full PaletteScope (scope + nav accessors + navigate/expand/back +
 * focusedKey + onNavChanged).
 */
export declare function usePaletteScope(onAddSymbol: (key: string) => void, initialNav?: PaletteNavigationState): PaletteScope;
//# sourceMappingURL=usePaletteScope.d.ts.map