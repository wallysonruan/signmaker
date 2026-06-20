export type ActiveScope = 'palette' | 'canvas';

export interface ScopeState {
  readonly activeScope: ActiveScope;
}

export function createScopeState(initial: ActiveScope = 'canvas'): ScopeState {
  return { activeScope: initial };
}

export function toggleScope(state: ScopeState): ScopeState {
  return { activeScope: state.activeScope === 'canvas' ? 'palette' : 'canvas' };
}

export function enterScope(state: ScopeState, scope: ActiveScope): ScopeState {
  if (state.activeScope === scope) return state;
  return { activeScope: scope };
}
