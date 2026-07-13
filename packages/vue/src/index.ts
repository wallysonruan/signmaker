export { useEditorState } from './useEditorState';
export type { UseEditorStateReturn, UseEditorStateOptions } from './useEditorState';
export type {
  CommandBusPort, BeforeHook, AfterHook, Interceptor, Unsubscribe,
  HistoryPort, ReversibleCommand, HistoryCommandHook,
} from '@wallysonruan/signmaker-editor-engine';
export { createCommandBus, createDefaultHistory, createMementoCommand } from '@wallysonruan/signmaker-editor-engine';

export { useSymbolDrag } from './useSymbolDrag';
export type { UseSymbolDragReturn } from './useSymbolDrag';

export { useViewport } from './useViewport';
export type { UseViewportReturn } from './useViewport';

export { usePaletteDrag } from './usePaletteDrag';
export type { UsePaletteDragReturn } from './usePaletteDrag';

export { debounce } from '@wallysonruan/signmaker-editor-engine';
export type { DebouncedFn } from '@wallysonruan/signmaker-editor-engine';

export { useKeyboard } from './useKeyboard';
export type { UseKeyboardReturn } from './useKeyboard';

export { usePaletteScope } from './usePaletteScope';

export { useScopeManager } from './useScopeManager';
export type { UseScopeManagerReturn } from './useScopeManager';
export type {
  Scope, ScopeInit, ScopeManager, ScopeHook, ScopeChangedHook,
  FocusManagerPort, FocusTarget, FocusTargetFn,
  CanvasScopeDeps, PaletteScope, PaletteScopeDeps,
} from '@wallysonruan/signmaker-editor-engine';
export {
  createScope, createScopeManager, createFocusManager,
  createCanvasScope, createPaletteScope,
} from '@wallysonruan/signmaker-editor-engine';
export type { UseScopeManagerOptions } from './useScopeManager';

// Composition root — the single recommended entry point.
export { useSignMaker } from './useSignMaker';
export type { UseSignMakerReturn, UseSignMakerOptions } from './useSignMaker';
export type { SignMaker, SignMakerDeps } from '@wallysonruan/signmaker-editor-engine';
export { createSignMaker } from '@wallysonruan/signmaker-editor-engine';

export { default as SymbolPalette }    from './components/SymbolPalette.vue';
export { default as SignEditorCanvas } from './components/SignEditorCanvas.vue';
export { default as SymbolHandles }    from './components/SymbolHandles.vue';
export { default as ZoomControls }     from './components/ZoomControls.vue';
export { default as FswPanel }         from './components/FswPanel.vue';
export { default as ToolbarPanel }     from './components/ToolbarPanel.vue';
