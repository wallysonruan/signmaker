import type { Scope } from './createScopeManager';
import type { Unsubscribe } from '../CommandBus';
import { type PaletteNavigationState } from './PaletteNavigationState';
export interface PaletteScopeDeps {
    /** Items shown at the current level (GROUPS, ALPHABET[group], or [] at variants). */
    itemsAt(state: PaletteNavigationState): readonly string[];
    /** Grid column count at the current level (8 at variants, else 4). */
    columnsAt(state: PaletteNavigationState): number;
    /** Number of focusable cells at the current level (48 at variants, else items.length). */
    itemCountAt(state: PaletteNavigationState): number;
    /** Called when the focused symbol should be added to the canvas (plain Enter). */
    onAddSymbol(key: string): void;
    /** Optional starting navigation state. Default: INITIAL_PALETTE_NAV. */
    initialNav?: PaletteNavigationState;
}
export interface PaletteScope {
    /** The interaction scope; register it with a ScopeManager. */
    readonly scope: Scope;
    getNav(): PaletteNavigationState;
    /** Replace the navigation state (e.g. from a controlled v-model). */
    setNav(state: PaletteNavigationState): void;
    navigate(direction: 'up' | 'down' | 'left' | 'right'): void;
    /** Drill into the next level, or toggle the variant tab at the variants level. */
    expand(): void;
    /** Go back one level. */
    back(): void;
    /** The FSW key focused at the current level, or null. */
    focusedKey(): string | null;
    /** Notified after every navigation-state change. */
    onNavChanged(fn: (state: PaletteNavigationState) => void): Unsubscribe;
}
/**
 * Build the palette interaction scope: it owns the hierarchical navigation state
 * machine and the keyboard semantics (arrows move, Enter adds, Ctrl/Cmd+Enter
 * drills in, Escape goes back). F6 and Escape-at-groups are intentionally left
 * unconsumed so they bubble to the scope-switch handler.
 *
 * Data-agnostic: callers inject the item/column/count providers so this core has
 * no knowledge of ALPHABET/GROUPS.
 */
export declare function createPaletteScope(deps: PaletteScopeDeps): PaletteScope;
//# sourceMappingURL=createPaletteScope.d.ts.map