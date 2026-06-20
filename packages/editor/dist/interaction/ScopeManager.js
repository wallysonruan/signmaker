"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScopeState = createScopeState;
exports.toggleScope = toggleScope;
exports.enterScope = enterScope;
function createScopeState(initial = 'canvas') {
    return { activeScope: initial };
}
function toggleScope(state) {
    return { activeScope: state.activeScope === 'canvas' ? 'palette' : 'canvas' };
}
function enterScope(state, scope) {
    if (state.activeScope === scope)
        return state;
    return { activeScope: scope };
}
//# sourceMappingURL=ScopeManager.js.map