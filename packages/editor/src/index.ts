export type { EditorState, EditorSymbol, Command, IdGenerator } from './types';
export { EMPTY_STATE } from './types';

export type {
  CommandBusPort,
  CommandBusInit,
  Unsubscribe,
  InterceptorResult,
  DispatchResult,
  BeforeHook,
  AfterHook,
  Interceptor,
} from './CommandBus';
export { createCommandBus } from './CommandBus';

// Re-exported so consumers of stateToFsw / stateToNormalizedFsw don't need
// to add @signwriter/layout as a direct dependency.
export type { SizeProvider } from '@signwriter/layout';

export * from './commands';

export { getSelected, selectNone, selectById, cycleSelection } from './SelectionEngine';

// Legacy snapshot-based functional history. Retained for the standalone path;
// the default editor wiring now uses the command-based HistoryPort below.
export type { History } from './CommandHistory';
export {
  createHistory, apply, canUndo, canRedo, undo, redo,
} from './CommandHistory';

// Command-based, replaceable history (ports & adapters).
export type {
  ReversibleCommand, HistoryPort, HistoryCommandHook,
} from './HistoryManager';
export { createDefaultHistory, createMementoCommand } from './HistoryManager';

export { stateFromFsw, stateToFsw, stateToNormalizedFsw } from './FSWBridge';

export type { ActionName, KeyBinding } from './KeyboardBindings';
export {
  DEFAULT_BINDINGS, lookupAction, actionToCommand,
} from './KeyboardBindings';

export type { DragState } from './DragEngine';
export { startDrag, updateDrag, endDrag, cancelDrag } from './DragEngine';

export type { PaletteNavigationState, PaletteLevel, VariantTab } from './interaction/PaletteNavigationState';
export {
  INITIAL_PALETTE_NAV,
  paletteNavigate,
  paletteEnterGroup,
  paletteEnterBase,
  paletteSetVariantTab,
  paletteBack,
  paletteColumns,
  paletteLevel2FocusedKey,
} from './interaction/PaletteNavigationState';

export type { ActiveScope, ScopeState } from './interaction/ScopeManager';
export { createScopeState, toggleScope, enterScope } from './interaction/ScopeManager';

export type {
  Scope, ScopeInit,
  ScopeManager, ScopeHook, ScopeChangedHook,
} from './interaction/createScopeManager';
export { createScope, createScopeManager } from './interaction/createScopeManager';

export type {
  FocusManagerPort, FocusTarget, FocusTargetFn,
} from './interaction/createFocusManager';
export { createFocusManager } from './interaction/createFocusManager';

export type { ScopedRouterOptions, ScopedRouterResult, KeyEventDescriptor } from './interaction/ScopedKeyboardRouter';
export { routeKeyEvent } from './interaction/ScopedKeyboardRouter';
