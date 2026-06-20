import { type ActionName, type KeyBinding } from '../KeyboardBindings';
import type { ScopeState } from './ScopeManager';
import type { PaletteNavigationState } from './PaletteNavigationState';
export interface ScopedRouterOptions {
    /** Key binding that toggles between Palette and Canvas scopes. Default: F6 (keyCode 117). */
    scopeSwitchBinding?: KeyBinding;
    /** Canvas key bindings. Defaults to DEFAULT_BINDINGS. */
    canvasBindings?: ReadonlyArray<readonly [KeyBinding, ActionName]>;
}
export type ScopedRouterResult = {
    type: 'toggleScope';
} | {
    type: 'paletteNavigate';
    direction: 'up' | 'down' | 'left' | 'right';
} | {
    type: 'paletteExpand';
} | {
    type: 'paletteBack';
} | {
    type: 'paletteAdd';
} | {
    type: 'canvasAction';
    action: ActionName;
} | {
    type: 'none';
};
export interface KeyEventDescriptor {
    readonly keyCode: number;
    readonly key: string;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
}
/**
 * Pure keyboard router.
 *
 * Takes a raw key event descriptor and the current scope + palette nav state,
 * and returns a discriminated-union result describing what should happen.
 * No side effects — callers apply the result.
 */
export declare function routeKeyEvent(e: KeyEventDescriptor, scope: ScopeState, palette: PaletteNavigationState, options?: ScopedRouterOptions): ScopedRouterResult;
//# sourceMappingURL=ScopedKeyboardRouter.d.ts.map