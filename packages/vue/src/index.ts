export { useEditorState } from './useEditorState';
export type { UseEditorStateReturn } from './useEditorState';
export type { CommandBusPort, BeforeHook, AfterHook, Interceptor, Unsubscribe } from '@signwriter/editor';
export { createCommandBus } from '@signwriter/editor';

export { useSymbolDrag } from './useSymbolDrag';
export type { UseSymbolDragReturn } from './useSymbolDrag';

export { useKeyboard } from './useKeyboard';
export type { UseKeyboardReturn } from './useKeyboard';

export { usePaletteNavigation } from './usePaletteNavigation';
export type { UsePaletteNavigationReturn } from './usePaletteNavigation';

export { useScopeManager } from './useScopeManager';
export type { UseScopeManagerReturn } from './useScopeManager';
export type {
  Scope, ScopeInit, ScopeManager, ScopeHook, ScopeChangedHook,
  FocusManagerPort, FocusTarget, FocusTargetFn,
} from '@signwriter/editor';
export { createScope, createScopeManager, createFocusManager } from '@signwriter/editor';
export type { UseScopeManagerOptions } from './useScopeManager';

export { default as SymbolPalette }    from './components/SymbolPalette.vue';
export { default as SignEditorCanvas } from './components/SignEditorCanvas.vue';
export { default as SymbolHandles }    from './components/SymbolHandles.vue';
export { default as FswPanel }         from './components/FswPanel.vue';
