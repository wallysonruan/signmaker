"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScope = createScope;
exports.createScopeManager = createScopeManager;
/** Create a minimal Scope with optional key handling. */
function createScope(name, init = {}) {
    var _a, _b;
    let enabled = (_a = init.enabled) !== null && _a !== void 0 ? _a : true;
    const enterHooks = [];
    const exitHooks = [];
    function sub(list, fn) {
        list.push(fn);
        return () => { const i = list.indexOf(fn); if (i >= 0)
            list.splice(i, 1); };
    }
    return {
        name,
        isEnabled: () => enabled,
        enable: () => { enabled = true; },
        disable: () => { enabled = false; },
        enter: () => { enterHooks.forEach(fn => fn()); },
        exit: () => { exitHooks.forEach(fn => fn()); },
        handleKey: (_b = init.handleKey) !== null && _b !== void 0 ? _b : (() => false),
        onEnter: fn => sub(enterHooks, fn),
        onExit: fn => sub(exitHooks, fn),
    };
}
function createScopeManager() {
    const scopes = new Map();
    let current = null;
    const onChanged = [];
    const beforeEnter = [];
    const afterEnter = [];
    const beforeExit = [];
    const afterExit = [];
    function sub(list, fn) {
        list.push(fn);
        return () => { const i = list.indexOf(fn); if (i >= 0)
            list.splice(i, 1); };
    }
    function exitCurrent() {
        var _a;
        if (current === null)
            return;
        const prev = current;
        beforeExit.forEach(fn => fn(prev));
        (_a = scopes.get(prev)) === null || _a === void 0 ? void 0 : _a.exit();
        afterExit.forEach(fn => fn(prev));
        current = null;
    }
    function register(scope) {
        scopes.set(scope.name, scope);
    }
    function unregister(name) {
        if (current === name)
            exit();
        scopes.delete(name);
    }
    function enable(name) {
        var _a;
        (_a = scopes.get(name)) === null || _a === void 0 ? void 0 : _a.enable();
    }
    function disable(name) {
        const scope = scopes.get(name);
        if (!scope)
            return;
        scope.disable();
        if (current === name)
            exit();
    }
    function enter(name) {
        const scope = scopes.get(name);
        if (!scope || !scope.isEnabled() || current === name)
            return;
        const prev = current;
        exitCurrent();
        beforeEnter.forEach(fn => fn(name));
        current = name;
        scope.enter();
        afterEnter.forEach(fn => fn(name));
        onChanged.forEach(fn => fn(name, prev));
    }
    function exit() {
        if (current === null)
            return;
        const prev = current;
        exitCurrent();
        onChanged.forEach(fn => fn(null, prev));
    }
    function routeKey(e) {
        var _a, _b;
        if (current === null)
            return false;
        return (_b = (_a = scopes.get(current)) === null || _a === void 0 ? void 0 : _a.handleKey(e)) !== null && _b !== void 0 ? _b : false;
    }
    return {
        register,
        unregister,
        enable,
        disable,
        enter,
        exit,
        currentScope: () => current,
        onScopeChanged: fn => sub(onChanged, fn),
        beforeScopeEnter: fn => sub(beforeEnter, fn),
        afterScopeEnter: fn => sub(afterEnter, fn),
        beforeScopeExit: fn => sub(beforeExit, fn),
        afterScopeExit: fn => sub(afterExit, fn),
        routeKey,
    };
}
//# sourceMappingURL=createScopeManager.js.map