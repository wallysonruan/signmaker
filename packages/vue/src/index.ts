export { useEditorState } from './useEditorState';
export type { UseEditorStateReturn, UseEditorStateOptions } from './useEditorState';
export type {
  CommandBusPort, BeforeHook, AfterHook, Interceptor, Unsubscribe,
  HistoryPort, ReversibleCommand, HistoryCommandHook,
} from '@signwriter/editor';
export { createCommandBus, createDefaultHistory, createMementoCommand } from '@signwriter/editor';

export { useSymbolDrag } from './useSymbolDrag';
export type { UseSymbolDragReturn } from './useSymbolDrag';

export { usePaletteDrag } from './usePaletteDrag';
export type { UsePaletteDragReturn } from './usePaletteDrag';

export { useKeyboard } from './useKeyboard';
export type { UseKeyboardReturn } from './useKeyboard';

export { usePaletteScope } from './usePaletteScope';

export { useScopeManager } from './useScopeManager';
export type { UseScopeManagerReturn } from './useScopeManager';
export type {
  Scope, ScopeInit, ScopeManager, ScopeHook, ScopeChangedHook,
  FocusManagerPort, FocusTarget, FocusTargetFn,
  CanvasScopeDeps, PaletteScope, PaletteScopeDeps,
} from '@signwriter/editor';
export {
  createScope, createScopeManager, createFocusManager,
  createCanvasScope, createPaletteScope,
} from '@signwriter/editor';
export type { UseScopeManagerOptions } from './useScopeManager';

// Composition root — the single recommended entry point.
export { useSignMaker } from './useSignMaker';
export type { UseSignMakerReturn, UseSignMakerOptions } from './useSignMaker';
export type { SignMaker, SignMakerDeps } from '@signwriter/editor';
export { createSignMaker } from '@signwriter/editor';

export { default as SymbolPalette }    from './components/SymbolPalette.vue';
export { default as SignEditorCanvas } from './components/SignEditorCanvas.vue';
export { default as SymbolHandles }    from './components/SymbolHandles.vue';
export { default as FswPanel }         from './components/FswPanel.vue';
