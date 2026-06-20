import { PaletteNavigationState } from '@signwriter/editor';
import { ComputedRef } from 'vue';
export interface UsePaletteNavigationReturn {
    navState: ComputedRef<PaletteNavigationState>;
    navigate(direction: 'up' | 'down' | 'left' | 'right'): void;
    expand(): void;
    back(): void;
    focusedKey: ComputedRef<string | null>;
}
/**
 * Standalone composable for palette navigation.
 * Use when the Palette is used without a ScopeManager.
 * For the combined Palette+Canvas model, prefer useScopeManager.
 */
export declare function usePaletteNavigation(): UsePaletteNavigationReturn;
//# sourceMappingURL=usePaletteNavigation.d.ts.map