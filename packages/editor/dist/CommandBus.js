"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommandBus = createCommandBus;
function createCommandBus(init) {
    const befores = [];
    const afters = [];
    const intercepts = [];
    function matches(filter, name) {
        return filter === '*' || filter === name;
    }
    function makeUnsub(list, entry) {
        return () => {
            const i = list.indexOf(entry);
            if (i >= 0)
                list.splice(i, 1);
        };
    }
    function dispatch(name, transform, payload = undefined) {
        let current = transform;
        for (const { filter, fn } of intercepts) {
            if (!matches(filter, name))
                continue;
            const result = fn(name, current, payload);
            if (result.action === 'cancel')
                return { status: 'cancelled' };
            if (result.action === 'handled')
                return { status: 'handled' };
            if (result.action === 'continue' && result.transform)
                current = result.transform;
        }
        for (const { filter, fn } of befores) {
            if (matches(filter, name))
                fn(name, payload);
        }
        const state = init.apply(current, name);
        for (const { filter, fn } of afters) {
            if (matches(filter, name))
                fn(name, state, payload);
        }
        return { status: 'applied', state };
    }
    function beforeCommand(filter, fn) {
        const entry = { filter, fn };
        befores.push(entry);
        return makeUnsub(befores, entry);
    }
    function afterCommand(filter, fn) {
        const entry = { filter, fn };
        afters.push(entry);
        return makeUnsub(afters, entry);
    }
    function intercept(filter, fn) {
        const entry = { filter, fn };
        intercepts.push(entry);
        return makeUnsub(intercepts, entry);
    }
    return { dispatch, beforeCommand, afterCommand, intercept };
}
//# sourceMappingURL=CommandBus.js.map