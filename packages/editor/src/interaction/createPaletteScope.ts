import { createScope } from './createScopeManager';
import type { Scope } from './createScopeManager';
import type { KeyEventDescriptor } from './ScopedKeyboardRouter';
import type { Unsubscribe } from '../CommandBus';
import {
  INITIAL_PALETTE_NAV,
  paletteNavigate,
  paletteEnterGroup,
  paletteEnterBase,
  paletteSetVariantTab,
  paletteBack,
  paletteLevel2FocusedKey,
  type PaletteNavigationState,
} from './PaletteNavigationState';

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
export function createPaletteScope(deps: PaletteScopeDeps): PaletteScope {
  let nav: PaletteNavigationState = deps.initialNav ?? INITIAL_PALETTE_NAV;
  const changed: Array<(s: PaletteNavigationState) => void> = [];

  function setNav(next: PaletteNavigationState): void {
    if (next === nav) return;
    nav = next;
    changed.forEach(fn => fn(nav));
  }

  function focusedKey(): string | null {
    if (nav.level === 'variants') return paletteLevel2FocusedKey(nav);
    return deps.itemsAt(nav)[nav.focusedIndex] ?? null;
  }

  function navigate(direction: 'up' | 'down' | 'left' | 'right'): void {
    setNav(paletteNavigate(nav, direction, deps.columnsAt(nav), deps.itemCountAt(nav)));
  }

  function expand(): void {
    const key = focusedKey();
    if (nav.level === 'groups') {
      if (key === null) return;
      setNav(paletteEnterGroup(nav, key));
    } else if (nav.level === 'bases') {
      if (key === null) return;
      setNav(paletteEnterBase(nav, key));
    } else {
      // variants: Ctrl/Cmd+Enter toggles the rotation-range tab
      setNav(paletteSetVariantTab(nav, nav.variantTab === 'first' ? 'second' : 'first'));
    }
  }

  function back(): void {
    setNav(paletteBack(nav));
  }

  const DIR: Record<string, 'up' | 'down' | 'left' | 'right'> = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  };

  function handleKey(e: KeyEventDescriptor): boolean {
    // F6 is the global scope-switch key — let it bubble.
    if (e.key === 'F6' || e.keyCode === 117) return false;

    if (e.key === 'Escape') {
      // Back out a level; at the groups level let Escape bubble to switch scope.
      if (nav.level !== 'groups') { back(); return true; }
      return false;
    }

    const dir = DIR[e.key];
    if (dir) { navigate(dir); return true; }

    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) { expand(); return true; }
      const key = focusedKey();
      if (key !== null) deps.onAddSymbol(key);
      return true;
    }

    return false;
  }

  const scope = createScope('palette', { handleKey });

  return {
    scope,
    getNav: () => nav,
    setNav,
    navigate,
    expand,
    back,
    focusedKey,
    onNavChanged: (fn) => {
      changed.push(fn);
      return () => { const i = changed.indexOf(fn); if (i >= 0) changed.splice(i, 1); };
    },
  };
}
