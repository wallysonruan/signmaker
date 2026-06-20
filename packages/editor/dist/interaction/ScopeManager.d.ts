export type ActiveScope = 'palette' | 'canvas';
export interface ScopeState {
    readonly activeScope: ActiveScope;
}
export declare function createScopeState(initial?: ActiveScope): ScopeState;
export declare function toggleScope(state: ScopeState): ScopeState;
export declare function enterScope(state: ScopeState, scope: ActiveScope): ScopeState;
//# sourceMappingURL=ScopeManager.d.ts.map